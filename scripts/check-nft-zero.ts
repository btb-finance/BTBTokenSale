import { ethers } from "hardhat";
import { VestingNFT } from "../types/contracts";

async function main() {
    // Contract address on Optimism Sepolia
    const VESTING_NFT_ADDRESS = "0xD75e04ABf08d1aCf6b583865c6d5d1b7cF29cC51";

    // Get contract instance
    const vestingNFT = await ethers.getContractAt("VestingNFT", VESTING_NFT_ADDRESS) as VestingNFT;

    // Get signer
    const [owner] = await ethers.getSigners();
    console.log("Using address:", owner.address);

    try {
        // Get NFT owner
        const nftOwner = await vestingNFT.ownerOf(0);
        console.log("\nNFT #0 Owner:", nftOwner);

        // Get vesting schedule
        const schedule = await vestingNFT.getVestingSchedule(0);
        console.log("\nVesting Schedule for NFT #0:");
        console.log("- Total Amount:", ethers.formatEther(schedule.totalAmount), "BTB");
        console.log("- Start Time:", new Date(Number(schedule.startTime) * 1000).toISOString());
        console.log("- End Time:", new Date(Number(schedule.endTime) * 1000).toISOString());
        console.log("- Claimed Amount:", ethers.formatEther(schedule.claimedAmount), "BTB");
        console.log("- Is Active:", schedule.isActive);

        // Calculate vesting duration and elapsed time
        const startTime = Number(schedule.startTime);
        const endTime = Number(schedule.endTime);
        const currentTime = Math.floor(Date.now() / 1000);
        const vestingDuration = endTime - startTime;
        const elapsedTime = currentTime - startTime;
        
        // Calculate vested amount
        const totalAmount = schedule.totalAmount;
        let vestedAmount = BigInt(0);
        
        if (currentTime >= endTime) {
            vestedAmount = totalAmount;
        } else if (currentTime > startTime) {
            vestedAmount = (totalAmount * BigInt(elapsedTime)) / BigInt(vestingDuration);
        }
        
        const claimableAmount = vestedAmount - schedule.claimedAmount;
        
        console.log("\nVesting Progress:");
        console.log("- Time Elapsed:", Math.floor(elapsedTime / (24 * 60 * 60)), "days");
        console.log("- Total Duration:", Math.floor(vestingDuration / (24 * 60 * 60)), "days");
        console.log("- Vested Amount:", ethers.formatEther(vestedAmount), "BTB");
        console.log("- Claimable Amount:", ethers.formatEther(claimableAmount), "BTB");

        // Get NFT metadata
        const tokenURI = await vestingNFT.tokenURI(0);
        console.log("\nNFT Metadata URI:", tokenURI);
        const metadata = JSON.parse(Buffer.from(tokenURI.split(',')[1], 'base64').toString());
        console.log("NFT Metadata:", metadata);

    } catch (error) {
        console.log("Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
