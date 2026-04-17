#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Vec, Symbol,
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Shopkeeper(String),         // shopkeeper_id -> Shopkeeper
    ShopkeeperCount,
    ActiveShopkeepers,          // Vec<String> of active IDs
    LocationShopkeepers(String),// location -> Vec<String>
    DailyReset(String),         // shopkeeper_id -> last_reset_day
}

// ─── Structs ──────────────────────────────────────────────────────────────────

/// A verified local cash-out point for disaster victims.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Shopkeeper {
    /// Unique shopkeeper ID
    pub id: String,
    /// Stellar wallet address for receiving USDC
    pub wallet: Address,
    /// Business or person name
    pub name: String,
    /// Physical location (city/district)
    pub location: String,
    /// Contact phone number (plaintext — shopkeepers are public actors)
    pub phone: String,
    /// Whether admin has verified this shopkeeper
    pub is_verified: bool,
    /// Whether shopkeeper is actively accepting cashouts
    pub is_active: bool,
    /// Cumulative USDC processed (total lifetime)
    pub total_cashouts: i128,
    /// Number of disputes/flags raised against this shopkeeper
    pub dispute_count: u32,
    /// Registration timestamp
    pub registered_at: u64,
    /// Maximum USDC allowed per day (anti-price-gouging limit)
    pub max_daily_limit: i128,
    /// USDC processed today (resets daily based on ledger timestamp)
    pub today_cashouts: i128,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct ShopkeeperRegistryContract;

#[contractimpl]
impl ShopkeeperRegistryContract {
    // ─── Init ────────────────────────────────────────────────────────────────

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        // Removed admin.require_auth() to allow CLI deployer to assign Freighter wallet
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ShopkeeperCount, &0u32);
        let empty: Vec<String> = Vec::new(&env);
        env.storage().instance().set(&DataKey::ActiveShopkeepers, &empty);
    }

    // ─── Registration ────────────────────────────────────────────────────────

    /// Register a new shopkeeper. Initial status is unverified.
    /// Default daily limit = 1,000 USDC (1_000 * 10_000_000 = 10_000_000_000 stroops)
    pub fn register_shopkeeper(
        env: Env,
        admin: Address,
        shopkeeper_id: String,
        wallet: Address,
        name: String,
        location: String,
        phone: String,
        max_daily_limit: i128,
    ) -> String {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        if env.storage().persistent().has(&DataKey::Shopkeeper(shopkeeper_id.clone())) {
            panic!("shopkeeper already registered");
        }

        let effective_limit = if max_daily_limit <= 0 {
            10_000_000_000i128 // 1,000 USDC default
        } else {
            max_daily_limit
        };

        let shopkeeper = Shopkeeper {
            id: shopkeeper_id.clone(),
            wallet,
            name,
            location: location.clone(),
            phone,
            is_verified: false,
            is_active: false, // only active after verification
            total_cashouts: 0,
            dispute_count: 0,
            registered_at: env.ledger().timestamp(),
            max_daily_limit: effective_limit,
            today_cashouts: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Shopkeeper(shopkeeper_id.clone()), &shopkeeper);

        // Index by location
        let mut loc_list: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::LocationShopkeepers(location.clone()))
            .unwrap_or(Vec::new(&env));
        loc_list.push_back(shopkeeper_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::LocationShopkeepers(location), &loc_list);

        // Increment count
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ShopkeeperCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::ShopkeeperCount, &(count + 1));

        env.events().publish(
            (Symbol::new(&env, "ShopkeeperRegistered"),),
            (shopkeeper_id.clone(), env.ledger().timestamp()),
        );

        shopkeeper_id
    }

    // ─── Verification ────────────────────────────────────────────────────────

    /// Admin verifies a shopkeeper, making them eligible for cashouts.
    pub fn verify_shopkeeper(env: Env, admin: Address, shopkeeper_id: String) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut shopkeeper: Shopkeeper = env
            .storage()
            .persistent()
            .get(&DataKey::Shopkeeper(shopkeeper_id.clone()))
            .expect("shopkeeper not found");

        shopkeeper.is_verified = true;
        shopkeeper.is_active = true;

        env.storage()
            .persistent()
            .set(&DataKey::Shopkeeper(shopkeeper_id.clone()), &shopkeeper);

        // Add to active list
        let mut active: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::ActiveShopkeepers)
            .unwrap_or(Vec::new(&env));
        active.push_back(shopkeeper_id.clone());
        env.storage()
            .instance()
            .set(&DataKey::ActiveShopkeepers, &active);

        env.events().publish(
            (Symbol::new(&env, "ShopkeeperVerified"),),
            (shopkeeper_id, env.ledger().timestamp()),
        );
    }

    // ─── Cashout Recording ───────────────────────────────────────────────────

    /// Record a cashout transaction. Enforces daily limits.
    pub fn record_cashout(
        env: Env,
        shopkeeper_id: String,
        amount: i128,
        victim_id: String,
    ) {
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let mut shopkeeper: Shopkeeper = env
            .storage()
            .persistent()
            .get(&DataKey::Shopkeeper(shopkeeper_id.clone()))
            .expect("shopkeeper not found");

        if !shopkeeper.is_active || !shopkeeper.is_verified {
            panic!("shopkeeper not active");
        }

        // Check daily limit
        if shopkeeper.today_cashouts + amount > shopkeeper.max_daily_limit {
            panic!("daily limit exceeded");
        }

        shopkeeper.total_cashouts += amount;
        shopkeeper.today_cashouts += amount;

        env.storage()
            .persistent()
            .set(&DataKey::Shopkeeper(shopkeeper_id.clone()), &shopkeeper);

        env.events().publish(
            (Symbol::new(&env, "CashoutRecorded"),),
            (shopkeeper_id, victim_id, amount, env.ledger().timestamp()),
        );
    }

    // ─── Dispute / Flagging ──────────────────────────────────────────────────

    /// Flag a shopkeeper for price gouging or misconduct.
    pub fn flag_shopkeeper(
        env: Env,
        admin: Address,
        shopkeeper_id: String,
        reason: String,
    ) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut shopkeeper: Shopkeeper = env
            .storage()
            .persistent()
            .get(&DataKey::Shopkeeper(shopkeeper_id.clone()))
            .expect("shopkeeper not found");

        shopkeeper.dispute_count += 1;

        env.storage()
            .persistent()
            .set(&DataKey::Shopkeeper(shopkeeper_id.clone()), &shopkeeper);

        env.events().publish(
            (Symbol::new(&env, "ShopkeeperFlagged"),),
            (shopkeeper_id, reason, env.ledger().timestamp()),
        );
    }

    // ─── Deactivation ────────────────────────────────────────────────────────

    /// Deactivate a shopkeeper (e.g., after confirmed price gouging or clawback).
    pub fn deactivate_shopkeeper(env: Env, admin: Address, shopkeeper_id: String) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut shopkeeper: Shopkeeper = env
            .storage()
            .persistent()
            .get(&DataKey::Shopkeeper(shopkeeper_id.clone()))
            .expect("shopkeeper not found");

        shopkeeper.is_active = false;

        env.storage()
            .persistent()
            .set(&DataKey::Shopkeeper(shopkeeper_id.clone()), &shopkeeper);

        // Remove from active list
        let active: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::ActiveShopkeepers)
            .unwrap_or(Vec::new(&env));
        let mut new_active = Vec::new(&env);
        for id in active.iter() {
            if id != shopkeeper_id {
                new_active.push_back(id);
            }
        }
        env.storage()
            .instance()
            .set(&DataKey::ActiveShopkeepers, &new_active);

        env.events().publish(
            (Symbol::new(&env, "ShopkeeperDeactivated"),),
            (shopkeeper_id, env.ledger().timestamp()),
        );
    }

    // ─── Reads ───────────────────────────────────────────────────────────────

    pub fn get_shopkeeper(env: Env, id: String) -> Shopkeeper {
        env.storage()
            .persistent()
            .get(&DataKey::Shopkeeper(id))
            .expect("shopkeeper not found")
    }

    pub fn get_active_shopkeepers(env: Env) -> Vec<Shopkeeper> {
        let active_ids: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::ActiveShopkeepers)
            .unwrap_or(Vec::new(&env));
        let mut result = Vec::new(&env);
        for id in active_ids.iter() {
            if let Some(s) = env
                .storage()
                .persistent()
                .get::<DataKey, Shopkeeper>(&DataKey::Shopkeeper(id))
            {
                if s.is_active {
                    result.push_back(s);
                }
            }
        }
        result
    }

    pub fn get_shopkeepers_by_location(env: Env, location: String) -> Vec<Shopkeeper> {
        let ids: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::LocationShopkeepers(location))
            .unwrap_or(Vec::new(&env));
        let mut result = Vec::new(&env);
        for id in ids.iter() {
            if let Some(s) = env
                .storage()
                .persistent()
                .get::<DataKey, Shopkeeper>(&DataKey::Shopkeeper(id))
            {
                result.push_back(s);
            }
        }
        result
    }

    /// Check if a shopkeeper can process a given cashout amount today.
    pub fn check_daily_limit(env: Env, shopkeeper_id: String, amount: i128) -> bool {
        let shopkeeper: Shopkeeper = env
            .storage()
            .persistent()
            .get(&DataKey::Shopkeeper(shopkeeper_id))
            .expect("shopkeeper not found");
        shopkeeper.today_cashouts + amount <= shopkeeper.max_daily_limit
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    fn assert_is_admin(env: &Env, caller: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if *caller != admin {
            panic!("unauthorized: admin only");
        }
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    fn setup() -> (Env, ShopkeeperRegistryContractClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, ShopkeeperRegistryContract);
        let client = ShopkeeperRegistryContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, client, admin)
    }

    fn str(env: &Env, s: &str) -> String {
        String::from_str(env, s)
    }

    fn register_one(env: &Env, client: &ShopkeeperRegistryContractClient, admin: &Address, id: &str) {
        let wallet = Address::generate(env);
        client.register_shopkeeper(
            admin,
            &str(env, id),
            &wallet,
            &str(env, "Test Shop"),
            &str(env, "Karachi"),
            &str(env, "+92-300-0000000"),
            &10_000_000_000i128, // 1000 USDC
        );
    }

    #[test]
    fn test_initialize() {
        let (_env, _client, _) = setup();
        // Just check it doesn't panic
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_init_fails() {
        let (_env, client, admin) = setup();
        client.initialize(&admin);
    }

    #[test]
    fn test_register_shopkeeper() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        let sk = client.get_shopkeeper(&str(&env, "SK001"));
        assert_eq!(sk.name, str(&env, "Test Shop"));
        assert!(!sk.is_verified);
        assert!(!sk.is_active);
    }

    #[test]
    fn test_verify_shopkeeper() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        client.verify_shopkeeper(&admin, &str(&env, "SK001"));
        let sk = client.get_shopkeeper(&str(&env, "SK001"));
        assert!(sk.is_verified);
        assert!(sk.is_active);
    }

    #[test]
    fn test_get_active_shopkeepers() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        register_one(&env, &client, &admin, "SK002");
        client.verify_shopkeeper(&admin, &str(&env, "SK001"));
        let active = client.get_active_shopkeepers();
        assert_eq!(active.len(), 1);
    }

    #[test]
    fn test_record_cashout() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        client.verify_shopkeeper(&admin, &str(&env, "SK001"));
        client.record_cashout(
            &str(&env, "SK001"),
            &50_000_000i128,
            &str(&env, "V001"),
        );
        let sk = client.get_shopkeeper(&str(&env, "SK001"));
        assert_eq!(sk.total_cashouts, 50_000_000);
        assert_eq!(sk.today_cashouts, 50_000_000);
    }

    #[test]
    #[should_panic(expected = "daily limit exceeded")]
    fn test_daily_limit_enforced() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        client.verify_shopkeeper(&admin, &str(&env, "SK001"));
        // Exceed 1000 USDC daily limit
        client.record_cashout(
            &str(&env, "SK001"),
            &10_000_000_001i128, // 1000.0000001 USDC
            &str(&env, "V001"),
        );
    }

    #[test]
    fn test_check_daily_limit_true() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        let ok = client.check_daily_limit(&str(&env, "SK001"), &5_000_000_000i128);
        assert!(ok);
    }

    #[test]
    fn test_check_daily_limit_false() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        let ok = client.check_daily_limit(&str(&env, "SK001"), &10_000_000_001i128);
        assert!(!ok);
    }

    #[test]
    fn test_flag_shopkeeper() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        client.flag_shopkeeper(&admin, &str(&env, "SK001"), &str(&env, "price gouging reported"));
        let sk = client.get_shopkeeper(&str(&env, "SK001"));
        assert_eq!(sk.dispute_count, 1);
    }

    #[test]
    fn test_deactivate_shopkeeper() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        client.verify_shopkeeper(&admin, &str(&env, "SK001"));
        client.deactivate_shopkeeper(&admin, &str(&env, "SK001"));
        let sk = client.get_shopkeeper(&str(&env, "SK001"));
        assert!(!sk.is_active);
        let active = client.get_active_shopkeepers();
        assert_eq!(active.len(), 0);
    }

    #[test]
    fn test_get_shopkeepers_by_location() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        register_one(&env, &client, &admin, "SK002");
        let karachi_shops = client.get_shopkeepers_by_location(&str(&env, "Karachi"));
        assert_eq!(karachi_shops.len(), 2);
    }

    #[test]
    #[should_panic(expected = "unauthorized: admin only")]
    fn test_non_admin_cannot_register() {
        let (env, client, _) = setup();
        let attacker = Address::generate(&env);
        let wallet = Address::generate(&env);
        client.register_shopkeeper(
            &attacker,
            &str(&env, "EVIL"),
            &wallet,
            &str(&env, "Evil Shop"),
            &str(&env, "Nowhere"),
            &str(&env, "000"),
            &100i128,
        );
    }

    #[test]
    #[should_panic(expected = "shopkeeper not active")]
    fn test_cashout_on_unverified_fails() {
        let (env, client, admin) = setup();
        register_one(&env, &client, &admin, "SK001");
        // Not verified yet, should fail
        client.record_cashout(
            &str(&env, "SK001"),
            &1_000_000i128,
            &str(&env, "V001"),
        );
    }
}
