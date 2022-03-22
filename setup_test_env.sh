echo "SETUP ENVIRONMENT"
echo "Create mock user"
SOLANA_URL=http://127.0.0.1:8899
MOCK_USER_KEYPAIR_FILE=mock-user-keypair.json
yes | solana-keygen new --force --outfile ./$MOCK_USER_KEYPAIR_FILE

solana airdrop --commitment confirmed --url $SOLANA_URL --keypair ./$MOCK_USER_KEYPAIR_FILE 1

echo "Generate storage & vaults"
yes | solana-keygen new --force --outfile pool-storage-keypair.json
yes | solana-keygen new --force --outfile staking-vault-keypair.json
yes | solana-keygen new --force --outfile reward-vault-keypair.json

echo "Fund user & vault with mock token"
MOCK_TOKEN=$(solana-keygen pubkey $MOCK_TOKEN_KEYPAIR_FILE)
spl-token create-account ${MOCK_TOKEN} $MOCK_USER_KEYPAIR_FILE
spl-token transfer ${MOCK_TOKEN} 1000 $(solana-keygen pubkey $MOCK_USER_KEYPAIR_FILE) --allow-unfunded-recipient --fund-recipient
spl-token transfer ${MOCK_TOKEN} 1000 $(solana-keygen pubkey reward-vault-keypair.json) --allow-unfunded-recipient --fund-recipient

echo "DONE"
