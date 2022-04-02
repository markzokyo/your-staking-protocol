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

    userWallet: StringPublicKey;
    yourPool: StringPublicKey;

    unstakePending: BN;
    unstakePendingDate: BN;

    nonce: number;
    claimTimeoutDate: BN;

    userWeightedEpoch: BN;
    userWeightedStake: BN;
    balanceYourStaked: BN;

    constructor(args: {
        accountType: number;
    
        userWallet: StringPublicKey;
        yourPool: StringPublicKey;
    
        unstakePending: BN;
        unstakePendingDate: BN;
    
        nonce: number;
        claimTimeoutDate: BN;
    
        userWeightedEpoch: BN;
        userWeightedStake: BN;
        balanceYourStaked: BN;
    }) {
        this.accountType = args.accountType;
        this.userWallet = args.userWallet;
        this.yourPool = args.yourPool;
        this.unstakePending = args.unstakePending;
        this.unstakePendingDate = args.unstakePendingDate;
        this.nonce = args.nonce;
        this.claimTimeoutDate = args.claimTimeoutDate;
        this.userWeightedEpoch = args.userWeightedEpoch;
        this.userWeightedStake = args.userWeightedStake;
        this.balanceYourStaked = args.balanceYourStaked;
    }

    getUserWalletPubkey(): PublicKey {
        return new PublicKey(this.userWallet);
    }

    getPoolPubkey(): PublicKey {
        return new PublicKey(this.yourPool);
    }

    getBalanceStaked(): number {
        return this.balanceYourStaked.div(new BN(Constants.toYourRaw)).toNumber();
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

export const USER_STORAGE_TOTAL_BYTES = 114;

export const USER_STORAGE_DATA_ON_CHAIN_SCHEMA = new Map<any, any>([
    [
        UserData,
        {
            kind: 'struct',
            fields: [
                ['accountType', 'u8'],
                ['userWallet', 'pubkeyAsString'],
                ['yourPool', 'pubkeyAsString'],
                ['unstakePending', 'u64'],
                ['unstakePendingDate', 'u64'],
                ['nonce', 'u8'],
                ['claimTimeoutDate', 'u64'],
                ['userWeightedEpoch', 'u64'],
                ['userWeightedStake', 'u64'],
                ['balanceYourStaked', 'u64'],
            ],
        },
    ],
]);
