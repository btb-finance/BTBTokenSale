import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get BTB Token address
  const BTB_TOKEN_ADDRESS = "0x4929858D64af3C7a626cE1C4cc3b546b03240247";
  console.log("Using BTB Token at:", BTB_TOKEN_ADDRESS);

  // Deploy TokenSale
  console.log("Deploying TokenSale contract...");
  console.log("Waiting for deployment transaction...");
  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = await TokenSale.deploy(BTB_TOKEN_ADDRESS);
  await tokenSale.waitForDeployment();
  console.log("TokenSale deployed to:", await tokenSale.getAddress());

  // Get VestingNFT address
  const vestingNFTAddress = await tokenSale.vestingNFT();
  console.log("VestingNFT deployed to:", vestingNFTAddress);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  const CONFIRMATIONS = 5;
  await tokenSale.deploymentTransaction()?.wait(CONFIRMATIONS);

  // Verify TokenSale contract
  console.log("Verifying TokenSale contract...");
  try {
    await run("verify:verify", {
      address: await tokenSale.getAddress(),
      constructorArguments: [BTB_TOKEN_ADDRESS]
    });
    console.log("TokenSale contract verified successfully");
  } catch (error) {
    console.error("Error verifying TokenSale:", error);
  }

  // Verify VestingNFT contract
  console.log("Verifying VestingNFT contract...");
  try {
    await run("verify:verify", {
      address: vestingNFTAddress,
      constructorArguments: []
    });
    console.log("VestingNFT contract verified successfully");
  } catch (error) {
    console.error("Error verifying VestingNFT:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
