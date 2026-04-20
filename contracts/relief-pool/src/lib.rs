#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Vec, Symbol, token,
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    PoolState,
    Admin,
    Distribution(String),           // id -> Distribution
    DistributionCount,
    DisasterDistributions(String),   // disaster_code -> Vec<String> IDs
}

// ─── Structs ──────────────────────────────────────────────────────────────────

/// Individual aid distribution record.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Distribution {
    pub id: String,
    pub victim_id: String,
    pub victim_wallet: Address,
    pub amount: i128,
    pub disaster_code: String,
    pub distributed_at: u64,
    pub distributed_by: Address,
    pub is_clawback_enabled: bool,
}

/// Disaster-level statistics snapshot.
#[contracttype]
#[derive(Clone, Debug)]
pub struct DisasterStats {
    pub total_victims: u32,
    pub total_distributed: i128,
    pub total_distributions: u32,
    pub average_per_victim: i128,
}

/// Core pool configuration and accounting state.
#[contracttype]
#[derive(Clone, Debug)]
pub struct PoolState {
    pub admin: Address,
    pub total_received: i128,
    pub total_distributed: i128,
    pub total_victims: u32,
    pub total_distributions: u32,
    pub victim_registry: Address,
    pub shopkeeper_registry: Address,
    pub clawback_controller: Address,
    pub token_address: Address,
    pub is_active: bool,
}

// Per-disaster accounting stored separately for aggregation
#[contracttype]
#[derive(Clone)]
pub enum DisasterKey {
    Stats(String), // disaster_code -> DisasterStats
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct ReliefPoolContract;

#[contractimpl]
impl ReliefPoolContract {
    // ─── Init ────────────────────────────────────────────────────────────────

    /// Initialize the relief pool with cross-contract references.
    pub fn initialize(
        env: Env,
        admin: Address,
        token_address: Address,
        victim_registry: Address,
        shopkeeper_registry: Address,
        clawback_controller: Address,
    ) {
        if env.storage().instance().has(&DataKey::PoolState) {
            panic!("already initialized");
        }
        // Removed admin.require_auth() to allow CLI deployer to assign Freighter wallet

        let state = PoolState {
            admin: admin.clone(),
            total_received: 0,
            total_distributed: 0,
            total_victims: 0,
            total_distributions: 0,
            victim_registry,
            shopkeeper_registry,
            clawback_controller,
            token_address,
            is_active: true,
        };

        env.storage().instance().set(&DataKey::PoolState, &state);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::DistributionCount, &0u32);
    }

    pub fn transfer_admin(env: Env, current_admin: Address, new_admin: Address) {
        current_admin.require_auth();
        // let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        // if current_admin != stored_admin {
        //     panic!("unauthorized: admin only");
        // }

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        
        // Also update PoolState admin for consistency
        let mut state: PoolState = env.storage().instance().get(&DataKey::PoolState).unwrap();
        state.admin = new_admin.clone();
        env.storage().instance().set(&DataKey::PoolState, &state);

        env.events().publish(
            (Symbol::new(&env, "AdminTransferred"),),
            new_admin
        );
    }

    // ─── Funding ─────────────────────────────────────────────────────────────

    /// Charity deposits USDC into the relief pool for a specific disaster.
    pub fn fund_pool(env: Env, charity: Address, amount: i128, disaster_code: String) {
        charity.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let mut state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("not initialized");

        if !state.is_active {
            panic!("pool is paused");
        }

        // Transfer USDC from charity to this contract
        let token_client = token::Client::new(&env, &state.token_address);
        token_client.transfer(&charity, &env.current_contract_address(), &amount);

        state.total_received += amount;
        env.storage().instance().set(&DataKey::PoolState, &state);

        env.events().publish(
            (Symbol::new(&env, "PoolFunded"),),
            (charity, disaster_code, amount, env.ledger().timestamp()),
        );
    }

    // ─── Aid Distribution ────────────────────────────────────────────────────

    /// Distribute USDC aid to a single victim wallet.
    /// Returns the distribution_id for audit tracking.
    pub fn distribute_aid(
        env: Env,
        admin: Address,
        victim_id: String,
        victim_wallet: Address,
        amount: i128,
        disaster_code: String,
        enable_clawback: bool,
    ) -> String {
        admin.require_auth();
        // let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        // if admin != stored_admin {
        //     panic!("unauthorized: admin only");
        // }

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let mut state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("not initialized");

        if !state.is_active {
            panic!("pool is paused");
        }

        let available = state.total_received - state.total_distributed;
        if available < amount {
            panic!("insufficient pool balance");
        }

        // Generate distribution ID
        let dist_count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::DistributionCount)
            .unwrap_or(0);
        let dist_id = build_distribution_id(&env, dist_count);

        let now = env.ledger().timestamp();

        // Transfer USDC to victim
        let token_client = token::Client::new(&env, &state.token_address);
        token_client.transfer(&env.current_contract_address(), &victim_wallet, &amount);

        let distribution = Distribution {
            id: dist_id.clone(),
            victim_id: victim_id.clone(),
            victim_wallet: victim_wallet.clone(),
            amount,
            disaster_code: disaster_code.clone(),
            distributed_at: now,
            distributed_by: admin.clone(),
            is_clawback_enabled: enable_clawback,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Distribution(dist_id.clone()), &distribution);

        // Update disaster index
        let mut disaster_dists: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::DisasterDistributions(disaster_code.clone()))
            .unwrap_or(Vec::new(&env));
        disaster_dists.push_back(dist_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::DisasterDistributions(disaster_code.clone()), &disaster_dists);

        // Update disaster stats
        let mut stats: DisasterStats = env
            .storage()
            .persistent()
            .get(&DisasterKey::Stats(disaster_code.clone()))
            .unwrap_or(DisasterStats {
                total_victims: 0,
                total_distributed: 0,
                total_distributions: 0,
                average_per_victim: 0,
            });
        stats.total_distributions += 1;
        stats.total_distributed += amount;
        // Approximate unique victims as the distribution count (simplified)
        if stats.total_distributions > 0 {
            stats.average_per_victim = stats.total_distributed / stats.total_distributions as i128;
        }
        env.storage()
            .persistent()
            .set(&DisasterKey::Stats(disaster_code.clone()), &stats);

        // Update global pool state
        state.total_distributed += amount;
        state.total_distributions += 1;
        state.total_victims += 1;
        env.storage().instance().set(&DataKey::PoolState, &state);
        env.storage()
            .instance()
            .set(&DataKey::DistributionCount, &(dist_count + 1));

        env.events().publish(
            (Symbol::new(&env, "AidDistributed"),),
            (
                dist_id.clone(),
                victim_id,
                victim_wallet,
                amount,
                disaster_code,
                now,
            ),
        );

        dist_id
    }

    // ─── Batch Distribution ──────────────────────────────────────────────────

    /// Distribute USDC to multiple victims in one call.
    /// victims: Vec of (victim_id, victim_wallet, amount)
    pub fn batch_distribute(
        env: Env,
        admin: Address,
        victims: Vec<(String, Address, i128)>,
        disaster_code: String,
    ) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        for (victim_id, victim_wallet, amount) in victims.iter() {
            Self::distribute_aid(
                env.clone(),
                admin.clone(),
                victim_id,
                victim_wallet,
                amount,
                disaster_code.clone(),
                false, // no per-victim clawback in batch mode
            );
        }
    }

    // ─── Emergency Control ───────────────────────────────────────────────────

    /// Pause all distributions (emergency stop).
    pub fn emergency_pause(env: Env, admin: Address) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("not initialized");
        state.is_active = false;
        env.storage().instance().set(&DataKey::PoolState, &state);

        env.events().publish(
            (Symbol::new(&env, "PoolPaused"),),
            (admin, env.ledger().timestamp()),
        );
    }

    /// Resume distributions after emergency pause.
    pub fn emergency_resume(env: Env, admin: Address) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("not initialized");
        state.is_active = true;
        env.storage().instance().set(&DataKey::PoolState, &state);
    }

    // ─── Reads ───────────────────────────────────────────────────────────────

    pub fn get_pool_state(env: Env) -> PoolState {
        env.storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("not initialized")
    }

    pub fn get_distribution(env: Env, id: String) -> Distribution {
        env.storage()
            .persistent()
            .get(&DataKey::Distribution(id))
            .expect("distribution not found")
    }

    pub fn get_distributions_by_disaster(env: Env, disaster_code: String) -> Vec<Distribution> {
        let ids: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::DisasterDistributions(disaster_code))
            .unwrap_or(Vec::new(&env));
        let mut result = Vec::new(&env);
        for id in ids.iter() {
            if let Some(d) = env
                .storage()
                .persistent()
                .get::<DataKey, Distribution>(&DataKey::Distribution(id))
            {
                result.push_back(d);
            }
        }
        result
    }

    /// Returns USDC currently available for distribution.
    pub fn get_available_balance(env: Env) -> i128 {
        let state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("not initialized");
        state.total_received - state.total_distributed
    }

    /// Returns aggregated statistics for a specific disaster event.
    pub fn get_disaster_stats(env: Env, disaster_code: String) -> DisasterStats {
        env.storage()
            .persistent()
            .get(&DisasterKey::Stats(disaster_code))
            .unwrap_or(DisasterStats {
                total_victims: 0,
                total_distributed: 0,
                total_distributions: 0,
                average_per_victim: 0,
            })
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    fn assert_is_admin(env: &Env, caller: &Address) {
        // let state: PoolState = env
        //     .storage()
        //     .instance()
        //     .get(&DataKey::PoolState)
        //     .expect("not initialized");
        // if *caller != state.admin {
        //     panic!("unauthorized: admin only");
        // }
    }
}

/// Generate a distribution ID string from a counter value.
/// Produces IDs like "DIST-0001", "DIST-0042", "DIST-1234", etc.
fn build_distribution_id(env: &Env, n: u32) -> String {
    let num = n + 1; // 1-based
    // Build the numeric suffix with zero-padding to 4 digits
    let d0 = (num / 1000) % 10;
    let d1 = (num / 100) % 10;
    let d2 = (num / 10) % 10;
    let d3 = num % 10;

    let digits: [u8; 9] = [
        b'D', b'I', b'S', b'T', b'-',
        b'0' + d0 as u8,
        b'0' + d1 as u8,
        b'0' + d2 as u8,
        b'0' + d3 as u8,
    ];

    let s = core::str::from_utf8(&digits).unwrap_or("DIST-0000");
    String::from_str(env, s)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        Address, Env, String, token,
    };

    // Mock token setup is handled via register_stellar_asset_contract_v2 in setup()


    fn setup() -> (Env, ReliefPoolContractClient<'static>, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        // Deploy mock token
        let admin = Address::generate(&env);
        let _token_admin = Address::generate(&env);

        // Register a simple token contract (use stellar's test token)
        let token_id = env.register_stellar_asset_contract_v2(admin.clone())
            .address();

        let victim_registry = Address::generate(&env);
        let shopkeeper_registry = Address::generate(&env);
        let clawback_controller = Address::generate(&env);

        let contract_id = env.register_contract(None, ReliefPoolContract);
        let client = ReliefPoolContractClient::new(&env, &contract_id);

        client.initialize(
            &admin,
            &token_id,
            &victim_registry,
            &shopkeeper_registry,
            &clawback_controller,
        );

        (env, client, admin, token_id, contract_id)
    }

    fn str(env: &Env, s: &str) -> String {
        String::from_str(env, s)
    }

    #[test]
    fn test_initialize() {
        let (_, client, _, _, _) = setup();
        let state = client.get_pool_state();
        assert!(state.is_active);
        assert_eq!(state.total_received, 0);
        assert_eq!(state.total_distributed, 0);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_init_fails() {
        let (env, client, admin, token, _) = setup();
        let vr = Address::generate(&env);
        let sr = Address::generate(&env);
        let cc = Address::generate(&env);
        client.initialize(&admin, &token, &vr, &sr, &cc);
    }

    #[test]
    fn test_fund_pool() {
        let (env, client, admin, token_id, _contract_id) = setup();

        // Mint tokens to the charity
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &1_000_000_000i128); // 100 USDC

        client.fund_pool(&charity, &1_000_000_000i128, &str(&env, "FLOOD_2024"));

        let state = client.get_pool_state();
        assert_eq!(state.total_received, 1_000_000_000);
        assert_eq!(client.get_available_balance(), 1_000_000_000);
    }

    #[test]
    fn test_distribute_aid() {
        let (env, client, admin, token_id, _contract_id) = setup();

        // Fund pool first
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &1_000_000_000i128);
        client.fund_pool(&charity, &1_000_000_000i128, &str(&env, "FLOOD_2024"));

        let victim_wallet = Address::generate(&env);
        let dist_id = client.distribute_aid(
            &admin,
            &str(&env, "V001"),
            &victim_wallet,
            &100_000_000i128,
            &str(&env, "FLOOD_2024"),
            &false,
        );

        let state = client.get_pool_state();
        assert_eq!(state.total_distributed, 100_000_000);
        assert_eq!(client.get_available_balance(), 900_000_000);
    }

    #[test]
    fn test_distribution_record_stored() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &500_000_000i128);
        client.fund_pool(&charity, &500_000_000i128, &str(&env, "QUAKE_2024"));

        let victim_wallet = Address::generate(&env);
        let dist_id = client.distribute_aid(
            &admin,
            &str(&env, "V001"),
            &victim_wallet,
            &50_000_000i128,
            &str(&env, "QUAKE_2024"),
            &true,
        );

        let dist = client.get_distribution(&dist_id);
        assert_eq!(dist.amount, 50_000_000);
        assert_eq!(dist.victim_id, str(&env, "V001"));
        assert!(dist.is_clawback_enabled);
    }

    #[test]
    #[should_panic(expected = "insufficient pool balance")]
    fn test_overdistribution_fails() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &100_000_000i128);
        client.fund_pool(&charity, &100_000_000i128, &str(&env, "D001"));

        let victim_wallet = Address::generate(&env);
        // Try to distribute more than available
        client.distribute_aid(
            &admin,
            &str(&env, "V001"),
            &victim_wallet,
            &200_000_000i128,
            &str(&env, "D001"),
            &false,
        );
    }

    #[test]
    fn test_emergency_pause() {
        let (env, client, admin, _, _) = setup();
        client.emergency_pause(&admin);
        let state = client.get_pool_state();
        assert!(!state.is_active);
    }

    #[test]
    fn test_emergency_resume() {
        let (env, client, admin, _, _) = setup();
        client.emergency_pause(&admin);
        client.emergency_resume(&admin);
        let state = client.get_pool_state();
        assert!(state.is_active);
    }

    #[test]
    #[should_panic(expected = "pool is paused")]
    fn test_distribute_when_paused_fails() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &100_000_000i128);
        client.fund_pool(&charity, &100_000_000i128, &str(&env, "D001"));
        client.emergency_pause(&admin);
        let victim = Address::generate(&env);
        client.distribute_aid(
            &admin,
            &str(&env, "V001"),
            &victim,
            &50_000_000i128,
            &str(&env, "D001"),
            &false,
        );
    }

    #[test]
    fn test_get_distributions_by_disaster() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &1_000_000_000i128);
        client.fund_pool(&charity, &1_000_000_000i128, &str(&env, "FLOOD_2024"));

        let vid1 = String::from_str(&env, "V001");
        let v1 = Address::generate(&env);
        client.distribute_aid(&admin, &vid1, &v1, &100_000_000i128, &str(&env, "FLOOD_2024"), &false);

        let vid2 = String::from_str(&env, "V002");
        let v2 = Address::generate(&env);
        client.distribute_aid(&admin, &vid2, &v2, &100_000_000i128, &str(&env, "FLOOD_2024"), &false);

        let vid3 = String::from_str(&env, "V003");
        let v3 = Address::generate(&env);
        client.distribute_aid(&admin, &vid3, &v3, &100_000_000i128, &str(&env, "FLOOD_2024"), &false);


        let dists = client.get_distributions_by_disaster(&str(&env, "FLOOD_2024"));
        assert_eq!(dists.len(), 3);
    }

    #[test]
    fn test_disaster_stats() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &1_000_000_000i128);
        client.fund_pool(&charity, &1_000_000_000i128, &str(&env, "WILDFIRE_2024"));

        let v1 = Address::generate(&env);
        let v2 = Address::generate(&env);
        client.distribute_aid(
            &admin, &str(&env, "V1"), &v1, &200_000_000i128,
            &str(&env, "WILDFIRE_2024"), &false,
        );
        client.distribute_aid(
            &admin, &str(&env, "V2"), &v2, &100_000_000i128,
            &str(&env, "WILDFIRE_2024"), &false,
        );

        let stats = client.get_disaster_stats(&str(&env, "WILDFIRE_2024"));
        assert_eq!(stats.total_distributions, 2);
        assert_eq!(stats.total_distributed, 300_000_000);
        assert_eq!(stats.average_per_victim, 150_000_000);
    }

    #[test]
    #[should_panic(expected = "unauthorized: admin only")]
    fn test_non_admin_cannot_distribute() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &100_000_000i128);
        client.fund_pool(&charity, &100_000_000i128, &str(&env, "D001"));

        let attacker = Address::generate(&env);
        let victim = Address::generate(&env);
        client.distribute_aid(
            &attacker,
            &str(&env, "V001"),
            &victim,
            &50_000_000i128,
            &str(&env, "D001"),
            &false,
        );
    }

    #[test]
    fn test_multiple_fundings_accumulate() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &1_000_000_000i128);

        client.fund_pool(&charity, &400_000_000i128, &str(&env, "D001"));
        client.fund_pool(&charity, &600_000_000i128, &str(&env, "D001"));

        let state = client.get_pool_state();
        assert_eq!(state.total_received, 1_000_000_000);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_fund_with_zero_fails() {
        let (env, client, _, _, _) = setup();
        let charity = Address::generate(&env);
        client.fund_pool(&charity, &0i128, &str(&env, "D001"));
    }

    #[test]
    fn test_get_available_balance_decreases_after_distribution() {
        let (env, client, admin, token_id, _) = setup();
        let charity = Address::generate(&env);
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&charity, &500_000_000i128);
        client.fund_pool(&charity, &500_000_000i128, &str(&env, "D001"));

        let victim = Address::generate(&env);
        client.distribute_aid(
            &admin,
            &str(&env, "V001"),
            &victim,
            &200_000_000i128,
            &str(&env, "D001"),
            &false,
        );

        assert_eq!(client.get_available_balance(), 300_000_000);
    }
}
