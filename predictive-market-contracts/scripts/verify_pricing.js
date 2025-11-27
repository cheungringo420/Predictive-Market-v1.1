const { ethers } = require("hardhat");

async function main() {
    const [deployer, user] = await ethers.getSigners();
    console.log("Testing MarketV3 Pricing Logic...");

    // 1. Deploy Mock USDC
    const MockERC20 = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockERC20.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("USDC deployed to:", usdcAddress);

    // 2. Deploy Market
    const MarketV3 = await ethers.getContractFactory("MarketV3");
    const market = await MarketV3.deploy("Test Question?", "ipfs://test", deployer.address, usdcAddress);
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    console.log("Market deployed to:", marketAddress);

    // 3. Add Liquidity
    const liquidityAmount = ethers.parseUnits("1000", 6); // $1000
    await usdc.approve(marketAddress, liquidityAmount);
    await market.addLiquidity(liquidityAmount);
    console.log("Added $1000 Liquidity");

    // Check initial price
    let priceYes = await market.getPrice(0);
    let priceNo = await market.getPrice(1);
    console.log("Initial Prices - YES:", priceYes.toString(), "NO:", priceNo.toString());

    // 4. User Buys YES
    const tradeAmount = ethers.parseUnits("100", 6); // $100
    await usdc.transfer(user.address, tradeAmount);
    await usdc.connect(user).approve(marketAddress, tradeAmount);

    console.log("User buying $100 of YES...");
    await market.connect(user).buyExactAmount(0, tradeAmount, 0);

    // Check new price
    priceYes = await market.getPrice(0);
    priceNo = await market.getPrice(1);
    console.log("New Prices - YES:", priceYes.toString(), "NO:", priceNo.toString());

    const yesReserves = await market.yesReserves();
    const noReserves = await market.noReserves();
    console.log("Reserves - YES:", yesReserves.toString(), "NO:", noReserves.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
