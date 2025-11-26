// hooks/usePriceData.ts
// Custom hook to fetch prices and reserves from Native AMM (MarketV3)

import { useReadContract, useWatchContractEvent } from 'wagmi';
import { MARKET_ABI } from '../services/contracts/contractInfo';

export function usePriceData(marketAddress: `0x${string}` | undefined) {
  // Fetch YES Price
  const { data: yesPriceRaw, refetch: refetchYesPrice } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'getPrice',
    args: [0], // 0 for YES
    query: {
      enabled: !!marketAddress,
      refetchInterval: 5000,
    },
  });

  // Fetch NO Price
  const { data: noPriceRaw, refetch: refetchNoPrice } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'getPrice',
    args: [1], // 1 for NO
    query: {
      enabled: !!marketAddress,
      refetchInterval: 5000,
    },
  });

  // Fetch YES Reserves
  const { data: yesReserves, refetch: refetchYesReserves } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'yesReserves',
    query: {
      enabled: !!marketAddress,
      refetchInterval: 5000,
    },
  });

  // Fetch NO Reserves
  const { data: noReserves, refetch: refetchNoReserves } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'noReserves',
    query: {
      enabled: !!marketAddress,
      refetchInterval: 5000,
    },
  });

  const refetch = () => {
    refetchYesPrice();
    refetchNoPrice();
    refetchYesReserves();
    refetchNoReserves();
  };

  // Watch for Trade events to update prices immediately
  useWatchContractEvent({
    address: marketAddress,
    abi: MARKET_ABI,
    eventName: 'Trade',
    onLogs: () => {
      refetch();
    },
    enabled: !!marketAddress,
  });

  const priceYes = typeof yesPriceRaw === 'bigint' ? Number(yesPriceRaw) : null;
  const priceNo = typeof noPriceRaw === 'bigint' ? Number(noPriceRaw) : null;

  // Convert reserves to USD (assuming 18 decimals for internal accounting, but input was USDC 6 decimals scaled up)
  // Actually, reserves are in 18 decimals.
  // To get "Liquidity USD", we can approximate it.
  // In CPMM, total liquidity value is roughly 2 * sqrt(k) * price? Or just sum of assets?
  // For simplicity, let's just show the raw token amount / 1e18 as "Liquidity"

  const yesLiquidity = yesReserves ? Number(yesReserves) / 1e18 : null;
  const noLiquidity = noReserves ? Number(noReserves) / 1e18 : null;

  // Calculate high-precision prices from reserves
  let priceYesPrecise = 50;
  let priceNoPrecise = 50;

  if (yesReserves && noReserves) {
    const yesRes = Number(yesReserves);
    const noRes = Number(noReserves);
    const total = yesRes + noRes;
    if (total > 0) {
      priceYesPrecise = (noRes / total) * 100;
      priceNoPrecise = (yesRes / total) * 100;
    }
  }

  return {
    priceYes: priceYesPrecise, // Return precise number instead of integer
    priceNo: priceNoPrecise,   // Return precise number instead of integer
    yesPoolAddress: undefined,
    noPoolAddress: undefined,
    yesLiquidityUSD: yesLiquidity,
    noLiquidityUSD: noLiquidity,
    refetch
  };
}


