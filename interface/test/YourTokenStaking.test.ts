import { ConnectionService } from "../src/config";
import { Pubkeys } from "../src/constants";
import {
    createUserTransaction,
    closeUserTransaction,
    closePoolTransaction,
    stakeYourTransaction,
    unstakeYourTransaction, claimRewardsTransaction, createInitializePoolTransaction
} from "../src/transactions";
import { setupTest, timeout } from './testHelpers';
import {
    adminAccount,
    setupEnvironment,
    walletAccount,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
    rewardDurationInDays,

} from "./prepereTestsEvironment";
import { sendAndConfirmTransaction } from "@solana/web3.js";
import { finalUnstakeYourTransaction } from "../src/transactions/final-unstake-your-transaction";
import { createUpdateRatesTransaction } from "../src/transactions/update_rates_transaction";
import { getUserPendingRewards } from "../src/models";

setupTest();

describe('Your Token Staking Tests', () => {

    beforeAll(async () => {
        await setupEnvironment();
        console.log("Pubkeys", Pubkeys);
    });

    test('Initialize Pool', async () => {
        const connection = ConnectionService.getConnection();
        const initializePoolTx = await createInitializePoolTransaction(
            adminAccount.publicKey,
            yourPoolStorageAccount,
            yourStakingVault,
            yourRewardsVault,
            rewardDurationInDays,
            1000000000000
        );
        await sendAndConfirmTransaction(connection, initializePoolTx, [
            adminAccount,
            yourPoolStorageAccount,
            yourStakingVault,
            yourRewardsVault,
        ]);
    });

    test('Change Rates', async () => {
        const connection = ConnectionService.getConnection();
        const createUpdateRatesTx = await createUpdateRatesTransaction(adminAccount.publicKey, 2, 550, 230);
        await sendAndConfirmTransaction(connection, createUpdateRatesTx, [adminAccount]);
    });

    test('Create User', async () => {
        const connection = ConnectionService.getConnection();
        const createUserTx = await createUserTransaction(walletAccount.publicKey);
        await sendAndConfirmTransaction(connection, createUserTx, [walletAccount]);
    });

    test('Stake Your Tokens', async () => {
        const connection = ConnectionService.getConnection();

        const amountToStake = 1000;
        const stakeYourTx = await stakeYourTransaction(
            walletAccount.publicKey,
            amountToStake
        );
        await sendAndConfirmTransaction(connection, stakeYourTx, [walletAccount]);
    })

    test('List Rewards', async () => {
        const rewards = await getUserPendingRewards(walletAccount.publicKey);
        console.log(rewards);
    })

    test('Claim Rewards', async () => {
        const connection = ConnectionService.getConnection();

        const claimRewardsTx = await claimRewardsTransaction(walletAccount.publicKey);
        await sendAndConfirmTransaction(connection, claimRewardsTx, [walletAccount]);
    });

    test('Unstake Your', async () => {
        const connection = ConnectionService.getConnection();

        const amountToUnstake = 1000;
        const unstakeYourTx = await unstakeYourTransaction(
            walletAccount.publicKey,
            amountToUnstake
        );
        await sendAndConfirmTransaction(connection, unstakeYourTx, [walletAccount]);
    });

    test('Final unstake Your', async () => {

        const connection = ConnectionService.getConnection();
        const finalUnstakeYourTx = await finalUnstakeYourTransaction(
            walletAccount.publicKey,
        );
        await timeout(1_000);
        await sendAndConfirmTransaction(connection, finalUnstakeYourTx, [walletAccount]);
    });

    test('Close User', async () => {
        const connection = ConnectionService.getConnection();

        const closeUserTx = await closeUserTransaction(walletAccount.publicKey);
        await sendAndConfirmTransaction(connection, closeUserTx, [walletAccount]);
    });

    test('Close Pool', async () => {
        const connection = ConnectionService.getConnection();

        const closePoolTx = await closePoolTransaction(adminAccount.publicKey);
        await sendAndConfirmTransaction(connection, closePoolTx, [adminAccount]);
    });
});