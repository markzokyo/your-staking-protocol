// ~2 days in slots, 1'000'000 YOUR tokens as reward pool
ts-node src/main.ts initialize_pool 345600 1000000

// 1^-9 rewards per slot, max reward rate 20%, min reward rate 10%
ts-node src/main.ts change_rates 1 20000000000 10000000000

//  ~2 days in slots, ~2 days in slots
ts-node src/main.ts change_unlock_duration 345600 345600

spl-token transfer ${MOCK_TOKEN} 100 AEmB7okxrn5ksnHk1rMYGbH81Z4x5LaqzeqUZNtyZQ93 --allow-unfunded-recipient --fund-recipient