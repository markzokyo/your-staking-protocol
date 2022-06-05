use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

pub enum AccTypesWithVersion {
    YourPoolDataV1 = 2,
    UserDataV1 = 3,
}

pub const REWARD_RATE_PRECISION: f64 = 1000000000.0;

pub const YOUR_POOL_STORAGE_TOTAL_BYTES: usize = 142;
#[derive(Clone, BorshDeserialize, BorshSerialize, Copy)]
pub struct YourPool {
    pub acc_type: u8,
    pub pda_nonce: u8,

    pub owner_wallet: Pubkey,
    pub staking_vault: Pubkey,

    pub user_stake_count: u32,
    pub user_total_stake: u64,
    pub user_total_weighted_stake: f64,

    pub pool_init_slot: u64,
    pub epoch_duration_in_slots: u64,
    pub rewards_per_slot: u64,
    pub max_reward_rate: u64,
    pub min_reward_rate: u64,
    pub max_unlock_duration_in_slots: u64,
    pub min_unlock_duration_in_slots: u64,
}

pub const USER_STORAGE_TOTAL_BYTES: usize = 114;
#[derive(Clone, BorshDeserialize, BorshSerialize, Copy)]
pub struct User {
    pub acc_type: u8,
    pub nonce: u8,

    pub user_wallet: Pubkey,
    pub your_pool: Pubkey,

    pub pending_unstake_amount: u64,
    pub pending_unstake_slot: u64,

    pub claim_timeout_slot: u64,

    pub user_weighted_epoch: u64,
    pub user_weighted_stake: f64,
    pub user_stake: u64,
}
