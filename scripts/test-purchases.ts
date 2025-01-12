import { ethers } from "hardhat";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";

async function main() {
    // Contract addresses
    const BTB_TOKEN_ADDRESS = "0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c";
    const TOKEN_SALE_ADDRESS = "0x2DE5bedF629994149F3ed4902E6189bfC60444ed";
    const VESTING_NFT_ADDRESS = "0x785A5128EF5eF59A8c53f7f578ce24F374b3497D";

    // Get contract instances
    const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;
    const tokenSale = await ethers.getContractAt("TokenSale", TOKEN_SALE_ADDRESS) as TokenSale;
    const vestingNFT = await ethers.getContractAt("VestingNFT", VESTING_NFT_ADDRESS) as VestingNFT;

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Testing purchases with address:", signer.address);

    // Initial balance check
    const initialBalance = await btbToken.balanceOf(signer.address);
    console.log("\nInitial BTB Balance:", ethers.formatEther(initialBalance));

    try {
        // Test 1: Instant Purchase
        console.log("\nTest 1: Making instant purchase...");
        const instantTx = await tokenSale.buyTokensInstant({ 
            value: ethers.parseEther("0.000001") 
        });
        await instantTx.wait();
        console.log("Instant purchase successful!");

        const balanceAfterInstant = await btbToken.balanceOf(signer.address);
        console.log("BTB Balance after instant purchase:", ethers.formatEther(balanceAfterInstant));
        console.log("Tokens received:", ethers.formatEther(balanceAfterInstant - initialBalance));

        // Test 2: Vesting Purchase
        console.log("\nTest 2: Making vesting purchase...");
        const vestingTx = await tokenSale.buyTokensVesting({ 
            value: ethers.parseEther("0.0000005") 
        });
        const receipt = await vestingTx.wait();
        console.log("Vesting purchase successful!");

        // Let's try NFT ID 0 (first NFT)
        const nftId = 0n;
        console.log("Testing with NFT ID:", nftId);

        // Check vesting schedule
        const schedule = await vestingNFT.getVestingSchedule(nftId);
        console.log("\nVesting Schedule:");
        console.log("Total Amount:", ethers.formatEther(schedule.totalAmount));
        console.log("Start Time:", new Date(Number(schedule.startTime) * 1000).toISOString());
        console.log("End Time:", new Date(Number(schedule.endTime) * 1000).toISOString());
        console.log("Claimed Amount:", ethers.formatEther(schedule.claimedAmount));
        console.log("Is Active:", schedule.isActive);

        // Test 3: Claim Vested Tokens
        console.log("\nTest 3: Claiming vested tokens...");
        const claimTx = await tokenSale.claimVestedTokens(nftId);
        await claimTx.wait();
        console.log("Claim successful!");

        const finalBalance = await btbToken.balanceOf(signer.address);
        console.log("\nFinal BTB Balance:", ethers.formatEther(finalBalance));
        console.log("Total tokens received:", ethers.formatEther(finalBalance - initialBalance));

    } catch (error: any) {
        console.error("Error:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
