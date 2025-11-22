import { ethers } from "hardhat";

async function main() {
  const collateral = process.env.COLLATERAL_ADDRESS || "0x..."; // MockUSDC 位址
  const Factory = await ethers.getContractFactory("MarketFactoryV3");
  const factory = await Factory.deploy(collateral);
  await factory.deployed();
  console.log("MarketFactoryV3 deployed to:", factory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});