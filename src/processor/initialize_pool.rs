use crate::{
    error::CustomError,
    state::{AccTypesWithVersion, YourPool, YOUR_POOL_STORAGE_TOTAL_BYTES},
};

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
use spl_token::state::Account as TokenAccount;

/// 0. `[signer]` Pool Owner Wallet Account
/// 1. `[writable]` YOUR Pool Storage Account
/// 2. `[]` YOUR Staking Mint
/// 3. `[writable]` YOUR Staking Vault
/// 4. `[]` YOUR Rewards Mint
/// 5. `[writable]` YOUR Rewards Vault
/// 6. `[]` Funder Wallet Account
/// 7. `[writable]` YOUR ATA to Debit (Reward Token)
/// 8. `[]` Token Program
pub fn process_initialize_your_pool(
    accounts: &[AccountInfo],
    epoch_duration_in_slots: u64,
    pool_nonce: u8,
    fund_pool: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let pool_owner_wallet_account = next_account_info(account_info_iter)?;
    let your_pool_storage_account = next_account_info(account_info_iter)?;
    let your_staking_mint = next_account_info(account_info_iter)?;
    let staking_vault = next_account_info(account_info_iter)?;
    let your_rewards_mint = next_account_info(account_info_iter)?;
    let your_rewards_vault = next_account_info(account_info_iter)?;
    let funder_wallet_account = next_account_info(account_info_iter)?;
    let your_rewards_ata_to_debit = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    msg!("pool_nonce: {}", pool_nonce);
    msg!(
        "Pool Authority: {}",
        pool_owner_wallet_account.key.to_string()
    );
    msg!(
        "Pool Storage: {}",
        your_pool_storage_account.key.to_string()
    );
    msg!("Staking Mint: {}", your_staking_mint.key.to_string());
    msg!("Staking Vault: {}", staking_vault.key.to_string());
    msg!("Rewards Mint: {}", your_rewards_mint.key.to_string());
    msg!("Rewards Vault: {}", your_rewards_vault.key.to_string());
    msg!(
        "Reward ATA to Debit: {}",
        your_rewards_ata_to_debit.key.to_string()
    );
    msg!("Fund pool amount: {}", fund_pool);
    if !pool_owner_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    msg!("Token program: {}", token_program.key.to_string());

    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
    }

    let rent = Rent::get()?;

    if !rent.is_exempt(staking_vault.lamports(), staking_vault.data_len()) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if !rent.is_exempt(your_rewards_vault.lamports(), your_rewards_vault.data_len()) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if !rent.is_exempt(
        your_pool_storage_account.lamports(),
        your_pool_storage_account.data_len(),
    ) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if your_pool_storage_account.data_len() != YOUR_POOL_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }

    let (pool_signer_address, bump_seed) =
        Pubkey::find_program_address(&[&your_pool_storage_account.key.to_bytes()], program_id);
    msg!(
        "Calling the token program to transfer Staking vault account ownership to Pool program..."
    );
    invoke(
        &spl_token::instruction::set_authority(
            token_program.clone().key,
            staking_vault.clone().key,
            Some(&pool_signer_address),
            spl_token::instruction::AuthorityType::AccountOwner,
            pool_owner_wallet_account.key,
            &[pool_owner_wallet_account.key],
        )?,
        &[
            staking_vault.clone(),
            pool_owner_wallet_account.clone(),
            token_program.clone(),
        ],
    )?;

    msg!(
        "Calling the token program to transfer Rewards vault account ownership to Pool program..."
    );
    invoke(
        &spl_token::instruction::set_authority(
            token_program.clone().key,
            your_rewards_vault.clone().key,
            Some(&pool_signer_address),
            spl_token::instruction::AuthorityType::AccountOwner,
            pool_owner_wallet_account.key,
            &[pool_owner_wallet_account.key],
        )?,
        &[
            your_rewards_vault.clone(),
            pool_owner_wallet_account.clone(),
            token_program.clone(),
        ],
    )?;

    let staking_vault_data = TokenAccount::unpack(&staking_vault.data.borrow())?;
    if staking_vault_data.mint != *your_staking_mint.key {
        msg!("CustomError::MintMismatched");
        return Err(CustomError::MintMismatched.into());
    }

    let your_rewards_vault_data = TokenAccount::unpack(&your_rewards_vault.clone().data.borrow())?;
    if your_rewards_vault_data.mint != *your_rewards_mint.key {
        msg!("CustomError::MintMismatched");
        return Err(CustomError::MintMismatched.into());
    }
    let your_pool_storage_account_clone = your_pool_storage_account.clone();
    let mut your_pool_data_byte_array = your_pool_storage_account_clone
        .data
        .try_borrow_mut()
        .unwrap();
    let mut your_pool_data: YourPool =
        YourPool::try_from_slice(&your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES])
            .unwrap();

    if your_pool_data.acc_type != 0 {
        msg!("CustomError::PoolAddressAlreadyInitialized");
        return Err(CustomError::PoolAddressAlreadyInitialized.into());
    }
    your_pool_data.acc_type = AccTypesWithVersion::YourPoolDataV1 as u8;
    your_pool_data.pda_nonce = bump_seed;

    your_pool_data.owner_wallet = *pool_owner_wallet_account.key;
    your_pool_data.staking_vault = *staking_vault.key;

    your_pool_data.user_stake_count = 0u32;
    your_pool_data.user_total_stake = 0u64;

    your_pool_data.user_total_weighted_stake = 0f64;

    your_pool_data.pool_init_slot = Clock::get()?.slot;
    your_pool_data.epoch_duration_in_slots = epoch_duration_in_slots;
    your_pool_data.rewards_per_slot = 0u64;
    your_pool_data.max_reward_rate = 0u64;
    your_pool_data.min_reward_rate = 0u64;

    your_pool_data.max_unlock_duration_in_slots = epoch_duration_in_slots;
    your_pool_data.min_unlock_duration_in_slots = epoch_duration_in_slots;

    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());

    msg!("Fund pool started...");

    // Fund pool
    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
    }

    if staking_vault.owner != token_program.key {
        msg!("CustomError::AccountOwnerShouldBeTokenProgram");
        return Err(CustomError::AccountOwnerShouldBeTokenProgram.into());
    }

    let staking_vault_data = TokenAccount::unpack(&staking_vault.data.borrow())?;
    let (pool_signer_address, _bump_seed) =
        Pubkey::find_program_address(&[&your_pool_storage_account.key.to_bytes()], program_id);

    if staking_vault_data.owner != pool_signer_address {
        msg!("CustomError::InvalidStakingVault");
        return Err(CustomError::InvalidStakingVault.into());
    }

    if fund_pool > 0 {
        msg!("Calling the token program to transfer YOUR rewards to Rewards Vault...");
        invoke(
            &spl_token::instruction::transfer(
                token_program.clone().key,
                your_rewards_ata_to_debit.key,
                your_rewards_vault.key,
                funder_wallet_account.key,
                &[],
                fund_pool,
            )?,
            &[
                your_rewards_ata_to_debit.clone(),
                your_rewards_vault.clone(),
                funder_wallet_account.clone(),
                token_program.clone(),
            ],
        )?;
    }

    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());

    Ok(())
}
