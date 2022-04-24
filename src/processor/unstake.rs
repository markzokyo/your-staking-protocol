use crate::{
    error::CustomError,
    processor::create_user::get_user_storage_address_and_bump_seed,
    state::{
        AccTypesWithVersion, User, YourPool, USER_STORAGE_TOTAL_BYTES,
        YOUR_POOL_STORAGE_TOTAL_BYTES, REWARD_RATE_PRECISION
    },
    utils
};

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::clock::Clock,
    sysvar::Sysvar,
};

pub fn process_unstake(
    accounts: &[AccountInfo],
    amount_to_withdraw: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_wallet_account = next_account_info(account_info_iter)?;
    let user_storage_account = next_account_info(account_info_iter)?;
    let your_pool_storage_account = next_account_info(account_info_iter)?;
    let _staking_vault = next_account_info(account_info_iter)?;
    let _user_your_ata = next_account_info(account_info_iter)?;
    let _pool_signer_pda = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !user_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }
    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
    }

    if amount_to_withdraw == 0u64 {
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

    if user_storage_data.user_stake < amount_to_withdraw {
        msg!("CustomError::InsufficientFundsToUnstake");
        return Err(CustomError::InsufficientFundsToUnstake.into());
    }

    // update total staked for user
    user_storage_data.user_stake -= amount_to_withdraw;
    user_storage_data.user_weighted_stake -= utils::min(amount_to_withdraw as f64, user_storage_data.user_weighted_stake);

    user_storage_data.pending_unstake_amount += amount_to_withdraw;
    // user can withdraw tokens after beginning of the next epoch, so that pool total staked is not affected during current epoch
    let current_epoch = (Clock::get()?.slot - your_pool_data.pool_init_slot) / your_pool_data.epoch_duration_in_slots;
    user_storage_data.pending_unstake_slot = your_pool_data.pool_init_slot + (current_epoch + 1) * your_pool_data.epoch_duration_in_slots + 1;

    user_data_byte_array[0usize..USER_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&user_storage_data.try_to_vec().unwrap());
    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());

    Ok(())
}
