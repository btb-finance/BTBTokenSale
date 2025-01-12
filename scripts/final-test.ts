import { ethers } from "hardhat";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";
import {
    createTestWallet,
    logBalances,
    expectRevert,
    logTestResult,
    increaseTime,
    getEventArgs,
    formatTokenAmount
} from "./test-utils";

async function main() {
    const BTB_TOKEN_ADDRESS = "0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c";
    const TOKEN_SALE_ADDRESS = "0x2DE5bedF629994149F3ed4902E6189bfC60444ed";
    const VESTING_NFT_ADDRESS = "0x785A5128EF5eF59A8c53f7f578ce24F374b3497D";

    const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;
    const tokenSale = await ethers.getContractAt("TokenSale", TOKEN_SALE_ADDRESS) as TokenSale;
    const vestingNFT = await ethers.getContractAt("VestingNFT", VESTING_NFT_ADDRESS) as VestingNFT;

    // Constants
    const INSTANT_PRICE = ethers.parseEther("0.000001");
    const VESTING_PRICE = ethers.parseEther("0.0000005");
    const DAY = 24 * 60 * 60;
    const YEAR = 365 * DAY;

    // Create test users with minimal funding
    const [owner] = await ethers.getSigners();
    const buyer = await createTestWallet("0.00001");  // Single test user with minimal funding

    console.log("=== Test Setup ===");
    console.log("Owner:", owner.address);
    console.log("Buyer:", buyer.address);

    try {
        // Test 1: Instant Purchase
        console.log("\n=== Test 1: Instant Purchase ===");
        const tx1 = await tokenSale.connect(buyer).buyTokensInstant({ value: INSTANT_PRICE });
        await tx1.wait();
        const balance1 = await btbToken.balanceOf(buyer.address);
        console.log("Tokens received:", formatTokenAmount(balance1));
        logTestResult("Instant Purchase", balance1 === ethers.parseEther("1"));

        // Test 2: Vesting Purchase
        console.log("\n=== Test 2: Vesting Purchase ===");
        const tx2 = await tokenSale.connect(buyer).buyTokensVesting({ value: VESTING_PRICE });
        await tx2.wait();
        
        // Find NFT ID
        let nftId = 0n;
        while (true) {
            try {
                const owner = await vestingNFT.ownerOf(nftId);
                if (owner.toLowerCase() === buyer.address.toLowerCase()) {
                    break;
                }
                nftId = nftId + 1n;
            } catch {
                nftId = nftId + 1n;
            }
        }
        console.log("NFT ID:", nftId);

        // Check vesting schedule
        const schedule = await vestingNFT.getVestingSchedule(nftId);
        console.log("\nVesting Schedule:");
        console.log("Total Amount:", formatTokenAmount(schedule.totalAmount));
        console.log("Start Time:", new Date(Number(schedule.startTime) * 1000));
        console.log("End Time:", new Date(Number(schedule.endTime) * 1000));
        console.log("Is Active:", schedule.isActive);

        // Test 3: Initial Claim
        console.log("\n=== Test 3: Initial Claim ===");
        const tx3 = await tokenSale.connect(buyer).claimVestedTokens(nftId);
        await tx3.wait();
        const claimed = (await vestingNFT.getVestingSchedule(nftId)).claimedAmount;
        console.log("Claimed amount:", formatTokenAmount(claimed));

        // Final state
        console.log("\n=== Final State ===");
        await logBalances(btbToken, owner.address, buyer.address, TOKEN_SALE_ADDRESS);

    } catch (error: any) {
        console.error("\nTest failed:", error.message);
        if (error.data) {
            try {
                const decodedError = ethers.toUtf8String('0x' + error.data.slice(138));
                console.error("Decoded error:", decodedError);
            } catch (e) {
                console.error("Raw error data:", error.data);
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
