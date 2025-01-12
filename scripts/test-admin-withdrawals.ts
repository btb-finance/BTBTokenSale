import { ethers } from "hardhat";
import { BTBToken, TokenSale } from "../types/contracts";

async function main() {
    // Contract addresses
    const BTB_TOKEN_ADDRESS = "0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c";
    const TOKEN_SALE_ADDRESS = "0x2DE5bedF629994149F3ed4902E6189bfC60444ed";

    // Get contract instances
    const btbToken = await ethers.getContractAt("BTBToken", BTB_TOKEN_ADDRESS) as BTBToken;
    const tokenSale = await ethers.getContractAt("TokenSale", TOKEN_SALE_ADDRESS) as TokenSale;

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Testing admin withdrawals with address:", signer.address);

    // Initial balances
    const initialEthBalance = await ethers.provider.getBalance(signer.address);
    const initialTokenBalance = await btbToken.balanceOf(signer.address);
    const contractEthBalance = await ethers.provider.getBalance(TOKEN_SALE_ADDRESS);
    const contractTokenBalance = await btbToken.balanceOf(TOKEN_SALE_ADDRESS);

    console.log("\nInitial Balances:");
    console.log("Admin ETH Balance:", ethers.formatEther(initialEthBalance));
    console.log("Admin BTB Balance:", ethers.formatEther(initialTokenBalance));
    console.log("Contract ETH Balance:", ethers.formatEther(contractEthBalance));
    console.log("Contract BTB Balance:", ethers.formatEther(contractTokenBalance));

    try {
        // Test 1: Withdraw ETH
        console.log("\nTest 1: Withdrawing ETH...");
        if (contractEthBalance > 0n) {
            const withdrawEthTx = await tokenSale.withdrawETH();
            await withdrawEthTx.wait();
            console.log("ETH withdrawal successful!");
        } else {
            console.log("No ETH available to withdraw");
        }

        // Test 2: Withdraw Tokens
        console.log("\nTest 2: Withdrawing Tokens...");
        if (contractTokenBalance > 0n) {
            // Withdraw half of the available tokens
            const withdrawAmount = contractTokenBalance / 2n;
            const withdrawTokensTx = await tokenSale.withdrawTokens(withdrawAmount);
            await withdrawTokensTx.wait();
            console.log("Token withdrawal successful!");
            console.log("Withdrawn amount:", ethers.formatEther(withdrawAmount), "BTB");
        } else {
            console.log("No tokens available to withdraw");
        }

        // Final balances
        const finalEthBalance = await ethers.provider.getBalance(signer.address);
        const finalTokenBalance = await btbToken.balanceOf(signer.address);
        const finalContractEthBalance = await ethers.provider.getBalance(TOKEN_SALE_ADDRESS);
        const finalContractTokenBalance = await btbToken.balanceOf(TOKEN_SALE_ADDRESS);

        console.log("\nFinal Balances:");
        console.log("Admin ETH Balance:", ethers.formatEther(finalEthBalance));
        console.log("Admin BTB Balance:", ethers.formatEther(finalTokenBalance));
        console.log("Contract ETH Balance:", ethers.formatEther(finalContractEthBalance));
        console.log("Contract BTB Balance:", ethers.formatEther(finalContractTokenBalance));

        console.log("\nChanges:");
        console.log("ETH Change:", ethers.formatEther(finalEthBalance - initialEthBalance));
        console.log("BTB Change:", ethers.formatEther(finalTokenBalance - initialTokenBalance));

    } catch (error: any) {
        console.error("\nError:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
        // Try to get revert reason
        if (error.message.includes("reverted") && error.data) {
            try {
                const decodedError = ethers.toUtf8String('0x' + error.data.slice(138));
                console.error("Revert reason:", decodedError);
            } catch (e) {
                console.error("Could not decode error data");
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
