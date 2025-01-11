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

    // Get signer
    const [owner] = await ethers.getSigners();
    console.log("Using address:", owner.address);

    // Initial balances
    const initialTokenBalance = await btbToken.balanceOf(owner.address);
    const initialEthBalance = await ethers.provider.getBalance(owner.address);
    console.log("\nInitial Balances:");
    console.log("BTB Token:", ethers.formatEther(initialTokenBalance));
    console.log("ETH:", ethers.formatEther(initialEthBalance));

    // 1. Buy 10 tokens instantly
    console.log("\n1. Buying 10 tokens instantly...");
    const instantTokens = ethers.parseEther("10");
    const instantPrice = ethers.parseEther("0.000001");
    const instantCost = (instantTokens * instantPrice) / ethers.parseEther("1");
    
    const buyInstantTx = await tokenSale.buyTokensInstant({ value: instantCost });
    await buyInstantTx.wait();
    console.log("Instant purchase complete");

    // Check balance after instant purchase
    const afterInstantBalance = await btbToken.balanceOf(owner.address);
    console.log("Balance after instant purchase:", ethers.formatEther(afterInstantBalance));

    // 2. Buy 10 tokens with vesting
    console.log("\n2. Buying 10 tokens with vesting...");
    const vestingTokens = ethers.parseEther("10");
    const vestingPrice = ethers.parseEther("0.0000005");
    const vestingCost = (vestingTokens * vestingPrice) / ethers.parseEther("1");
    
    const buyVestingTx = await tokenSale.buyTokensVesting({ value: vestingCost });
    const vestingReceipt = await buyVestingTx.wait();

    // Get NFT ID from events
    const transferEvent = vestingReceipt?.logs.find(
        log => log.address.toLowerCase() === VESTING_NFT_ADDRESS.toLowerCase() && 
               log.topics[0] === ethers.id("Transfer(address,address,uint256)")
    );
    const tokenId = BigInt(transferEvent?.topics[3] || "0");
    console.log("Vesting NFT created with ID:", tokenId.toString());

    // 3. Get vesting schedule and metadata
    console.log("\n3. Checking vesting schedule and metadata...");
    const schedule = await vestingNFT.getVestingSchedule(tokenId);
    console.log("Vesting Schedule:");
    console.log("- Total Amount:", ethers.formatEther(schedule.totalAmount), "BTB");
    console.log("- Start Time:", new Date(Number(schedule.startTime) * 1000).toISOString());
    console.log("- End Time:", new Date(Number(schedule.endTime) * 1000).toISOString());
    console.log("- Claimed Amount:", ethers.formatEther(schedule.claimedAmount), "BTB");
    console.log("- Is Active:", schedule.isActive);

    // Get NFT metadata
    const tokenURI = await vestingNFT.tokenURI(tokenId);
    console.log("\nNFT Metadata URI:", tokenURI);
    const metadata = JSON.parse(Buffer.from(tokenURI.split(',')[1], 'base64').toString());
    console.log("NFT Metadata:", metadata);

    // 4. Try to claim vested tokens
    console.log("\n4. Attempting to claim vested tokens...");
    try {
        const claimTx = await tokenSale.claimVestedTokens(tokenId);
        await claimTx.wait();
        console.log("Tokens claimed successfully");

        // Check claimed amount
        const updatedSchedule = await vestingNFT.getVestingSchedule(tokenId);
        console.log("Claimed amount:", ethers.formatEther(updatedSchedule.claimedAmount), "BTB");
    } catch (error) {
        console.log("Claim failed - tokens might still be vesting:", error.message);
    }

    // Final balances
    const finalTokenBalance = await btbToken.balanceOf(owner.address);
    const finalEthBalance = await ethers.provider.getBalance(owner.address);
    console.log("\nFinal Balances:");
    console.log("BTB Token:", ethers.formatEther(finalTokenBalance));
    console.log("ETH:", ethers.formatEther(finalEthBalance));
    console.log("Token Balance Change:", ethers.formatEther(finalTokenBalance - initialTokenBalance));
    console.log("ETH Spent:", ethers.formatEther(initialEthBalance - finalEthBalance));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
