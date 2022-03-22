const {getPublicKey} = require("../scripts/get-public-key");

process.env.REACT_APP_SOLANA_PROGRAM_ID = getPublicKey('../program-keypair.json');
