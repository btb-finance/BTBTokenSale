import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";
import { deployContracts, setupTokenSale } from "./helpers";

describe("Admin Functions", function () {
  let btbToken: BTBToken;
  let tokenSale: TokenSale;
  let vestingNFT: VestingNFT;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  const TOKENS_TO_SELL = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, buyer, nonOwner] = await ethers.getSigners();
    
    // Deploy contracts
    const contracts = await deployContracts();
    btbToken = contracts.btbToken;
    tokenSale = contracts.tokenSale;
    vestingNFT = contracts.vestingNFT;

    // Setup token sale
    await setupTokenSale(btbToken, tokenSale, TOKENS_TO_SELL);
  });

  describe("ETH Withdrawal", function () {
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

    it("Should prevent non-owner from withdrawing ETH", async function () {
      await tokenSale.connect(buyer).buyTokensInstant({ value: ethers.parseEther("0.00001") });
      await expect(
        tokenSale.connect(nonOwner).withdrawEth()
      ).to.be.revertedWithCustomError(tokenSale, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token Withdrawal", function () {
    it("Should allow owner to withdraw specific amount of tokens", async function () {
      const withdrawAmount = ethers.parseEther("100");
      const initialBalance = await btbToken.balanceOf(owner.address);
      
      await tokenSale.connect(owner).withdrawTokens(withdrawAmount);
      
      const finalBalance = await btbToken.balanceOf(owner.address);
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);
    });

    it("Should allow owner to withdraw all tokens", async function () {
      const tokenSaleAddress = await tokenSale.getAddress();
      const initialContractBalance = await btbToken.balanceOf(tokenSaleAddress);
      const initialOwnerBalance = await btbToken.balanceOf(owner.address);
      
      await tokenSale.connect(owner).withdrawAllTokens();
      
      const finalContractBalance = await btbToken.balanceOf(tokenSaleAddress);
      const finalOwnerBalance = await btbToken.balanceOf(owner.address);
      
      expect(finalContractBalance).to.equal(0n);
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(initialContractBalance);
    });

    it("Should prevent non-owner from withdrawing tokens", async function () {
      await expect(
        tokenSale.connect(nonOwner).withdrawTokens(ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(tokenSale, "OwnableUnauthorizedAccount");

      await expect(
        tokenSale.connect(nonOwner).withdrawAllTokens()
      ).to.be.revertedWithCustomError(tokenSale, "OwnableUnauthorizedAccount");
    });

    it("Should fail when trying to withdraw more tokens than available", async function () {
      const tooMuch = TOKENS_TO_SELL + ethers.parseEther("1");
      await expect(
        tokenSale.connect(owner).withdrawTokens(tooMuch)
      ).to.be.revertedWith("Insufficient token balance");
    });
  });
});
