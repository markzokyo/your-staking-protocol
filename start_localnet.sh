#!/bin/bash

set -e

solana-test-validator > /dev/null 2>&1 &
VALIDATOR_PID=$!
echo "VALIDATOR_PID"
echo $VALIDATOR_PID

SOLANA_URL=http://127.0.0.1:8899
while ! curl -X OPTIONS $SOLANA_URL
do
  echo "Waiting 2 seconds"
  sleep 2
done
