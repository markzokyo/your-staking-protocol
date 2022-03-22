import {requestAirdrop} from "./testHelpers";
import {Keypair, sendAndConfirmTransaction, Transaction} from "@solana/web3.js";
import {Constants, Pubkeys} from "../src/constants";
import {ConnectionService} from "../src/config";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {findAssociatedTokenAddress} from "../src/utils";
import BN from "bn.js";

const adminAccount: Keypair = Keypair.generate();

const yourPoolStorageAccount: Keypair = Keypair.generate();
const yourStakingVault: Keypair = Keypair.generate();
const yourRewardsVault: Keypair = Keypair.generate();

const walletAccount: Keypair = Keypair.generate();

const rewardDurationInDays: number = 1 / 86400;
const yourDecimals = 9;
const rewardTokenDecimals = 9;

async function setupEnvironment() {
    Constants.yourDecimals = yourDecimals;
    Constants.rewardTokenDecimals = rewardTokenDecimals;

    const connection = ConnectionService.getConnection();

    await requestAirdrop(adminAccount.publicKey);

    const yourTokenMint = await Token.createMint(
        connection,
        adminAccount,
        adminAccount.publicKey,
        null,
        yourDecimals,
        TOKEN_PROGRAM_ID
    );

    Pubkeys.stakingMintPubkey = yourTokenMint.publicKey;
    Pubkeys.yourTokenMintPubkey = yourTokenMint.publicKey;

    const rewardTokenMint = yourTokenMint;
    Pubkeys.rewardsMintPubkey = rewardTokenMint.publicKey;

    const adminRewardTokenData = await findAssociatedTokenAddress(
        adminAccount.publicKey,
        Pubkeys.rewardsMintPubkey
    );
    const funderRewardAtaInfo = await connection.getAccountInfo(
        adminRewardTokenData
    );
    const doesRewardsAtaExist = funderRewardAtaInfo?.owner !== undefined;

    if (!doesRewardsAtaExist) {
        const createFunderRewardsAtaIx =
            Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                Pubkeys.rewardsMintPubkey,
                adminRewardTokenData,
                adminAccount.publicKey,
                adminAccount.publicKey
            );
        const createFunderRewardsAtaTx = new Transaction().add(
            createFunderRewardsAtaIx
        );
        await sendAndConfirmTransaction(connection, createFunderRewardsAtaTx, [
            adminAccount,
        ]);
    }

    const rewardsTokenToMint: number = 10000;
    const rewardTokensToMintRaw = new BN(rewardsTokenToMint)
        .mul(new BN(Constants.toYourRaw))
        .toArray('le', 8);
    await rewardTokenMint.mintTo(
        adminRewardTokenData,
        adminAccount.publicKey,
        [],
        new u64(rewardTokensToMintRaw)
    );


    await requestAirdrop(walletAccount.publicKey);

    const userYourTokenData = await findAssociatedTokenAddress(
        walletAccount.publicKey,
        Pubkeys.yourTokenMintPubkey
    );

    const userYourDataInfo = await connection.getAccountInfo(userYourTokenData);
    const doesUserYourDataExist = userYourDataInfo?.owner !== undefined;
    if (!doesUserYourDataExist) {
        const createUserYourDataIx = Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            Pubkeys.yourTokenMintPubkey,
            userYourTokenData,
            walletAccount.publicKey,
            walletAccount.publicKey
        );
        const createUserYourDataTx = new Transaction().add(createUserYourDataIx);
        await sendAndConfirmTransaction(connection, createUserYourDataTx, [
            walletAccount,
        ]);
    }
    const yourTokensToMint: number = 1000;
    const yourTokensToMintRaw = new BN(yourTokensToMint)
        .mul(new BN(Constants.toYourRaw))
        .toArray('le', 8);
    await yourTokenMint.mintTo(
        userYourTokenData,
        adminAccount.publicKey,
        [],
        new u64(yourTokensToMintRaw)
    );

    Pubkeys.yourPoolStoragePubkey = yourPoolStorageAccount.publicKey;
    Pubkeys.yourStakingVaultPubkey = yourStakingVault.publicKey;
    Pubkeys.yourRewardsVaultPubkey = yourRewardsVault.publicKey;
}

export {
    adminAccount,
    walletAccount,
    setupEnvironment,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
    rewardDurationInDays
}