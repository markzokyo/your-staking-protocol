ADMIN_KEYPAIR_FILE=admin-keypair.json
MOCK_TOKEN_KEYPAIR_FILE=mock-token-keypair.json
yes | solana-keygen new --force --outfile ./$MOCK_TOKEN_KEYPAIR_FILE

spl-token create-token $MOCK_TOKEN_KEYPAIR_FILE --mint-authority $(solana-keygen pubkey $ADMIN_KEYPAIR_FILE) --fee-payer admin-keypair.json
MOCK_TOKEN=$(solana-keygen pubkey $MOCK_TOKEN_KEYPAIR_FILE)

spl-token create-account ${MOCK_TOKEN}
# B7paBfymjKBcNU6WGquLdo5vD1mLdEBdKAdXunELaHtK

spl-token mint ${MOCK_TOKEN} 1000000000 --mint-authority $ADMIN_KEYPAIR_FILE

spl-token balance ${MOCK_TOKEN}
spl-token supply ${MOCK_TOKEN}
