import { ethers } from "hardhat";
import { TokenSale, BTBToken } from "../types/contracts";

async function main() {
    // Contract addresses on Optimism Sepolia
    const TOKEN_SALE_ADDRESS = "0x06FEED5b0833F579940400D238c595746AE97F78";
    const BTB_TOKEN_ADDRESS = "0x4929858D64af3C7a626cE1C4cc3b546b03240247";

    // Get contract instances
    const tokenSale = await ethers.getContractAt("TokenSale", TOKEN_SALE_ADDRESS) as TokenSale;
    const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;

    // Get signer
    const [owner] = await ethers.getSigners();
    console.log("Using address:", owner.address);

    // Get initial balance
    const initialBalance = await btbToken.balanceOf(owner.address);
    console.log("\nInitial BTB Balance:", ethers.formatEther(initialBalance));

    try {
        // Claim vested tokens from NFT #0
        console.log("\nAttempting to claim vested tokens from NFT #0...");
        const claimTx = await tokenSale.claimVestedTokens(0);
        const receipt = await claimTx.wait();
        
        if (receipt && receipt.status === 1) {
            console.log("Claim transaction successful!");
            console.log("Transaction hash:", receipt.hash);
            
            // Get new balance
            const newBalance = await btbToken.balanceOf(owner.address);
            console.log("\nNew BTB Balance:", ethers.formatEther(newBalance));
            console.log("Claimed Amount:", ethers.formatEther(newBalance - initialBalance), "BTB");
        }
    } catch (error) {
        console.log("Error claiming tokens:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
