// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@uniswap/v2-core/contracts/UniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

// This contract is just a helper to compile Uniswap contracts with 0.8.x
// Uniswap V2 is originally 0.5.16/0.6.6, so we might need to handle versioning carefully.
// Alternatively, we can just deploy the bytecode or use an interface.
// For simplicity in this FYP, we will use the standard addresses if on mainnet,
// but since we are on Base Sepolia, we might need to deploy our own if not available.
