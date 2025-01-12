import { ethers } from "hardhat";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";

async function main() {
    // Contract addresses on Optimism Sepolia
    const BTB_TOKEN_ADDRESS = "0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c";
    const TOKEN_SALE_ADDRESS = "0x2DE5bedF629994149F3ed4902E6189bfC60444ed";
    const VESTING_NFT_ADDRESS = "0x785A5128EF5eF59A8c53f7f578ce24F374b3497D";

    // Get contract instances
    const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;
    const tokenSale = await ethers.getContractAt("TokenSale", TOKEN_SALE_ADDRESS) as TokenSale;
    const vestingNFT = await ethers.getContractAt("VestingNFT", VESTING_NFT_ADDRESS) as VestingNFT;

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Testing with address:", signer.address);

    // Test 1: Check contract connections
    console.log("\nTest 1: Checking contract connections...");
    const tokenName = await btbToken.name();
    const tokenSymbol = await btbToken.symbol();
    console.log("BTB Token Name:", tokenName);
    console.log("BTB Token Symbol:", tokenSymbol);

    // Test 2: Check prices
    console.log("\nTest 2: Checking token prices...");
    const instantPrice = await tokenSale.INSTANT_PRICE();
    const vestingPrice = await tokenSale.VESTING_PRICE();
    console.log("Instant Purchase Price:", ethers.formatEther(instantPrice), "ETH");
    console.log("Vesting Purchase Price:", ethers.formatEther(vestingPrice), "ETH");

    // Test 3: Check VestingNFT setup
    console.log("\nTest 3: Checking VestingNFT setup...");
    const nftName = await vestingNFT.name();
    const tokenSaleAddress = await vestingNFT.tokenSaleContract();
    console.log("NFT Collection Name:", nftName);
    console.log("TokenSale Contract set in VestingNFT:", tokenSaleAddress);
    console.log("Matches TokenSale address:", tokenSaleAddress.toLowerCase() === TOKEN_SALE_ADDRESS.toLowerCase());

    // Test 4: Check token balances
    console.log("\nTest 4: Checking token balances...");
    const userBalance = await btbToken.balanceOf(signer.address);
    const saleBalance = await btbToken.balanceOf(TOKEN_SALE_ADDRESS);
    console.log("User BTB Balance:", ethers.formatEther(userBalance));
    console.log("Sale Contract BTB Balance:", ethers.formatEther(saleBalance));

    // Test 5: Try to manipulate claimed amount (should fail)
    console.log("\nTest 5: Testing security - trying to manipulate claimed amount...");
    try {
        await vestingNFT.updateClaimedAmount(0, ethers.parseEther("1"));
        console.log("❌ Security test failed - was able to manipulate claimed amount");
    } catch (error: any) {
        console.log("✅ Security test passed - cannot manipulate claimed amount");
        console.log("Error message:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
