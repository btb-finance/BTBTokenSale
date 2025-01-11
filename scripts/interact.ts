import { ethers } from "hardhat";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";

async function main() {
  // Contract addresses on Optimism Sepolia
  const BTB_TOKEN_ADDRESS = "0x4929858D64af3C7a626cE1C4cc3b546b03240247";
  const TOKEN_SALE_ADDRESS = "0x06FEED5b0833F579940400D238c595746AE97F78";
  const VESTING_NFT_ADDRESS = "0xD75e04ABf08d1aCf6b583865c6d5d1b7cF29cC51";

  // Get contract instances
  const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;
  const tokenSale = await ethers.getContractAt("TokenSale", TOKEN_SALE_ADDRESS) as TokenSale;
  const vestingNFT = await ethers.getContractAt("VestingNFT", VESTING_NFT_ADDRESS) as VestingNFT;

  // Get signers
  const [owner] = await ethers.getSigners();
  console.log("Interacting with contracts using address:", owner.address);

  // Check balances
  const tokenBalance = await btbToken.balanceOf(owner.address);
  const ethBalance = await ethers.provider.getBalance(owner.address);
  console.log("BTB Token Balance:", ethers.formatEther(tokenBalance));
  console.log("ETH Balance:", ethers.formatEther(ethBalance));

  // Approve tokens for sale
  const tokensToSell = ethers.parseEther("1000");
  console.log("Approving tokens for sale...");
  const approveTx = await btbToken.approve(TOKEN_SALE_ADDRESS, tokensToSell);
  await approveTx.wait();
  console.log("Tokens approved");

  // Transfer tokens to sale contract
  console.log("Transferring tokens to sale contract...");
  const transferTx = await btbToken.transfer(TOKEN_SALE_ADDRESS, tokensToSell);
  await transferTx.wait();
  console.log("Tokens transferred");

  // Buy tokens instantly
  const purchaseAmount = ethers.parseEther("0.00001");
  console.log("Buying tokens instantly...");
  const buyTx = await tokenSale.buyTokensInstant({ value: purchaseAmount });
  await buyTx.wait();
  console.log("Tokens purchased instantly");

  // Buy tokens with vesting
  console.log("Buying tokens with vesting...");
  const vestingTx = await tokenSale.buyTokensVesting({ value: purchaseAmount });
  const receipt = await vestingTx.wait();

  // Find NFT ID from events
  const transferEvent = receipt?.logs.find(
    log => log.address.toLowerCase() === VESTING_NFT_ADDRESS.toLowerCase() && 
           log.topics[0] === ethers.id("Transfer(address,address,uint256)")
  );
  const tokenId = BigInt(transferEvent?.topics[3] || "0");
  console.log("Vesting NFT created with ID:", tokenId.toString());

  // Get vesting schedule
  const schedule = await vestingNFT.getVestingSchedule(tokenId);
  console.log("Vesting Schedule:", {
    totalAmount: ethers.formatEther(schedule.totalAmount),
    startTime: new Date(Number(schedule.startTime) * 1000).toISOString(),
    endTime: new Date(Number(schedule.endTime) * 1000).toISOString(),
    claimedAmount: ethers.formatEther(schedule.claimedAmount),
    isActive: schedule.isActive
  });

  // Try to claim vested tokens
  console.log("Claiming vested tokens...");
  const claimTx = await tokenSale.claimVestedTokens(tokenId);
  await claimTx.wait();
  console.log("Tokens claimed");

  // Final balances
  const finalTokenBalance = await btbToken.balanceOf(owner.address);
  const finalEthBalance = await ethers.provider.getBalance(owner.address);
  console.log("Final BTB Token Balance:", ethers.formatEther(finalTokenBalance));
  console.log("Final ETH Balance:", ethers.formatEther(finalEthBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
