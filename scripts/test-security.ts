import { ethers } from "hardhat";
import { BTBToken, TokenSale, VestingNFT } from "../types/contracts";

async function main() {
    const BTB_TOKEN_ADDRESS = "0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c";
    const TOKEN_SALE_ADDRESS = "0x2DE5bedF629994149F3ed4902E6189bfC60444ed";
    const VESTING_NFT_ADDRESS = "0x785A5128EF5eF59A8c53f7f578ce24F374b3497D";

    const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;
    const tokenSale = await ethers.getContractAt("TokenSale", TOKEN_SALE_ADDRESS) as TokenSale;
    const vestingNFT = await ethers.getContractAt("VestingNFT", VESTING_NFT_ADDRESS) as VestingNFT;

    // Get signers for testing
    const [owner] = await ethers.getSigners();
    const attackerWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    
    // Fund attacker wallet with some ETH for gas
    await owner.sendTransaction({
        to: attackerWallet.address,
        value: ethers.parseEther("0.01")
    });

    console.log("Testing with addresses:");
    console.log("Owner:", owner.address);
    console.log("Attacker:", attackerWallet.address);

    try {
        console.log("\n=== EXPLOIT TEST 1: Direct Token Transfer Attack ===");
        console.log("Attempting to send tokens directly to contract and bypass payment...");
        
        const amount = ethers.parseEther("1000");
        await btbToken.connect(owner).transfer(TOKEN_SALE_ADDRESS, amount);
        console.log("Sent", ethers.formatEther(amount), "tokens directly to contract");
        
        const contractBalance = await btbToken.balanceOf(TOKEN_SALE_ADDRESS);
        console.log("Contract token balance:", ethers.formatEther(contractBalance));

        console.log("\n=== EXPLOIT TEST 2: Price Manipulation ===");
        console.log("Testing different ETH amounts for price consistency...");
        
        const amounts = [
            ethers.parseEther("0.0000001"),  // Too little
            ethers.parseEther("0.000001"),   // Correct amount
            ethers.parseEther("0.00001")     // Too much
        ];

        for (const amount of amounts) {
            try {
                console.log(`\nTesting instant purchase with ${ethers.formatEther(amount)} ETH`);
                const tx = await tokenSale.connect(attackerWallet).buyTokensInstant({ value: amount });
                await tx.wait();
                const balance = await btbToken.balanceOf(attackerWallet.address);
                console.log("Attacker received:", ethers.formatEther(balance), "BTB");
            } catch (error: any) {
                console.log("Transaction reverted as expected:", error.message.slice(0, 100));
            }
        }

        console.log("\n=== EXPLOIT TEST 3: Multiple Claims Attack ===");
        console.log("Attempting to claim vested tokens multiple times...");

        // First, create a vesting schedule
        const vestingPurchaseTx = await tokenSale.connect(attackerWallet).buyTokensVesting({ 
            value: ethers.parseEther("0.0000005") 
        });
        await vestingPurchaseTx.wait();

        // Get NFT ID (assuming it's 1 for this test)
        const nftId = 1n;
        
        // Try to claim multiple times
        for (let i = 0; i < 3; i++) {
            try {
                console.log(`\nClaim attempt ${i + 1}:`);
                const tx = await tokenSale.connect(attackerWallet).claimVestedTokens(nftId);
                await tx.wait();
                
                const schedule = await vestingNFT.getVestingSchedule(nftId);
                console.log("Total Amount:", ethers.formatEther(schedule.totalAmount));
                console.log("Claimed Amount:", ethers.formatEther(schedule.claimedAmount));
            } catch (error: any) {
                console.log("Claim failed:", error.message.slice(0, 100));
            }
        }

        console.log("\n=== EXPLOIT TEST 4: Post-Vesting Claims ===");
        console.log("Testing claims after vesting period ends...");

        // Try to claim after vesting ends (note: this won't actually wait a year)
        const schedule = await vestingNFT.getVestingSchedule(nftId);
        console.log("Vesting End Time:", new Date(Number(schedule.endTime) * 1000));
        console.log("Current Time:", new Date());
        
        try {
            const tx = await tokenSale.connect(attackerWallet).claimVestedTokens(nftId);
            await tx.wait();
            const finalSchedule = await vestingNFT.getVestingSchedule(nftId);
            console.log("Final Claimed Amount:", ethers.formatEther(finalSchedule.claimedAmount));
        } catch (error: any) {
            console.log("Post-vesting claim result:", error.message.slice(0, 100));
        }

        console.log("\n=== EXPLOIT TEST 5: Direct NFT Manipulation ===");
        console.log("Attempting to manipulate vesting schedule directly...");

        try {
            // @ts-ignore - We're intentionally trying to call a protected function
            const tx = await vestingNFT.connect(attackerWallet).updateClaimedAmount(nftId, ethers.parseEther("1000"));
            await tx.wait();
        } catch (error: any) {
            console.log("Direct manipulation prevented:", error.message.slice(0, 100));
        }

        // Final balance check
        const attackerBalance = await btbToken.balanceOf(attackerWallet.address);
        console.log("\nFinal attacker balance:", ethers.formatEther(attackerBalance), "BTB");

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
