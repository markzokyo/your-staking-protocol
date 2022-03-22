import {Buffer} from 'buffer';
import {PublicKey} from '@solana/web3.js';
import {deserializeUnchecked} from 'borsh';
import BN from 'bn.js';
import { StringPublicKey } from '../data/ids';
import { ConnectionService } from '../config';
import { extendBorsh } from '../data/borsch';
import { Constants } from '../constants';

export class YourPoolData {
  accountType: number;
    ownerWallet: StringPublicKey;
    stakingVault: StringPublicKey;
    stakingMint: StringPublicKey;
    rewardVault: StringPublicKey;
    rewardMint: StringPublicKey;
    rewardRate: BN;
    rewardDuration: BN;
    totalStakeLastUpdateTime: BN;
    rewardPerTokenStored: BN;
    userStakeCount: BN;
    pdaNonce: number;
    rewardDurationEnd: BN;

  constructor(args: {
    accountType: number;
    ownerWallet: StringPublicKey;
    stakingVault: StringPublicKey;
    stakingMint: StringPublicKey;
    rewardVault: StringPublicKey;
    rewardMint: StringPublicKey;
    rewardRate: BN;
    rewardDuration: BN;
    totalStakeLastUpdateTime: BN;
    rewardPerTokenStored: BN;
    userStakeCount: BN;
    pdaNonce: number;
    rewardDurationEnd: BN;
  }) {
    this.accountType = args.accountType;
    this.ownerWallet = args.ownerWallet;
    this.stakingVault = args.stakingVault;
    this.stakingMint = args.stakingMint;
    this.rewardVault = args.rewardVault;
    this.rewardMint = args.rewardMint;
    this.rewardRate = args.rewardRate;
    this.rewardDuration = args.rewardDuration;
    this.totalStakeLastUpdateTime = args.totalStakeLastUpdateTime;
    this.rewardPerTokenStored = args.rewardPerTokenStored;
    this.userStakeCount = args.userStakeCount;
    this.pdaNonce = args.pdaNonce;
    this.rewardDurationEnd = args.rewardDurationEnd;
  }

  getAuthorityPubkey(): PublicKey {
    return new PublicKey(this.ownerWallet);
  }

  getStakingVaultPubkey(): PublicKey {
    return new PublicKey(this.stakingVault);
  }

  getStakingMintPubkey(): PublicKey {
    return new PublicKey(this.stakingMint);
  }

  getRewardVaultPubkey(): PublicKey {
    return new PublicKey(this.rewardVault);
  }

  getRewardMintPubkey(): PublicKey {
    return new PublicKey(this.rewardMint);
  }

  getRewardRate(): number {
    return this.rewardRate.div(new BN(Constants.toYourRaw)).toNumber();
  }

  getRewardDuration(): number {
    return this.rewardDuration.toNumber();
  }

  getRewardDurationInDays(): number {
    return this.rewardDuration.toNumber()/86400;
  }

  getTotalStakeLastUpdateTime(): number {
    return this.totalStakeLastUpdateTime.toNumber();
  }

  getRewardPerTokenStored(): number {
    return this.rewardPerTokenStored.div(new BN('18446744073709551615').mul(new BN(Constants.toRewardTokenRaw))).toNumber();
  }

  getUserStakeCount(): number {
    return this.userStakeCount.toNumber();
  }

  getPdaNonce(): number {
    return this.pdaNonce;
  }


  getRewardDurationEnd(): number {
    return this.rewardDurationEnd.toNumber();
  }

  static async fromAccount(account: PublicKey): Promise<YourPoolData | null> {
    const connection = ConnectionService.getConnection();
    const accountData = await connection.getAccountInfo(account);
    if (!accountData) return null;
    return YourPoolData.fromBuffer(accountData?.data);
  }

  static fromBuffer(buffer: Buffer): YourPoolData {
    extendBorsh();
    return deserializeUnchecked(
      YOUR_POOL_DATA_ON_CHAIN_SCHEMA,
      YourPoolData,
      buffer.slice(0, YOUR_POOL_STORAGE_TOTAL_BYTES)
    );
  }
}

export const YOUR_POOL_STORAGE_TOTAL_BYTES = 374;

export const YOUR_POOL_DATA_ON_CHAIN_SCHEMA = new Map<any, any>([
  [
    YourPoolData,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['ownerWallet', 'pubkeyAsString'],
        ['stakingVault', 'pubkeyAsString'],
        ['stakingMint', 'pubkeyAsString'],
        ['rewardVault', 'pubkeyAsString'],
        ['rewardMint', 'pubkeyAsString'],
        ['rewardRate', 'u64'],
        ['rewardDuration', 'u64'],
        ['totalStakeLastUpdateTime', 'u64'],
        ['rewardsPerTokenStored', 'u128'],
        ['userStakeCount', 'u32'],
        ['pdaNonce', 'u8'],
        ['rewardDurationEnd', 'u64'],
      ],
    },
  ],
]);
