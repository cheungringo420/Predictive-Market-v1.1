// services/contracts/contractInfo.ts
// Smart Contract Addresses and ABIs

// Network-specific addresses
const FACTORY_ADDRESSES: Record<number, string> = {
  84532: "0xF3eA8120BEd32a9E5229D832F305BE3335342Cfb", // Base Sepolia
  11155111: "0xF3eA8120BEd32a9E5229D832F305BE3335342Cfb", // Sepolia
  421614: "0xF3eA8120BEd32a9E5229D832F305BE3335342Cfb", // Arbitrum Sepolia
  80002: "0xF3eA8120BEd32a9E5229D832F305BE3335342Cfb", // Polygon Amoy
};

const MOCK_USDC_ADDRESSES: Record<number, string> = {
  84532: "0xb97D5A8b34b207e6303956E8c5DE4C58ff196421", // Base Sepolia
  11155111: "0xb97D5A8b34b207e6303956E8c5DE4C58ff196421", // Sepolia
  421614: "0xb97D5A8b34b207e6303956E8c5DE4C58ff196421", // Arbitrum Sepolia
  80002: "0xb97D5A8b34b207e6303956E8c5DE4C58ff196421", // Polygon Amoy
};

export const getFactoryAddress = (chainId: number): string | null => {
  return FACTORY_ADDRESSES[chainId] || null;
};

export const getMockUSDCAddress = (chainId: number): string | null => {
  return MOCK_USDC_ADDRESSES[chainId] || null;
};

// Uniswap V2 Router
export const uniswapV2RouterAddress = "0x1689E7B1F10000AE47eBfE339a4f69dECd19F602";

// MarketFactoryV2 ABI - Complete interface
export const factoryABI = [
  {
    inputs: [],
    name: "getAllMarkets",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "marketCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "collateralToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_question", type: "string" }],
    name: "createMarket",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "marketAddress", type: "address" },
      { indexed: false, internalType: "string", name: "question", type: "string" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
    ],
    name: "MarketCreated",
    type: "event",
  },
] as const;

export const marketABI = [
  {
    inputs: [],
    name: "question",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "yesPoolAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "noPoolAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "marketResolved",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "outcomeWasYes",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const uniswapV2PairABI = [
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "reserve0", type: "uint112" },
      { internalType: "uint112", name: "reserve1", type: "uint112" },
      { internalType: "uint32", name: "blockTimestampLast", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const uniswapV2RouterABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const mockUSDCABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

