import { Contract } from "ethers";

export interface VestingSchedule {
  totalAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  claimedAmount: bigint;
  isActive: boolean;
}

export interface BTBToken extends Contract {
  balanceOf(account: string): Promise<bigint>;
  approve(spender: string, amount: bigint): Promise<any>;
  transfer(recipient: string, amount: bigint): Promise<any>;
}

export interface TokenSale extends Contract {
  vestingNFT(): Promise<string>;
  buyTokensInstant(options: { value: bigint }): Promise<any>;
  buyTokensVesting(options: { value: bigint }): Promise<any>;
  claimVestedTokens(tokenId: bigint): Promise<any>;
  withdrawEth(): Promise<any>;
  withdrawTokens(amount: bigint): Promise<any>;
  withdrawAllTokens(): Promise<any>;
}

export interface VestingNFT extends Contract {
  getVestingSchedule(tokenId: bigint): Promise<VestingSchedule>;
  ownerOf(tokenId: bigint): Promise<string>;
  tokenURI(tokenId: bigint): Promise<string>;
}
