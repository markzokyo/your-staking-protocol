use crate::{
    error::CustomError,
    processor::create_user::get_user_storage_address_and_bump_seed,
    state::{
        AccTypesWithVersion, User, YourPool, USER_STORAGE_TOTAL_BYTES,
        YOUR_POOL_STORAGE_TOTAL_BYTES,
    },
};

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    sysvar::clock::Clock,
    sysvar::Sysvar,
};
use spl_token::state::Account as TokenAccount;

pub fn process_stake(
    accounts: &[AccountInfo],
    amount_to_deposit: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_wallet_account = next_account_info(account_info_iter)?;
    let user_storage_account = next_account_info(account_info_iter)?;
    let your_pool_storage_account = next_account_info(account_info_iter)?;
    let staking_vault = next_account_info(account_info_iter)?;
    let user_your_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !user_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if amount_to_deposit == 0u64 {
        msg!("CustomError::AmountMustBeGreaterThanZero");
        return Err(CustomError::AmountMustBeGreaterThanZero.into());
    }

    let (user_storage_address, _bump_seed) = get_user_storage_address_and_bump_seed(
        user_wallet_account.key,
        your_pool_storage_account.key,
        program_id,
    );
    if user_storage_address != *user_storage_account.key {
        msg!("Error: User Storage address does not match seed derivation");
        return Err(ProgramError::InvalidSeeds);
    }

    if your_pool_storage_account.data_len() != YOUR_POOL_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }
    let mut your_pool_data_byte_array = your_pool_storage_account.data.try_borrow_mut().unwrap();
    let mut your_pool_data: YourPool =
        YourPool::try_from_slice(&your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES])
            .unwrap();
    if your_pool_data.acc_type != AccTypesWithVersion::YourPoolDataV1 as u8 {
        msg!("CustomError::ExpectedAccountTypeMismatched");
        return Err(CustomError::ExpectedAccountTypeMismatched.into());
    }

    if user_storage_account.data_len() != USER_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }

    let mut user_data_byte_array = user_storage_account.data.try_borrow_mut().unwrap();
    let mut user_storage_data: User =
        User::try_from_slice(&user_data_byte_array[0usize..USER_STORAGE_TOTAL_BYTES]).unwrap();
    if user_storage_data.acc_type != AccTypesWithVersion::UserDataV1 as u8 {
        msg!("CustomError::ExpectedAccountTypeMismatched");
        return Err(CustomError::ExpectedAccountTypeMismatched.into());
    }

    if user_storage_data.user_wallet != *user_wallet_account.key {
        msg!("CustomError::UserStorageAuthorityMismatched");
        return Err(CustomError::UserStorageAuthorityMismatched.into());
    }
    if user_storage_data.your_pool != *your_pool_storage_account.key {
        msg!("CustomError::UserPoolMismatched");
        return Err(CustomError::UserPoolMismatched.into());
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

    msg!("Calling the token program to transfer to Staking Vault...");
    invoke(
        &spl_token::instruction::transfer(
            token_program.key,
            user_your_ata.key,
            staking_vault.key,
            user_wallet_account.key,
            &[],
            amount_to_deposit,
        )?,
        &[
            user_your_ata.clone(),
            staking_vault.clone(),
            user_wallet_account.clone(),
            token_program.clone(),
        ],
    )?;

    user_storage_data.balance_your_staked = user_storage_data
        .balance_your_staked
        .checked_add(amount_to_deposit)
        .ok_or(CustomError::AmountOverflow)?;
    your_pool_data.user_total_stake = your_pool_data
        .user_total_stake
        .checked_add(amount_to_deposit)
        .ok_or(CustomError::AmountOverflow)?;

    let current_slot = Clock::get()?.slot;
    let current_epoch_coefficient =
    1.0 - ((current_slot - your_pool_data.pool_init_slot) as f64) / (your_pool_data.epoch_duration_in_slots as f64);
    
    // For current user
    let user_stake_balance = user_storage_data.balance_your_staked as f64;
    user_storage_data.user_weighted_stake = user_stake_balance * current_epoch_coefficient;
    user_storage_data.user_weighted_epoch = (current_slot - your_pool_data.pool_init_slot) / your_pool_data.epoch_duration_in_slots;

    // Same for pool
    let pool_total_stake = your_pool_data.user_total_stake as f64;
    your_pool_data.total_weighted_stake = pool_total_stake * current_epoch_coefficient;
    your_pool_data.weighted_epoch_id = Clock::get()?.epoch_start_timestamp as i64;

    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());
    user_data_byte_array[0usize..USER_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&user_storage_data.try_to_vec().unwrap());

    Ok(())
}
