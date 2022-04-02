import BN from "bn.js";

/**
 * General constants
 */
export class Constants {
  static yourDecimals = 9;

  static toYourRaw: number = Math.pow(10, Constants.yourDecimals);

  static maxYourSupply = new BN(1_000_000_000).mul(new BN(Constants.toYourRaw));

  static rewardTokenDecimals = 9;

  static toRewardTokenRaw = Math.pow(10, Constants.rewardTokenDecimals);

}
