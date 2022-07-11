#!/bin/bash

set -e

SOLANA_URL=https://api.devnet.solana.com

while ! curl -X OPTIONS $SOLANA_URL
do
  echo "Waiting 2 seconds"
  sleep 2
done

solana config set --url $SOLANA_URL
solana config set --keypair $(pwd)/admin-keypair.json

echo "KEY_GEN"
ADMIN_KEYPAIR_FILE=admin-keypair.json
PAYER_KEYPAIR_FILE=$ADMIN_KEYPAIR_FILE
if [ ! -f "$ADMIN_KEYPAIR_FILE" ]; then
    echo "$ADMIN_KEYPAIR_FILE does not exist."
fi

echo "GENERATE PROGRAM ACCOUNT"
PROGRAM_KEYPAIR_FILE=program-keypair.json
yes | solana-keygen new --force --outfile ./$PROGRAM_KEYPAIR_FILE

echo "PROGRAM COMPILE"
cargo build-bpf

echo "PROGRAM DEPLOY"
solana program deploy --commitment confirmed  --keypair ./$PAYER_KEYPAIR_FILE ./target/deploy/your_staking.so --program-id ./$PROGRAM_KEYPAIR_FILE

solana program show $(solana-keygen pubkey $PROGRAM_KEYPAIR_FILE)

echo "GENERATE POOL STORAGE ACCOUNT"
POOL_KEYPAIR_FILE=pool-storage-keypair.json
yes | solana-keygen new --force --outfile ./$POOL_KEYPAIR_FILE

echo "GENERATE STAKING VAULT ACCOUNT"
STAKING_KEYPAIR_FILE=staking-vault-keypair.json
yes | solana-keygen new --force --outfile ./$STAKING_KEYPAIR_FILE

echo "GENERATE REWARDS VAULT ACCOUNT"
REWARD_KEYPAIR_FILE=reward-vault-keypair.json
yes | solana-keygen new --force --outfile ./$REWARD_KEYPAIR_FILE

echo "DONE"