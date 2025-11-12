// hooks/usePriceData.ts
// Custom hook to fetch pool addresses, reserves, and calculate prices from AMM

import { useReadContract, useChainId } from 'wagmi';
import { uniswapV2PairABI, marketABI, getMockUSDCAddress } from '../services/contracts/contractInfo';

const OUTCOME_DECIMALS = 18;
const COLLATERAL_DECIMALS = 6;

export function usePriceData(marketAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const currentMockUSDCAddress = getMockUSDCAddress(chainId);

  // Fetch pool addresses
  const { data: yesPoolAddress } = useReadContract({
    address: marketAddress,
    abi: marketABI,
    functionName: 'yesPoolAddress',
    query: {
      enabled: !!marketAddress,
    },
  });

  const { data: noPoolAddress } = useReadContract({
    address: marketAddress,
    abi: marketABI,
    functionName: 'noPoolAddress',
    query: {
      enabled: !!marketAddress,
    },
  });

  // Fetch reserves
  const { data: yesReserves } = useReadContract({
    address: yesPoolAddress as `0x${string}` | undefined,
    abi: uniswapV2PairABI,
    functionName: 'getReserves',
    query: {
      enabled: !!yesPoolAddress && yesPoolAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 3000,
      watch: true,
    },
  });

  const { data: noReserves } = useReadContract({
    address: noPoolAddress as `0x${string}` | undefined,
    abi: uniswapV2PairABI,
    functionName: 'getReserves',
    query: {
      enabled: !!noPoolAddress && noPoolAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 3000,
      watch: true,
    },
  });

  // Fetch token addresses
  const { data: yesPoolToken0 } = useReadContract({
    address: yesPoolAddress as `0x${string}` | undefined,
    abi: uniswapV2PairABI,
    functionName: 'token0',
    query: { enabled: !!yesPoolAddress },
  });

  const { data: yesPoolToken1 } = useReadContract({
    address: yesPoolAddress as `0x${string}` | undefined,
    abi: uniswapV2PairABI,
    functionName: 'token1',
    query: { enabled: !!yesPoolAddress },
  });

  const { data: noPoolToken0 } = useReadContract({
    address: noPoolAddress as `0x${string}` | undefined,
    abi: uniswapV2PairABI,
    functionName: 'token0',
    query: { enabled: !!noPoolAddress },
  });

  const { data: noPoolToken1 } = useReadContract({
    address: noPoolAddress as `0x${string}` | undefined,
    abi: uniswapV2PairABI,
    functionName: 'token1',
    query: { enabled: !!noPoolAddress },
  });

  // Calculate price from reserves
  const calculatePrice = (
    reserves: readonly [bigint, bigint, number] | undefined,
    token0Address: `0x${string}` | undefined,
    token1Address: `0x${string}` | undefined
  ): number | null => {
    if (!reserves || !token0Address || !token1Address || !currentMockUSDCAddress) return null;

    try {
      const [reserve0, reserve1] = reserves;
      const isToken0USDC = token0Address.toLowerCase() === currentMockUSDCAddress.toLowerCase();
      const isToken1USDC = token1Address.toLowerCase() === currentMockUSDCAddress.toLowerCase();

      let reserveUSDC: bigint, reserveOutcome: bigint;

      if (isToken0USDC) {
        reserveUSDC = BigInt(reserve0.toString());
        reserveOutcome = BigInt(reserve1.toString());
      } else if (isToken1USDC) {
        reserveUSDC = BigInt(reserve1.toString());
        reserveOutcome = BigInt(reserve0.toString());
      } else {
        return null;
      }

      if (reserveOutcome === 0n || reserveUSDC === 0n) return null;

      const reserveUSDC_18 = reserveUSDC * 10n ** 12n;
      const priceInCents = (Number(reserveUSDC_18) / Number(reserveOutcome)) * 100;

      if (priceInCents < 0 || priceInCents > 100) {
        return Math.max(0, Math.min(100, priceInCents));
      }

      return priceInCents;
    } catch (error) {
      console.error('Error calculating price:', error);
      return null;
    }
  };

  const priceYes = calculatePrice(yesReserves, yesPoolToken0, yesPoolToken1);
  const priceNo = calculatePrice(noReserves, noPoolToken0, noPoolToken1);

  return {
    priceYes,
    priceNo,
    yesPoolAddress: yesPoolAddress as `0x${string}` | undefined,
    noPoolAddress: noPoolAddress as `0x${string}` | undefined,
  };
}

