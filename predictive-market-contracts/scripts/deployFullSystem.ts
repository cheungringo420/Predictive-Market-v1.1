import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Mock USDC (Collateral)
  // In a real scenario, we would use the official USDC address on Base Sepolia
  // But for full control, we deploy our own.
  const MockUSDC = await ethers.getContractFactory("OutcomeToken"); // Reusing ERC20 logic
  const usdc = await MockUSDC.deploy("Mock USDC", "mUSDC");
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Mint some USDC to the deployer for testing
  await usdc.mint(deployer.address, ethers.parseUnits("1000000", 18));
  console.log("Minted 1,000,000 mUSDC to deployer");

  // 2. Deploy MarketFactoryV3
  const MarketFactory = await ethers.getContractFactory("MarketFactoryV3");
  const factory = await MarketFactory.deploy(usdcAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("MarketFactoryV3 deployed to:", factoryAddress);

  // 3. Create a Test Market
  const tx = await factory.createMarket(
    "Will ETH hit $5000 in 2025?",
    "ipfs://QmTestHash" // Placeholder metadata URI
  );
  const receipt = await tx.wait();
  
  // Find the MarketCreated event
  // The event signature is MarketCreated(address,string,string,address)
  // We can look at the logs.
  // For simplicity in this script, we just log completion.
  console.log("Test Market created!");

  console.log("\n--- Deployment Summary ---");
  console.log("Collateral (mUSDC):", usdcAddress);
  console.log("MarketFactoryV3:", factoryAddress);
  console.log("--------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
