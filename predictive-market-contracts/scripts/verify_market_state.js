const { ethers } = require("hardhat");

async function main() {
    // Connect to Base Sepolia
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    console.log("Connected to Base Sepolia");

    // Get the MarketFactory
    const factoryAddress = "0xffce02Dcb86Db2E20866d99c0dfd7e2405D3Bce6";
    const MarketFactory = await ethers.getContractFactory("MarketFactoryV3");
    const factory = MarketFactory.attach(factoryAddress).connect(provider);

    // Get all markets
    const markets = await factory.getAllMarkets();
    console.log(`Found ${markets.length} markets`);

    if (markets.length === 0) {
        console.log("No markets found.");
        return;
    }

    // Check the last market
    const marketAddress = markets[markets.length - 1];
    console.log("Checking latest market:", marketAddress);

    const Market = await ethers.getContractFactory("MarketV3");
    const market = Market.attach(marketAddress).connect(provider);

    // Check Reserves
    const yesReserves = await market.yesReserves();
    const noReserves = await market.noReserves();
    console.log("YES Reserves:", ethers.formatUnits(yesReserves, 18));
    console.log("NO Reserves:", ethers.formatUnits(noReserves, 18));

    // Check Prices
    const priceYes = await market.getPrice(0); // YES
    const priceNo = await market.getPrice(1); // NO
    console.log("Price YES:", priceYes.toString());
    console.log("Price NO:", priceNo.toString());

    // Check Events
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 5000;
    console.log(`Querying events from block ${fromBlock} to ${currentBlock}`);

    const filter = market.filters.Trade();
    const logs = await market.queryFilter(filter, fromBlock, currentBlock);
    console.log(`Found ${logs.length} Trade events`);

    logs.forEach((log, index) => {
        console.log(`Event ${index}:`);
        console.log("  User:", log.args.user);
        console.log("  Direction:", log.args.direction);
        console.log("  Input:", ethers.formatUnits(log.args.inputAmount, 6));
        console.log("  Output:", ethers.formatUnits(log.args.outputAmount, 18));
        console.log("  Price:", log.args.price.toString());
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
