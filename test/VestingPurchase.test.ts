import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";
import { deployContracts, setupTokenSale } from "./helpers";

describe("Vesting Purchase and Claims", function () {
  let btbToken: BTBToken;
  let tokenSale: TokenSale;
  let vestingNFT: VestingNFT;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  const VESTING_PRICE = ethers.parseEther("0.0000005");
  const TOKENS_TO_SELL = ethers.parseEther("1000");
  const ONE_MONTH = 30 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();
    
    // Deploy contracts
    const contracts = await deployContracts();
    btbToken = contracts.btbToken;
    tokenSale = contracts.tokenSale;
    vestingNFT = contracts.vestingNFT;

    // Setup token sale
    await setupTokenSale(btbToken, tokenSale, TOKENS_TO_SELL);
  });

  it("Should create vesting schedule and NFT on purchase", async function () {
    const purchaseAmount = ethers.parseEther("0.00001");
    
    // Buy tokens with vesting
    const tx = await tokenSale.connect(buyer).buyTokensVesting({ value: purchaseAmount });
    const receipt = await tx.wait();
    
    // Find NFT ID from events
    const vestingNFTAddress = await tokenSale.vestingNFT();
    const transferEvent = receipt?.logs.find(
      log => log.address.toLowerCase() === vestingNFTAddress.toLowerCase() && 
             log.topics[0] === ethers.id("Transfer(address,address,uint256)")
    );
    const tokenId = BigInt(transferEvent?.topics[3] || "0");

    // Check NFT ownership
    expect(await vestingNFT.ownerOf(tokenId)).to.equal(buyer.address);

    // Check vesting schedule
    const schedule = await vestingNFT.getVestingSchedule(tokenId);
    expect(schedule.isActive).to.be.true;
    expect(schedule.totalAmount).to.equal((purchaseAmount * ethers.parseEther("1")) / VESTING_PRICE);
  });

  it("Should allow claiming vested tokens over time", async function () {
    const purchaseAmount = ethers.parseEther("0.00001");
    
    // Buy tokens with vesting
    const tx = await tokenSale.connect(buyer).buyTokensVesting({ value: purchaseAmount });
    const receipt = await tx.wait();
    
    // Get NFT ID
    const vestingNFTAddress = await tokenSale.vestingNFT();
    const transferEvent = receipt?.logs.find(
      log => log.address.toLowerCase() === vestingNFTAddress.toLowerCase() && 
             log.topics[0] === ethers.id("Transfer(address,address,uint256)")
    );
    const tokenId = BigInt(transferEvent?.topics[3] || "0");

    // Move time forward 1 month
    await time.increase(ONE_MONTH);

    // Claim tokens
    const initialBalance = await btbToken.balanceOf(buyer.address);
    await tokenSale.connect(buyer).claimVestedTokens(tokenId);
    const finalBalance = await btbToken.balanceOf(buyer.address);

    // Should have received some tokens but not all
    expect(finalBalance > initialBalance).to.be.true;
    
    const schedule = await vestingNFT.getVestingSchedule(tokenId);
    expect(schedule.claimedAmount > 0n).to.be.true;
  });

  it("Should vest full amount after 12 months", async function () {
    const purchaseAmount = ethers.parseEther("0.00001");
    
    // Buy tokens with vesting
    const tx = await tokenSale.connect(buyer).buyTokensVesting({ value: purchaseAmount });
    const receipt = await tx.wait();
    
    // Get NFT ID
    const vestingNFTAddress = await tokenSale.vestingNFT();
    const transferEvent = receipt?.logs.find(
      log => log.address.toLowerCase() === vestingNFTAddress.toLowerCase() && 
             log.topics[0] === ethers.id("Transfer(address,address,uint256)")
    );
    const tokenId = BigInt(transferEvent?.topics[3] || "0");

    // Move time forward 12 months
    await time.increase(365 * 24 * 60 * 60);

    // Claim tokens
    const initialBalance = await btbToken.balanceOf(buyer.address);
    await tokenSale.connect(buyer).claimVestedTokens(tokenId);
    const finalBalance = await btbToken.balanceOf(buyer.address);

    // Should have received all tokens
    const schedule = await vestingNFT.getVestingSchedule(tokenId);
    expect(finalBalance - initialBalance).to.equal(schedule.totalAmount);
  });
});
