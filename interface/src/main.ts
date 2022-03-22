import { Keypair, sendAndConfirmTransaction } from '@solana/web3.js';

import { ConnectionService, SolanaNet } from '../src/config';
import { createInitializePoolTransaction } from './transactions';
import { Pubkeys } from './constants';
import { getKeyPair } from '../scripts/get-public-key';

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

const rewardDurationInDays: number = 1 / 86400;

let main = async () => {

  const initializePoolTx = await createInitializePoolTransaction(
    adminAccount.publicKey,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
    rewardDurationInDays,
    1
  );
  const connection = ConnectionService.getConnection();
  await sendAndConfirmTransaction(connection, initializePoolTx, [
    adminAccount,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
  ]);
}

if (require.main === module) {
  Pubkeys.yourStakingProgramId = getProgramAccount().publicKey;
  Pubkeys.stakingMintPubkey = tokenAccont.publicKey;
  Pubkeys.yourTokenMintPubkey = tokenAccont.publicKey;
  Pubkeys.rewardsMintPubkey = tokenAccont.publicKey;
  Pubkeys.yourPoolStoragePubkey = yourPoolStorageAccount.publicKey;
  Pubkeys.yourStakingVaultPubkey = yourStakingVault.publicKey;
  Pubkeys.yourRewardsVaultPubkey = yourRewardsVault.publicKey;

  ConnectionService.setNet(SolanaNet.LOCALNET);

  main()
  .then(
    _ => console.info("Successfully initialized pool")
  )
  .catch(
    reason => console.error(reason)
  );
}