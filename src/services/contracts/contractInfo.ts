import { Address } from 'viem';
import MarketFactoryV3Artifact from '../../abis/MarketFactoryV3.json';
import MarketV3Artifact from '../../abis/MarketV3.json';

// Base Sepolia Addresses
// TODO: Deploy contracts and update these addresses
export const MARKET_FACTORY_ADDRESS = "0xffce02Dcb86Db2E20866d99c0dfd7e2405D3Bce6" as Address;
export const MOCK_USDC_ADDRESS = "0x388FBde0222693293Ab060789E816FfC8e317FeA" as Address; // Updated mUSDC address

export const MARKET_FACTORY_ABI = MarketFactoryV3Artifact.abi;
export const MARKET_ABI = MarketV3Artifact.abi;

// Legacy / Reference (Optional)
export const UNISWAP_ROUTER_ADDRESS = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24" as Address;

export const getFactoryAddress = (chainId: number) => {
    return MARKET_FACTORY_ADDRESS;
};

export const getMockUSDCAddress = (chainId: number) => {
    return MOCK_USDC_ADDRESS;
};

export const erc20Abi = [
    {
        constant: true,
        inputs: [
            { name: "_owner", type: "address" },
            { name: "_spender", type: "address" }
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function"
    },
    {
        constant: false,
        inputs: [
            { name: "_spender", type: "address" },
            { name: "_value", type: "uint256" }
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function"
    }
] as const;
