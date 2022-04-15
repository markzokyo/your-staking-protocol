use std::cell::RefMut;


use crate::error::CustomError;
use solana_program::account_info::AccountInfo;
use solana_program::program_error::ProgramError;

// to avoid rounding errors
const PRECISION: u128 = u64::MAX as u128;

pub mod constants {
    pub const MIN_DURATION: u64 = 86400; // 1 day
}

pub fn close_account(
    account_to_close: &AccountInfo,
    sol_receiving_account: &AccountInfo,
    account_to_close_data_byte_array: &mut RefMut<&mut [u8]>,
) -> Result<(), CustomError> {
    **sol_receiving_account.lamports.borrow_mut() = sol_receiving_account
        .lamports()
        .checked_add(account_to_close.lamports())
        .ok_or(CustomError::AmountOverflow)?;
    **account_to_close.lamports.borrow_mut() = 0;
    **account_to_close_data_byte_array = &mut [];
    Ok(())
}

pub fn earned(
    balance_your_staked: u64,
    reward_per_token_stored: u128,
    reward_per_token_complete: u128,
    reward_per_token_pending: u64,
) -> Result<u64, ProgramError> {
    let diff_reward_per_token = reward_per_token_stored
        .checked_sub(reward_per_token_complete)
        .ok_or(CustomError::AmountOverflow)?;
    let mul = ((balance_your_staked as u128)
        .checked_mul(diff_reward_per_token)
        .ok_or(CustomError::AmountOverflow)?)
    .checked_div(PRECISION)
    .ok_or(CustomError::AmountOverflow)? as u64;
    let updated_reward_per_token_pending = reward_per_token_pending
        .checked_add(mul)
        .ok_or(CustomError::AmountOverflow)?;
    Ok(updated_reward_per_token_pending)
}

pub fn min(f1: f64, f2: f64) -> f64 {
    if f1 < f2 {
        f1
    } else {
        f2
    }
}

pub fn max(f1: f64, f2: f64) -> f64 {
    if f1 > f2 {
        f1
    } else {
        f2
    }
}
