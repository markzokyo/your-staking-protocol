import {Keypair, LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {ConnectionService, SolanaNet} from '../src/config';
import {getKeyPair} from '../scripts/get-public-key';

export function setupTest(): void {
  jest.setTimeout(6_000_000);
  ConnectionService.setNet(SolanaNet.LOCALNET);
}

export async function requestAirdrop(publicKey: PublicKey): Promise<void> {
  const connection = ConnectionService.getConnection();
  const airdropTxSig = await connection.requestAirdrop(
    publicKey,
    LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropTxSig, 'processed');
}

export function timeout(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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