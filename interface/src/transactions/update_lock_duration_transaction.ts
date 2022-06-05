import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { YourStakingInstructions } from '../models';
import BN from 'bn.js';
export async function changeUnlockDurationTransaction(
    poolOwnerPubkey: PublicKey,
    max_lock_slots_in_decimals,
    min_lock_slots_in_decimals,
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();
    const createUserIx = new TransactionInstruction({
        programId: Pubkeys.yourStakingProgramId,
        keys: [
            {
                pubkey: poolOwnerPubkey,
                isSigner: true,
                isWritable: false,
            },
            {
                pubkey: Pubkeys.yourPoolStoragePubkey,
                isSigner: false,
                isWritable: true,
            },
        ],
        data: Buffer.from([
            YourStakingInstructions.UpdateDuration,
            ...new BN(max_lock_slots_in_decimals).toArray('le', 8),
            ...new BN(min_lock_slots_in_decimals).toArray('le', 8),
        ]),
    });
    const createUserTx = new Transaction().add(createUserIx);
    createUserTx.recentBlockhash = (
        await connection.getLatestBlockhash()
    ).blockhash;
    createUserTx.feePayer = poolOwnerPubkey;

    return createUserTx;
}
