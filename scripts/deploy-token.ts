import { ethers, run } from "hardhat";

async function main() {
    console.log("Deploying BTB Token...");

    // Deploy BTB Token
    const BTBToken = await ethers.getContractFactory("BTBToken");
    const token = await BTBToken.deploy();
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    console.log("BTB Token deployed to:", tokenAddress);

    // Wait for a few seconds to ensure the contract is deployed
    console.log("Waiting for deployment to complete...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify the contract
    console.log("Verifying contract on Etherscan...");
    try {
        await run("verify:verify", {
            address: tokenAddress,
            constructorArguments: [],
        });
        console.log("Contract verified successfully");
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Contract is already verified!");
        } else {
            console.error("Error verifying contract:", error);
        }
    }

    return tokenAddress;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
