#!/bin/bash
set -e

echo "SETUP ENVIRONMENT"

echo "DONE"

./deploy-localnet.sh
cd interface
npm i
npm run test -- --runInBand
