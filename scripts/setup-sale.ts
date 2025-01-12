import { ethers } from "hardhat";
import { BTBToken } from "../types/contracts";

async function main() {
    const BTB_TOKEN_ADDRESS = "0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c";
    const TOKEN_SALE_ADDRESS = "0x2DE5bedF629994149F3ed4902E6189bfC60444ed";
    
    // Get contract instance
    const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Setting up sale with address:", signer.address);
    
    // Check balances before transfer
    const ownerBalance = await btbToken.balanceOf(signer.address);
    console.log("\nInitial balances:");
    console.log("Owner BTB Balance:", ethers.formatEther(ownerBalance));
    
    // Transfer tokens to sale contract (100,000 BTB)
    const transferAmount = ethers.parseEther("100000");
    console.log("\nTransferring", ethers.formatEther(transferAmount), "BTB to sale contract...");
    const tx = await btbToken.transfer(TOKEN_SALE_ADDRESS, transferAmount);
    await tx.wait();
    
    // Check final balances
    const finalOwnerBalance = await btbToken.balanceOf(signer.address);
    const saleBalance = await btbToken.balanceOf(TOKEN_SALE_ADDRESS);
    console.log("\nFinal balances:");
    console.log("Owner BTB Balance:", ethers.formatEther(finalOwnerBalance));
    console.log("Sale Contract BTB Balance:", ethers.formatEther(saleBalance));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
