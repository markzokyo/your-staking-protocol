import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { YourPoolData, UserData } from ".";
import { Pubkeys } from "../constants";
import { getUserStorageAccount } from "../utils";



export async function getUserPendingRewards(userWallet: PublicKey): Promise<number> {
    const U64_MAX = new BN("18446744073709551615", 10);
    let yourPoolData = await YourPoolData.fromAccount(Pubkeys.yourPoolStoragePubkey);
    if (yourPoolData == null) {
        throw new Error("Pool Does Not Exist");
    }
    console.log('yourPoolData', yourPoolData);

    let userDataStorageAddress = await getUserStorageAccount(userWallet);
    let userData = await UserData.fromAccount(userDataStorageAddress);
    if (userData == null) {
        return 0;
    }
    console.log('userData', userData);

    return userData.unstakePending.toNumber();
}