import {PublicKey} from '@solana/web3.js';

/**
 * Account Public Keys
 */
export class Pubkeys {
  static yourStakingProgramId = new PublicKey(
    (process.env.REACT_APP_SOLANA_PROGRAM_ID as string) ?? 'AVZLpJUVMSUYnwDVrW8sYurvZ8YuVKsimy1T4mSzttX5'
  );

  static splAssociatedTokenAccountProgramId = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
  );

  static yourTokenMintPubkey = new PublicKey(
    'AZ2rxXUmnffG5AjLSfQYYhXCJYEaBFFpxqHBL8PmWxru'
  );

  static stakingMintPubkey = new PublicKey(
    'AZ2rxXUmnffG5AjLSfQYYhXCJYEaBFFpxqHBL8PmWxru'
  );

  static rewardsMintPubkey = new PublicKey(
    'AZ2rxXUmnffG5AjLSfQYYhXCJYEaBFFpxqHBL8PmWxru'
  );

  static yourPoolStoragePubkey = new PublicKey(
    'AZ2rxXUmnffG5AjLSfQYYhXCJYEaBFFpxqHBL8PmWxru'
  );

  static yourStakingVaultPubkey = new PublicKey(
    'AZ2rxXUmnffG5AjLSfQYYhXCJYEaBFFpxqHBL8PmWxru'
  );

  static yourRewardsVaultPubkey = new PublicKey(
    'AZ2rxXUmnffG5AjLSfQYYhXCJYEaBFFpxqHBL8PmWxru'
  );
}
