import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { deserializeUnchecked } from 'borsh';
import BN from 'bn.js';
import { StringPublicKey } from '../data/ids';
import { ConnectionService } from '../config';
import { extendBorsh } from '../data/borsch';
import { Constants } from '../constants';

export class YourPoolData {
  accountType: number;
  pdaNonce: number;

  ownerWallet: StringPublicKey;
  stakingVault: StringPublicKey;

  userStakeCount: BN;
  userTotalStake: BN;

  epochDuration: BN;
  rewardPerSlot: BN;
  maxRewardRate: BN;
  minRewardRate: BN;
  
  weightedEpochId: BN;
  totalWeightedStake: BN;

  constructor(args: {
    accountType: number;
    pdaNonce: number;
  
    ownerWallet: StringPublicKey;
    stakingVault: StringPublicKey;
  
    userStakeCount: BN;
    userTotalStake: BN;
  
    epochDuration: BN;
    rewardPerSlot: BN;
    maxRewardRate: BN;
    minRewardRate: BN;
    
    weightedEpochId: BN;
    totalWeightedStake: BN;
  }) {
    this.accountType = args.accountType;
    this.pdaNonce = args.pdaNonce;

    this.ownerWallet = args.ownerWallet;
    this.stakingVault = args.stakingVault;

    this.userStakeCount = args.userStakeCount;
    this.userTotalStake = args.userTotalStake;

    this.epochDuration = args.epochDuration;
    this.rewardPerSlot = args.rewardPerSlot;
    this.maxRewardRate = args.maxRewardRate;
    this.minRewardRate = args.minRewardRate;

    this.weightedEpochId = args.weightedEpochId;
    this.totalWeightedStake = args.totalWeightedStake;
  }

  getAuthorityPubkey(): PublicKey {
    return new PublicKey(this.ownerWallet);
  }

  getStakingVaultPubkey(): PublicKey {
    return new PublicKey(this.stakingVault);
  }

  getUserStakeCount(): number {
    return this.userStakeCount.toNumber();
  }

  getPdaNonce(): number {
    return this.pdaNonce;
  }

  static async fromAccount(account: PublicKey): Promise<YourPoolData | null> {
    const connection = ConnectionService.getConnection();
    const accountData = await connection.getAccountInfo(account);
    if (!accountData) return null;
    return YourPoolData.fromBuffer(accountData?.data);
  }

  static fromBuffer(buffer: Buffer): YourPoolData {
    console.log("buffer", buffer);
    extendBorsh();
    return deserializeUnchecked(
      YOUR_POOL_DATA_ON_CHAIN_SCHEMA,
      YourPoolData,
      buffer.slice(0, YOUR_POOL_STORAGE_TOTAL_BYTES)
    );
  }
}

export const YOUR_POOL_STORAGE_TOTAL_BYTES = 126;

export const YOUR_POOL_DATA_ON_CHAIN_SCHEMA = new Map<any, any>([
  [
    YourPoolData,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['pdaNonce', 'u8'],

        ['ownerWallet', 'pubkeyAsString'],
        ['stakingVault', 'pubkeyAsString'],

        ['userStakeCount', 'u32'],
        ['userTotalStake', 'u64'],
        
        ['epochDuration', 'u64'],
        ['rewardPerSlot', 'u64'],
        ['maxRewardRate', 'u64'],
        ['minRewardRate', 'u64'],
        
        ['weightedEpochId', 'i64'],
        ['totalWeightedStake', 'f64'],
      ],
    },
  ],
]);
