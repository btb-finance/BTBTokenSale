import { ethers, run } from "hardhat";

async function verifyContract(address: string, constructorArguments: any[] = []) {
  console.log(`Verifying contract at ${address}...`);
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments
    });
    console.log("Contract verified successfully");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract already verified");
    } else {
      console.error("Error verifying contract:", error);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy BTB Token
  console.log("\nDeploying BTB Token...");
  const BTBToken = await ethers.getContractFactory("BTBToken");
  const btbToken = await BTBToken.deploy();
  await btbToken.waitForDeployment();
  const btbTokenAddress = await btbToken.getAddress();
  console.log("BTB Token deployed to:", btbTokenAddress);

  // Deploy TokenSale (which will also deploy VestingNFT)
  console.log("\nDeploying TokenSale...");
  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = await TokenSale.deploy(btbTokenAddress);
  await tokenSale.waitForDeployment();
  const tokenSaleAddress = await tokenSale.getAddress();
  console.log("TokenSale deployed to:", tokenSaleAddress);

  // Get VestingNFT address
  const vestingNFTAddress = await tokenSale.vestingNFT();
  console.log("VestingNFT deployed to:", vestingNFTAddress);

  // Wait a bit before verification
  console.log("\nWaiting 30 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Verify all contracts
  await verifyContract(btbTokenAddress);
  await verifyContract(tokenSaleAddress, [btbTokenAddress]);
  await verifyContract(vestingNFTAddress);

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("BTB Token:", btbTokenAddress);
  console.log("TokenSale:", tokenSaleAddress);
  console.log("VestingNFT:", vestingNFTAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
