import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";
import { deployContracts, setupTokenSale } from "./helpers";

describe("Instant Token Purchase", function () {
  let btbToken: BTBToken;
  let tokenSale: TokenSale;
  let vestingNFT: VestingNFT;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  const INSTANT_PRICE = ethers.parseEther("0.000001");
  const TOKENS_TO_SELL = ethers.parseEther("1000");

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

  it("Should allow instant purchase of tokens", async function () {
    const purchaseAmount = ethers.parseEther("0.00001"); // 10x the price
    const expectedTokens = (purchaseAmount * ethers.parseEther("1")) / INSTANT_PRICE;

    const initialBalance = await btbToken.balanceOf(buyer.address);

    // Buy tokens
    await tokenSale.connect(buyer).buyTokensInstant({ value: purchaseAmount });

    const finalBalance = await btbToken.balanceOf(buyer.address);
    expect(finalBalance - initialBalance).to.equal(expectedTokens);
  });

  it("Should fail if payment is insufficient", async function () {
    const insufficientAmount = INSTANT_PRICE / 2n;
    await expect(
      tokenSale.connect(buyer).buyTokensInstant({ value: insufficientAmount })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("Should allow owner to withdraw ETH", async function () {
    const purchaseAmount = ethers.parseEther("0.00001");
    await tokenSale.connect(buyer).buyTokensInstant({ value: purchaseAmount });

    const tokenSaleAddress = await tokenSale.getAddress();
    const contractBalance = await ethers.provider.getBalance(tokenSaleAddress);
    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
    
    const tx = await tokenSale.connect(owner).withdrawEth();
    const receipt = await tx.wait();
    const gasCost = receipt?.gasUsed * receipt?.gasPrice;
    
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
    
    // Owner should receive contract balance minus gas costs
    expect(finalOwnerBalance + gasCost - initialOwnerBalance).to.equal(contractBalance);
  });
});
