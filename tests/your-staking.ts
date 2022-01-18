import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { YourStaking } from '../target/types/your_staking';

describe('your-staking', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.YourStaking as Program<YourStaking>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
