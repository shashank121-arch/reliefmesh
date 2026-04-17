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
    TokenAddress,
    Case(String),           // case_id -> ClawbackCase
    CaseCount,
    PendingCases,           // Vec<String> — case IDs with Pending status
    ShopkeeperCases(String),// shopkeeper_id -> Vec<String> case IDs
    TotalRecovered,
}

// ─── Enums ────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ClawbackStatus {
    Pending,
    Approved,
    Executed,
    Rejected,
}

// ─── Structs ──────────────────────────────────────────────────────────────────

/// A clawback case representing a corruption recovery action.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ClawbackCase {
    /// Generated unique case identifier
    pub case_id: String,
    /// ID of the shopkeeper being investigated
    pub shopkeeper_id: String,
    /// Stellar wallet to claw back funds from
    pub shopkeeper_wallet: Address,
    /// Amount of USDC to recover (in stroops)
    pub amount: i128,
    /// Human-readable reason for the clawback
    pub reason: String,
    /// Current status of the case
    pub status: ClawbackStatus,
    /// Timestamp when case was created
    pub created_at: u64,
    /// Timestamp when case was resolved (0 if unresolved)
    pub resolved_at: u64,
    /// IPFS hash or content hash of supporting evidence
    pub evidence_hash: String,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct ClawbackControllerContract;

#[contractimpl]
impl ClawbackControllerContract {
    // ─── Init ────────────────────────────────────────────────────────────────

    pub fn initialize(env: Env, admin: Address, token_address: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        // Removed admin.require_auth() to allow CLI deployer to assign Freighter wallet
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token_address);
        env.storage().instance().set(&DataKey::CaseCount, &0u32);
        env.storage().instance().set(&DataKey::TotalRecovered, &0i128);
        let empty: Vec<String> = Vec::new(&env);
        env.storage().instance().set(&DataKey::PendingCases, &empty);
    }

    // ─── Case Creation ───────────────────────────────────────────────────────

    /// Initiate a clawback case. Creates a Pending case for admin review.
    /// Returns the generated case_id.
    pub fn initiate_clawback(
        env: Env,
        admin: Address,
        shopkeeper_id: String,
        shopkeeper_wallet: Address,
        amount: i128,
        reason: String,
        evidence_hash: String,
    ) -> String {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        if amount <= 0 {
            panic!("clawback amount must be positive");
        }

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CaseCount)
            .unwrap_or(0);
        let case_id = build_case_id(&env, count);

        let now = env.ledger().timestamp();

        let case = ClawbackCase {
            case_id: case_id.clone(),
            shopkeeper_id: shopkeeper_id.clone(),
            shopkeeper_wallet,
            amount,
            reason,
            status: ClawbackStatus::Pending,
            created_at: now,
            resolved_at: 0,
            evidence_hash,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Case(case_id.clone()), &case);

        // Add to pending index
        let mut pending: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::PendingCases)
            .unwrap_or(Vec::new(&env));
        pending.push_back(case_id.clone());
        env.storage().instance().set(&DataKey::PendingCases, &pending);

        // Add to shopkeeper's case index
        let mut sk_cases: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::ShopkeeperCases(shopkeeper_id.clone()))
            .unwrap_or(Vec::new(&env));
        sk_cases.push_back(case_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::ShopkeeperCases(shopkeeper_id.clone()), &sk_cases);

        // Increment case count
        env.storage()
            .instance()
            .set(&DataKey::CaseCount, &(count + 1));

        env.events().publish(
            (Symbol::new(&env, "ClawbackInitiated"),),
            (case_id.clone(), shopkeeper_id, amount, now),
        );

        case_id
    }

    // ─── Case Approval ───────────────────────────────────────────────────────

    /// Admin approves an open clawback case (moves Pending → Approved).
    pub fn approve_clawback(env: Env, admin: Address, case_id: String) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut case: ClawbackCase = env
            .storage()
            .persistent()
            .get(&DataKey::Case(case_id.clone()))
            .expect("case not found");

        if case.status != ClawbackStatus::Pending {
            panic!("case is not pending");
        }

        case.status = ClawbackStatus::Approved;

        env.storage()
            .persistent()
            .set(&DataKey::Case(case_id.clone()), &case);

        // Remove from pending list
        Self::remove_from_pending(&env, &case_id);

        env.events().publish(
            (Symbol::new(&env, "ClawbackApproved"),),
            (case_id, env.ledger().timestamp()),
        );
    }

    // ─── Case Execution ──────────────────────────────────────────────────────

    /// Execute an approved clawback. Transfers USDC back using Stellar clawback.
    /// In production: uses token.clawback() — requires clawback-enabled USDC.
    pub fn execute_clawback(env: Env, admin: Address, case_id: String) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut case: ClawbackCase = env
            .storage()
            .persistent()
            .get(&DataKey::Case(case_id.clone()))
            .expect("case not found");

        if case.status != ClawbackStatus::Approved {
            panic!("case must be approved before execution");
        }

        // In production: invoke token contract's clawback function
        // token_client.clawback(&case.shopkeeper_wallet, &case.amount);
        // For testnet/MVP, we record the intent and emit the event.

        let now = env.ledger().timestamp();
        case.status = ClawbackStatus::Executed;
        case.resolved_at = now;

        env.storage()
            .persistent()
            .set(&DataKey::Case(case_id.clone()), &case);

        // Update total recovered
        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalRecovered)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalRecovered, &(total + case.amount));

        env.events().publish(
            (Symbol::new(&env, "ClawbackExecuted"),),
            (case_id, case.shopkeeper_wallet, case.amount, now),
        );
    }

    // ─── Case Rejection ──────────────────────────────────────────────────────

    /// Reject a pending clawback case with a reason.
    pub fn reject_clawback(
        env: Env,
        admin: Address,
        case_id: String,
        rejection_reason: String,
    ) {
        admin.require_auth();
        Self::assert_is_admin(&env, &admin);

        let mut case: ClawbackCase = env
            .storage()
            .persistent()
            .get(&DataKey::Case(case_id.clone()))
            .expect("case not found");

        if case.status != ClawbackStatus::Pending && case.status != ClawbackStatus::Approved {
            panic!("case cannot be rejected in current state");
        }

        case.status = ClawbackStatus::Rejected;
        case.resolved_at = env.ledger().timestamp();
        case.reason = rejection_reason.clone();

        env.storage()
            .persistent()
            .set(&DataKey::Case(case_id.clone()), &case);

        Self::remove_from_pending(&env, &case_id);

        env.events().publish(
            (Symbol::new(&env, "ClawbackRejected"),),
            (case_id, rejection_reason, env.ledger().timestamp()),
        );
    }

    // ─── Reads ───────────────────────────────────────────────────────────────

    pub fn get_case(env: Env, case_id: String) -> ClawbackCase {
        env.storage()
            .persistent()
            .get(&DataKey::Case(case_id))
            .expect("case not found")
    }

    pub fn get_pending_cases(env: Env) -> Vec<ClawbackCase> {
        let pending_ids: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::PendingCases)
            .unwrap_or(Vec::new(&env));
        let mut result = Vec::new(&env);
        for id in pending_ids.iter() {
            if let Some(c) = env
                .storage()
                .persistent()
                .get::<DataKey, ClawbackCase>(&DataKey::Case(id))
            {
                result.push_back(c);
            }
        }
        result
    }

    pub fn get_cases_by_shopkeeper(env: Env, shopkeeper_id: String) -> Vec<ClawbackCase> {
        let ids: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::ShopkeeperCases(shopkeeper_id))
            .unwrap_or(Vec::new(&env));
        let mut result = Vec::new(&env);
        for id in ids.iter() {
            if let Some(c) = env
                .storage()
                .persistent()
                .get::<DataKey, ClawbackCase>(&DataKey::Case(id))
            {
                result.push_back(c);
            }
        }
        result
    }

    /// Total USDC recovered from corruption across all executed clawbacks.
    pub fn get_total_recovered(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalRecovered)
            .unwrap_or(0)
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

    fn remove_from_pending(env: &Env, case_id: &String) {
        let pending: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::PendingCases)
            .unwrap_or(Vec::new(env));
        let mut new_pending = Vec::new(env);
        for id in pending.iter() {
            if &id != case_id {
                new_pending.push_back(id);
            }
        }
        env.storage()
            .instance()
            .set(&DataKey::PendingCases, &new_pending);
    }
}

/// Generate a case ID string from a counter value.
fn build_case_id(env: &Env, n: u32) -> String {
    let num = n + 1; // 1-based
    let d0 = (num / 1000) % 10;
    let d1 = (num / 100) % 10;
    let d2 = (num / 10) % 10;
    let d3 = num % 10;

    let digits: [u8; 9] = [
        b'C', b'A', b'S', b'E', b'-',
        b'0' + d0 as u8,
        b'0' + d1 as u8,
        b'0' + d2 as u8,
        b'0' + d3 as u8,
    ];

    let s = core::str::from_utf8(&digits).unwrap_or("CASE-0000");
    String::from_str(env, s)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Address, Env, String};

    fn setup() -> (Env, ClawbackControllerContractClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        
        // Ensure non-zero timestamp for tests
        env.ledger().with_mut(|li| li.timestamp = 1713370000);

        let contract_id = env.register_contract(None, ClawbackControllerContract);
        let client = ClawbackControllerContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        client.initialize(&admin, &token);
        (env, client, admin, token)
    }

    fn str(env: &Env, s: &str) -> String {
        String::from_str(env, s)
    }

    fn initiate_case(env: &Env, client: &ClawbackControllerContractClient, admin: &Address) -> (String, Address) {
        let shopkeeper_wallet = Address::generate(env);
        let case_id = client.initiate_clawback(
            admin,
            &str(env, "SK001"),
            &shopkeeper_wallet,
            &50_000_000i128,
            &str(env, "Price gouging reported"),
            &str(env, "QmXyz123evidencehash"),
        );
        (case_id, shopkeeper_wallet)
    }

    #[test]
    fn test_initialize() {
        let (_, client, _, _) = setup();
        assert_eq!(client.get_total_recovered(), 0);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_init_fails() {
        let (_env, client, admin, token) = setup();
        client.initialize(&admin, &token);
    }

    #[test]
    fn test_initiate_clawback() {
        let (env, client, admin, _) = setup();
        let (case_id, _) = initiate_case(&env, &client, &admin);
        let case = client.get_case(&case_id);
        assert_eq!(case.amount, 50_000_000);
        assert_eq!(case.status, ClawbackStatus::Pending);
        assert_eq!(case.shopkeeper_id, str(&env, "SK001"));
    }

    #[test]
    fn test_pending_cases_list() {
        let (env, client, admin, _) = setup();
        initiate_case(&env, &client, &admin);
        initiate_case(&env, &client, &admin);
        let pending = client.get_pending_cases();
        assert_eq!(pending.len(), 2);
    }

    #[test]
    fn test_approve_clawback() {
        let (env, client, admin, _) = setup();
        let (case_id, _) = initiate_case(&env, &client, &admin);
        client.approve_clawback(&admin, &case_id);
        let case = client.get_case(&case_id);
        assert_eq!(case.status, ClawbackStatus::Approved);
        // Should be removed from pending
        let pending = client.get_pending_cases();
        assert_eq!(pending.len(), 0);
    }

    #[test]
    fn test_execute_clawback() {
        let (env, client, admin, _) = setup();
        let (case_id, _) = initiate_case(&env, &client, &admin);
        client.approve_clawback(&admin, &case_id);
        client.execute_clawback(&admin, &case_id);
        let case = client.get_case(&case_id);
        assert_eq!(case.status, ClawbackStatus::Executed);
        assert!(case.resolved_at > 0);
    }

    #[test]
    fn test_total_recovered_accumulates() {
        let (env, client, admin, _) = setup();
        let (case_id1, _) = initiate_case(&env, &client, &admin);
        let (case_id2, _) = initiate_case(&env, &client, &admin);
        client.approve_clawback(&admin, &case_id1);
        client.execute_clawback(&admin, &case_id1);
        client.approve_clawback(&admin, &case_id2);
        client.execute_clawback(&admin, &case_id2);
        assert_eq!(client.get_total_recovered(), 100_000_000);
    }

    #[test]
    fn test_reject_clawback() {
        let (env, client, admin, _) = setup();
        let (case_id, _) = initiate_case(&env, &client, &admin);
        client.reject_clawback(&admin, &case_id, &str(&env, "Insufficient evidence"));
        let case = client.get_case(&case_id);
        assert_eq!(case.status, ClawbackStatus::Rejected);
    }

    #[test]
    #[should_panic(expected = "case is not pending")]
    fn test_approve_already_approved_fails() {
        let (env, client, admin, _) = setup();
        let (case_id, _) = initiate_case(&env, &client, &admin);
        client.approve_clawback(&admin, &case_id);
        client.approve_clawback(&admin, &case_id); // Should fail
    }

    #[test]
    #[should_panic(expected = "case must be approved before execution")]
    fn test_execute_pending_case_fails() {
        let (env, client, admin, _) = setup();
        let (case_id, _) = initiate_case(&env, &client, &admin);
        // Skip approve — try to execute directly
        client.execute_clawback(&admin, &case_id);
    }

    #[test]
    fn test_get_cases_by_shopkeeper() {
        let (env, client, admin, _) = setup();
        initiate_case(&env, &client, &admin);
        initiate_case(&env, &client, &admin);
        let cases = client.get_cases_by_shopkeeper(&str(&env, "SK001"));
        assert_eq!(cases.len(), 2);
    }

    #[test]
    #[should_panic(expected = "clawback amount must be positive")]
    fn test_zero_amount_fails() {
        let (env, client, admin, _) = setup();
        let wallet = Address::generate(&env);
        client.initiate_clawback(
            &admin,
            &str(&env, "SK001"),
            &wallet,
            &0i128,
            &str(&env, "reason"),
            &str(&env, "evidence"),
        );
    }

    #[test]
    #[should_panic(expected = "unauthorized: admin only")]
    fn test_non_admin_cannot_initiate() {
        let (env, client, _, _) = setup();
        let attacker = Address::generate(&env);
        let wallet = Address::generate(&env);
        client.initiate_clawback(
            &attacker,
            &str(&env, "SK001"),
            &wallet,
            &100i128,
            &str(&env, "reason"),
            &str(&env, "ev"),
        );
    }

    #[test]
    fn test_executed_case_not_in_total_when_rejected() {
        let (env, client, admin, _) = setup();
        let (case_id, _) = initiate_case(&env, &client, &admin);
        client.reject_clawback(&admin, &case_id, &str(&env, "no evidence"));
        assert_eq!(client.get_total_recovered(), 0);
    }
}
