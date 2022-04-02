#!/bin/bash
set -e

./deploy-localnet.sh &&
./create_mock_token.sh &&
./setup_test_env.sh

cd interface
npm i
npm run test -- --runInBand
