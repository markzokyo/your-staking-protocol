MOCK_TOKEN_KEYPAIR_FILE=mock-token-keypair.json
yes | solana-keygen new --force --outfile ./$MOCK_TOKEN_KEYPAIR_FILE

spl-token create-token $MOCK_TOKEN_KEYPAIR_FILE
MOCK_TOKEN=$(solana-keygen pubkey $MOCK_TOKEN_KEYPAIR_FILE)

spl-token create-account ${MOCK_TOKEN}

spl-token mint ${MOCK_TOKEN} 1000000000