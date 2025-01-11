import { ethers, run } from "hardhat";

async function main() {
    // Get the BTB Token address (you can replace this with your deployed token address)
    const BTB_TOKEN_ADDRESS = "0xdda696FAbB67F70064e86fC340b19C23225b3EAe"; // Using newly deployed token
    
    console.log("Deploying TokenSale contract...");

    // Deploy TokenSale with the token address
    const TokenSale = await ethers.getContractFactory("TokenSale");
    const tokenSale = await TokenSale.deploy(BTB_TOKEN_ADDRESS);
    await tokenSale.waitForDeployment();

    const tokenSaleAddress = await tokenSale.getAddress();
    console.log("TokenSale deployed to:", tokenSaleAddress);

    // Get the VestingNFT address
    const vestingNFTAddress = await tokenSale.vestingNFT();
    console.log("VestingNFT deployed to:", vestingNFTAddress);

    // Wait for a few seconds to ensure the contracts are deployed
    console.log("Waiting for deployments to complete...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify TokenSale
    console.log("\nVerifying TokenSale contract...");
    try {
        await run("verify:verify", {
            address: tokenSaleAddress,
            constructorArguments: [BTB_TOKEN_ADDRESS],
        });
        console.log("TokenSale verified successfully");
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("TokenSale is already verified!");
        } else {
            console.error("Error verifying TokenSale:", error);
        }
    }

    // Verify VestingNFT
    console.log("\nVerifying VestingNFT contract...");
    try {
        await run("verify:verify", {
            address: vestingNFTAddress,
            constructorArguments: [],
        });
        console.log("VestingNFT verified successfully");
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("VestingNFT is already verified!");
        } else {
            console.error("Error verifying VestingNFT:", error);
        }
    }

    return { tokenSaleAddress, vestingNFTAddress };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
