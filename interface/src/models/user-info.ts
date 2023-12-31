import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { deserializeUnchecked } from 'borsh';
import BN from 'bn.js';
import { StringPublicKey } from '../data/ids';
import { ConnectionService } from '../config';
import { extendBorsh } from '../data/borsch';
import { Constants } from '../constants';

export class UserData {
    accountType: number;
    nonce: number;

    userWallet: StringPublicKey;
    yourPool: StringPublicKey;

    unstakePendingAmount: BN;
    unstakePendingSlot: BN;

    claimTimeoutDate: BN;

    userWeightedEpoch: BN;
    userWeightedStake: BN;
    userStake: BN;

    constructor(args: {
        accountType: number;
        nonce: number;
    
        userWallet: StringPublicKey;
        yourPool: StringPublicKey;
    
        unstakePendingAmount: BN;
        unstakePendingSlot: BN;
    
        claimTimeoutDate: BN;
    
        userWeightedEpoch: BN;
        userWeightedStake: BN;
        userStake: BN;
    }) {
        this.accountType = args.accountType;
        this.nonce = args.nonce;
        this.userWallet = args.userWallet;
        this.yourPool = args.yourPool;
        this.unstakePendingAmount = args.unstakePendingAmount;
        this.unstakePendingSlot = args.unstakePendingSlot;
        this.claimTimeoutDate = args.claimTimeoutDate;
        this.userWeightedEpoch = args.userWeightedEpoch;
        this.userWeightedStake = args.userWeightedStake;
        this.userStake = args.userStake;
    }

    getUserWalletPubkey(): PublicKey {
        return new PublicKey(this.userWallet);
    }

    getPoolPubkey(): PublicKey {
        return new PublicKey(this.yourPool);
    }

    getBalanceStaked(): number {
        return this.userStake.div(new BN(Constants.toYourRaw)).toNumber();
    }

    getNonce(): number {
        return this.nonce;
    }

    static async fromAccount(account: PublicKey): Promise<UserData | null> {
        const connection = ConnectionService.getConnection();
        const accountData = await connection.getAccountInfo(account);
        if (!accountData) return null;
        return UserData.fromBuffer(accountData?.data);
    }

    static fromBuffer(buffer: Buffer): UserData {
        extendBorsh();
        return deserializeUnchecked(
            USER_STORAGE_DATA_ON_CHAIN_SCHEMA,
            UserData,
            buffer.slice(0, USER_STORAGE_TOTAL_BYTES)
        );
    }
}

export const USER_STORAGE_TOTAL_BYTES = 1 + 1 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8; // 114

export const USER_STORAGE_DATA_ON_CHAIN_SCHEMA = new Map<any, any>([
    [
        UserData,
        {
            kind: 'struct',
            fields: [
                ['accountType', 'u8'],
                ['nonce', 'u8'],
                ['userWallet', 'pubkeyAsString'],
                ['yourPool', 'pubkeyAsString'],
                ['unstakePendingAmount', 'u64'],
                ['unstakePendingSlot', 'u64'],
                ['claimTimeoutDate', 'u64'],
                ['userWeightedEpoch', 'u64'],
                ['userWeightedStake', 'u64'],
                ['userStake', 'u64'],
            ],
        },
    ],
]);