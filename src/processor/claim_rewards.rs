use crate::{
    error::CustomError,
    processor::create_user::get_user_storage_address_and_bump_seed,
    state::{
        AccTypesWithVersion, User, YourPool, REWARD_RATE_PRECISION, USER_STORAGE_TOTAL_BYTES,
        YOUR_POOL_STORAGE_TOTAL_BYTES,
    },
    utils,
};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    sysvar::clock::Clock,
    sysvar::Sysvar,
};
use spl_token::state::Account as TokenAccount;

pub fn process_claim_rewards(accounts: &[AccountInfo], program_id: &Pubkey) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_wallet_account = next_account_info(account_info_iter)?;
    let user_storage_account = next_account_info(account_info_iter)?;
    let your_pool_storage_account = next_account_info(account_info_iter)?;
    let staking_vault = next_account_info(account_info_iter)?;
    let your_rewards_vault = next_account_info(account_info_iter)?;
    let user_rewards_ata = next_account_info(account_info_iter)?;
    let pool_signer_pda = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !user_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }
    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
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
    let your_pool_data: YourPool =
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
    let (pool_signer_address, bump_seed) =
        Pubkey::find_program_address(&[&your_pool_storage_account.key.to_bytes()], program_id);

    if staking_vault_data.owner != pool_signer_address {
        msg!("CustomError::InvalidStakingVault");
        return Err(CustomError::InvalidStakingVault.into());
    }

    let current_slot = Clock::get()?.slot;
    if user_storage_data.claim_timeout_slot >= current_slot {
        msg!("CustomError::UserClaimRewardTimeout");
        return Err(CustomError::UserClaimRewardTimeout.into());
    }

    let max_reward_rate = your_pool_data.max_reward_rate as f64 / REWARD_RATE_PRECISION;
    let min_reward_rate = your_pool_data.min_reward_rate as f64 / REWARD_RATE_PRECISION;
    let rewards_per_slot = your_pool_data.rewards_per_slot as f64 / REWARD_RATE_PRECISION;

    let mut reward_amount = user_storage_data.user_weighted_stake
        * utils::min(
            max_reward_rate,
            utils::max(
                min_reward_rate,
                rewards_per_slot as f64 * your_pool_data.epoch_duration_in_slots as f64
                    / your_pool_data.user_total_weighted_stake as f64,
            ),
        );

    let current_epoch =
        (current_slot - your_pool_data.pool_init_slot) / your_pool_data.epoch_duration_in_slots;
    if user_storage_data.last_claim_epoch < current_epoch {
        let unclaimed_epochs = current_epoch - user_storage_data.last_claim_epoch;
        reward_amount += unclaimed_epochs as f64
            * user_storage_data.user_stake as f64
            * utils::min(
                max_reward_rate,
                utils::max(
                    min_reward_rate,
                    rewards_per_slot as f64 * your_pool_data.epoch_duration_in_slots as f64
                        / your_pool_data.user_total_stake as f64,
                ),
            );
    }

    if reward_amount as u64 == 0 {
        msg!("CustomError::UserRewardToClaimIsZero");
        return Err(CustomError::UserRewardToClaimIsZero.into());
    }

    msg!("Calling the token program to transfer YOUR to User from Rewards Vault...");
    invoke_signed(
        &spl_token::instruction::transfer(
            token_program.key,
            your_rewards_vault.key,
            user_rewards_ata.key,
            &pool_signer_address,
            &[&pool_signer_address],
            reward_amount as u64,
        )?,
        &[
            your_rewards_vault.clone(),
            user_rewards_ata.clone(),
            pool_signer_pda.clone(),
            token_program.clone(),
        ],
        &[&[&your_pool_storage_account.key.to_bytes(), &[bump_seed]]],
    )?;

    // wipe weighted stats for user (as he cleared them)
    user_storage_data.last_claim_epoch = current_epoch;
    user_storage_data.user_weighted_stake = 0f64;

    // next claim is available at first slot of the next epoch
    user_storage_data.claim_timeout_slot = your_pool_data.pool_init_slot
        + (current_epoch + 1) * your_pool_data.epoch_duration_in_slots
        + 1;

    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());
    user_data_byte_array[0usize..USER_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&user_storage_data.try_to_vec().unwrap());
    Ok(())
}
