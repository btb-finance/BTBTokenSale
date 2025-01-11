import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy BTB Token
  console.log("Deploying BTB Token...");
  const BTBToken = await ethers.getContractFactory("BTBToken");
  const btbToken = await BTBToken.deploy();
  await btbToken.waitForDeployment();
  console.log("BTB Token deployed to:", await btbToken.getAddress());

  // Verify BTB Token
  console.log("Verifying BTB Token...");
  try {
    await run("verify:verify", {
      address: await btbToken.getAddress(),
      constructorArguments: []
    });
    console.log("BTB Token verified successfully");
  } catch (error) {
    console.error("Error verifying BTB Token:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
