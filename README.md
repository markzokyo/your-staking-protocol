# YOUR Staking protocol
YOUR Staking is epoch based staking protocol with self-balancing yield and automatic stake prolongation.

## Development requirements
* Ubuntu 20.04 or higher
* Rust 1.5.0+
* Solana SDK 1.8.6+

### CLI and functional test requirements
* node v14.19.3+
* ts-node v10.7.0+
* solana-validator node

## Development
Contracts are written in pure solana-sdk without Anchor hence there is no need in additional tools except cargo and rust to build and run your-staking-protocol.

### Program
Program is located and `{workspace}/src` and implements following actions
* `src/processor/initialize_pool.rs` initialize pool with the following epoch length and rewards
* `src/processor/close_pool.rs` terminates pool once every user have unstaked and every reward was claimed
* `src/processor/create_user.rs` creates a new user for the given wallet
* `src/processor/close_user.rs` terminates user account once user unstakes and claim all staked tokens
* `src/processor/stake.rs` stakes given amount of tokens with corresponding epoch weight
* `src/processor/unstake.rs` unstakes given amount locked for some period
* `src/processor/final_unstake.rs` claims unstaked tokens once they are unlocked
* `src/processor/claim_rewards.rs` claims user rewards
* `src/processor/update_rates.rs` admin-only function to configure pools parameters in runtime

### Functional tests
Source code is covered with functional-tests that implements user scenarios. Functional tests are located at `interface/test` and are run on local solana-validator node

You can run tests with the following snippet
```
./deploy-localnet.sh &&
./create_mock_token.sh &&
./setup_test_env.sh

cd interface
npm i
npm run test -- --runInBand
```

## Deployment
Deployment requires wallet that has at least `3.74648964 SOL`

There is 3 scripts that deploys contracts to the corresponding environments
* deploy-localnet.sh that deploys to local validator node
* deploy-devnet.sh that deploys to solana devnet
* deploy-mainnet.sh that deploys to solana mainnet

localnet and devnet deployments are self-sufficient and creates mock YOUR token. mainnet deployment requires account with at least `{rewards}` amount of YOUR tokens and environment with YOUR-token public-key.

### Deployment steps
Basically deployment scripts do following steps
* Generation of program and admin keypairs. Those keys will hold staking program and allow owner to configure staking parameters
* Build solana program
* Deploy solana program to the program keypair
* Generates pool-storage, staking-vault and rewards-vault keypairs that holds pool data, staked tokens and rewards tokens correspondingly
* [Local|Dev] Generates mock token and mint 1'000'000 Mock YOUR token to admin keypair

## CLI
Once staking program is deployed it should be initialized and configured. Those steps could be done via `staking-protocol-cli` provided with the contracts.

Initialization could be done with the following command
```
ts-node src/main.ts initialize_pool {epoch_duration_in_slots} {rewards_in_solana_decimals}
```

Where `{epoch_duration_in_slots}` is epoch duration given in solana SLOT (that is approximately 500ms) and cannot be changed once pool is initialized and `{rewards_in_solana_decimals}` is rewards transferred from admin account to rewards-vault.


After initialization pool rewards should be configured with the following command
```
ts-node src/main.ts change_rates {rewards_rate_per_slot_in_decimals} {max_rewards_rate_in_decimals} {min_reward_rate_in_decimals}
```

Where `{rewards_rate_per_slot_in_decimals}` is calculated as `{rewards_per_epoch} / {epoch_duration_in_slots}` and configures how much rewards are yield for 1 epoch slot and `{max_rewards_rate_in_decimals}`/`{min_reward_rate_in_decimals}` configures APY in percents.

all `*_in_decimals` parameters are given with 10^9 precision so `1` is `0.000'000'001`

Unlock period is default to `by the epoch end` and could be configured with the following command
```
ts-node src/main.ts change_unlock_duration {max_lock_slots_in_decimals} {min_lock_slots_in_decimals}
```

## Calculations

![formulas](https://user-images.githubusercontent.com/100131111/171723085-36c6f60b-f500-4631-9023-d0f813d76238.png)

