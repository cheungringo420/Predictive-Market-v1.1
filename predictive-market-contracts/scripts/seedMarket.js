const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Seeding market with account:", deployer.address);

    // Addresses from previous deployment
    // If you are running this separately, ensure these match your deployment
    const FACTORY_ADDRESS = "0x551767dC5480A2E8CB1F61e3a903364403badb3e";
    const USDC_ADDRESS = "0x2C2A938db1910f62bfC270e40097b6513FE90fD1";

    const factory = await hre.ethers.getContractAt("MarketFactoryV3", FACTORY_ADDRESS);
    const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);

    // 1. Create Market
    console.log("Creating market...");
    const tx = await factory.createMarket("Will ETH hit 10k in 2025?", "ipfs://bafkreic653o424p4qj4v4q4q4q4q4q4q4q4q4q4q4q4q4q4q4q4q4q");
    const receipt = await tx.wait();

    // Find MarketCreated event
    // Event signature: MarketCreated(address indexed marketAddress, string question, string metadataURI, address indexed creator)
    // Topic 0 is the hash of the signature.
    // We can use the interface to parse logs.

    let marketAddress;
    for (const log of receipt.logs) {
        try {
            const parsedLog = factory.interface.parseLog(log);
            if (parsedLog.name === "MarketCreated") {
                marketAddress = parsedLog.args[0];
                break;
            }
        } catch (e) {
            // Ignore logs that don't match
        }
    }

    if (!marketAddress) {
        console.error("Could not find MarketCreated event!");
        process.exit(1);
    }

    console.log("Market created at:", marketAddress);

    // 2. Add Liquidity
    console.log("Approving USDC...");
    const amount = hre.ethers.parseUnits("1000", 6); // 1000 USDC
    await usdc.approve(marketAddress, amount);

    console.log("Adding Liquidity...");
    const market = await hre.ethers.getContractAt("MarketV3", marketAddress);
    await market.addLiquidity(amount);

    console.log("Liquidity added!");
    console.log("Seed complete.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
