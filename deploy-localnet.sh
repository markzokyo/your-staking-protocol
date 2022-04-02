#!/bin/bash

set -e

# SOLANA_URL=http://127.0.0.1:8899
SOLANA_URL=https://api.devnet.solana.com
# SOLANA_URL=https://wispy-spring-smoke.solana-devnet.quiknode.pro/0a2e6fb3b957319da150ae3bd922de842dcb93b5/
# wss://wispy-spring-smoke.solana-devnet.quiknode.pro/0a2e6fb3b957319da150ae3bd922de842dcb93b5/

# solana-test-validator > /dev/null 2>&1 &
# VALIDATOR_PID=$!
# echo "VALIDATOR_PID"
# echo $VALIDATOR_PID

while ! curl -X OPTIONS $SOLANA_URL
do
  echo "Waiting 2 seconds"
  sleep 2
done

solana config set --url $SOLANA_URL
solana config set --keypair $(pwd)/admin-keypair.json

echo "KEY_GEN"
ADMIN_KEYPAIR_FILE=admin-keypair.json
yes | solana-keygen new --force --outfile ./$ADMIN_KEYPAIR_FILE

PAYER_KEYPAIR_FILE=$ADMIN_KEYPAIR_FILE
#yes | solana-keygen new --force --outfile ./$PAYER_KEYPAIR_FILE
# PAYER_KEYPAIR_FILE=payer-keypair.json


echo "AIRDROP"
solana airdrop --commitment confirmed --url $SOLANA_URL --keypair ./$PAYER_KEYPAIR_FILE 2 # actually needed only 3.8466876
sleep 3
solana airdrop --commitment confirmed --url $SOLANA_URL --keypair ./$PAYER_KEYPAIR_FILE 2 # actually needed only 3.8466876
sleep 3
solana airdrop --commitment confirmed --url $SOLANA_URL --keypair ./$ADMIN_KEYPAIR_FILE 2

PROGRAM_KEYPAIR_FILE=program-keypair.json
yes | solana-keygen new --force --outfile ./$PROGRAM_KEYPAIR_FILE

echo "PROGRAM COMPILE"
cargo build-bpf

echo "PROGRAM DEPLOY"
solana program deploy --commitment confirmed  --keypair ./$PAYER_KEYPAIR_FILE ./target/deploy/your_staking.so --program-id ./$PROGRAM_KEYPAIR_FILE

solana program show $(solana-keygen pubkey $PROGRAM_KEYPAIR_FILE)
echo "DONE"
