import { ethers } from "hardhat";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";

export async function deployContracts(): Promise<{
  btbToken: BTBToken;
  tokenSale: TokenSale;
  vestingNFT: VestingNFT;
}> {
  // Deploy BTB Token
  const BTBToken = await ethers.getContractFactory("BTBToken");
  const btbToken = await BTBToken.deploy();
  await btbToken.waitForDeployment();

  // Deploy TokenSale
  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = await TokenSale.deploy(await btbToken.getAddress());
  await tokenSale.waitForDeployment();

  // Get VestingNFT address
  const vestingNFTAddress = await tokenSale.vestingNFT();
  const VestingNFT = await ethers.getContractFactory("VestingNFT");
  const vestingNFT = VestingNFT.attach(vestingNFTAddress) as VestingNFT;

  return { 
    btbToken: btbToken as unknown as BTBToken, 
    tokenSale: tokenSale as unknown as TokenSale, 
    vestingNFT 
  };
}

export async function setupTokenSale(
  btbToken: BTBToken,
  tokenSale: TokenSale,
  amount: bigint
): Promise<void> {
  const tokenSaleAddress = await tokenSale.getAddress();
  // Approve tokens for sale contract
  await btbToken.approve(tokenSaleAddress, amount);
  // Transfer tokens to sale contract
  await btbToken.transfer(tokenSaleAddress, amount);
}
