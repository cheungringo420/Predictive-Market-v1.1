const hre = require("hardhat");

async function main() {
    console.log("Starting deployment of MarketFactoryV3 ONLY...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // The existing mUSDC address provided by the user
    const usdcAddress = "0x388FBde0222693293Ab060789E816FfC8e317FeA";
    console.log("Using existing MockUSDC at:", usdcAddress);

    // Deploy Factory
    console.log("Deploying MarketFactoryV3...");
    const MarketFactoryV3 = await hre.ethers.getContractFactory("MarketFactoryV3");
    const factory = await MarketFactoryV3.deploy(usdcAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("MarketFactoryV3 deployed to:", factoryAddress);

    console.log("Deployment complete!");
    console.log("----------------------------------------------------");
    console.log("MarketFactoryV3:", factoryAddress);
    console.log("----------------------------------------------------");
    console.log("Please provide this new Factory address to the developer.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
