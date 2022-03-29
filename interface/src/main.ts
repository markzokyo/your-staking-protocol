import { Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';

import { ConnectionService, SolanaNet } from '../src/config';
import { createInitializePoolTransaction, createUpdateRatesTransaction } from './transactions';
import { Pubkeys, Constants } from './constants';
import { getKeyPair } from '../scripts/get-public-key';
import { YourPoolData, UserData } from './models';

export function getProgramAccount(): Keypair {
  return getKeyPair('../program-keypair.json');
}

export function getAdminAccount(): Keypair {
  return getKeyPair('../admin-keypair.json');
}

export function getTokenAccount(): Keypair {
  return getKeyPair('../mock-token-keypair.json');
}

export function getUserAccount(): Keypair {
  return getKeyPair('../mock-user-keypair.json');
}

export function getYourPoolStorageAccount(): Keypair {
  return getKeyPair('../pool-storage-keypair.json');
}
export function getYourStakingVault(): Keypair {
  return getKeyPair('../staking-vault-keypair.json');
}
export function getYourRewardsVault(): Keypair {
  return getKeyPair('../reward-vault-keypair.json');
}

const adminAccount: Keypair = getAdminAccount();

const tokenAccont: Keypair = getTokenAccount();

const yourPoolStorageAccount: Keypair = getYourPoolStorageAccount();
const yourStakingVault: Keypair = getYourStakingVault();
const yourRewardsVault: Keypair = getYourRewardsVault();

ConnectionService.setNet(SolanaNet.DEVNET);
const connection = ConnectionService.getConnection();

let initialize_pool = async (reward_duration: number, reward_pool: number) => {
  console.debug("initialize_pool", reward_duration, reward_pool);
  const initializePoolTx = await createInitializePoolTransaction(
    adminAccount.publicKey,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
    reward_duration,
    reward_pool * Constants.toYourRaw
  );
  console.debug("awaiting transaction", initializePoolTx);
  await sendAndConfirmTransaction(connection, initializePoolTx, [
    adminAccount,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
  ]);
}

let change_rates = async (rewards_per_slot: number, max_reward_rate: number, min_reward_rate: number) => {
  const createUpdateRatesTx = await createUpdateRatesTransaction(adminAccount.publicKey, rewards_per_slot, max_reward_rate, min_reward_rate);
  await sendAndConfirmTransaction(connection, createUpdateRatesTx, [adminAccount]);
}

let get_pool_state = async (poolStorage: PublicKey) => {
  let yourPoolData = await YourPoolData.fromAccount(poolStorage);
  if (yourPoolData == null) {
      throw new Error("Pool Does Not Exist");
  }
  
  console.info(yourPoolData);
}

if (require.main === module) {
  Pubkeys.yourStakingProgramId = getProgramAccount().publicKey;
  Pubkeys.stakingMintPubkey = tokenAccont.publicKey;
  Pubkeys.yourTokenMintPubkey = tokenAccont.publicKey;
  Pubkeys.rewardsMintPubkey = tokenAccont.publicKey;
  Pubkeys.yourPoolStoragePubkey = yourPoolStorageAccount.publicKey;
  Pubkeys.yourStakingVaultPubkey = yourStakingVault.publicKey;
  Pubkeys.yourRewardsVaultPubkey = yourRewardsVault.publicKey;

  switch( process.argv[2] ) {
    case "initialize_pool": {
      if (process.argv.length < 4) {
        throw "signature mismatch; initialize_pool(reward_duration: number, reward_pool: number)";
      }

      initialize_pool(Number.parseInt(process.argv[3]), Number.parseInt(process.argv[4]))
      .then(
        _ => console.info("Successfully initialized pool")
      )
      .catch(
        reason => console.error(reason)
      );

      break;
    }
    case "change_rates": {
      if (process.argv.length < 5) {
        throw "signature mismatch; change_rates(rewards_per_slot: number, max_reward_rate: number, min_reward_rate: number)";
      }

      change_rates(Number.parseInt(process.argv[3]), Number.parseInt(process.argv[4]), Number.parseInt(process.argv[5]))
      .then(
        _ => console.info("Successfully changed rates")
      )
      .catch(
        reason => console.error(reason)
      );

      break;
    }
    case "get_pool_state": {
      get_pool_state(yourPoolStorageAccount.publicKey)
      .then(
        _ => console.info("Successfully requested pool data")
      )
      .catch(
        reason => console.error(reason)
      );

      break;
    }
    default: {
      throw "unknown command";
    }
  }
}