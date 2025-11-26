const hre = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MockUSDC (Optional: Only if you need a fresh token)
    // If you have an existing USDC, set it here:
    // const usdcAddress = "EXISTING_USDC_ADDRESS";

    console.log("Deploying MockUSDC...");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);

    // 2. Deploy Factory
    console.log("Deploying MarketFactoryV3...");
    const MarketFactoryV3 = await hre.ethers.getContractFactory("MarketFactoryV3");
    const factory = await MarketFactoryV3.deploy(usdcAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("MarketFactoryV3 deployed to:", factoryAddress);

    console.log("Deployment complete!");
    console.log("----------------------------------------------------");
    console.log("MockUSDC:", usdcAddress);
    console.log("MarketFactoryV3:", factoryAddress);
    console.log("----------------------------------------------------");
    console.log("Please update 'src/services/contracts/contractInfo.ts' with these addresses.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
