// services/contractMarketService.ts
// Service to fetch markets from smart contracts

import { readContract } from '@wagmi/core';
import { wagmiConfig } from '../wagmiConfig';
import { factoryABI, marketABI, getFactoryAddress } from './contracts/contractInfo';
import type { Market } from '../types';
import { MarketCategory, MarketOutcome } from '../types';

// Helper to convert market address to Market type
export const fetchMarketsFromContract = async (chainId: number): Promise<Market[]> => {
  try {
    const factoryAddress = getFactoryAddress(chainId);
    if (!factoryAddress) {
      console.warn('Factory not deployed on this network');
      return [];
    }

    // Get all market addresses
    const marketAddresses = (await readContract(wagmiConfig, {
      address: factoryAddress as `0x${string}`,
      abi: factoryABI,
      functionName: 'getAllMarkets',
    })) as `0x${string}`[];

    // Fetch market data for each address
    const markets = await Promise.all(
      marketAddresses.map(async (address) => {
        try {
          const question = (await readContract(wagmiConfig, {
            address,
            abi: marketABI,
            functionName: 'question',
          })) as string;

          const marketResolved = (await readContract(wagmiConfig, {
            address,
            abi: marketABI,
            functionName: 'marketResolved',
          })) as boolean;

          const outcomeWasYes = marketResolved
            ? ((await readContract(wagmiConfig, {
                address,
                abi: marketABI,
                functionName: 'outcomeWasYes',
              })) as boolean)
            : false;

          const market: Market = {
            id: address,
            title: question,
            description: question,
            category: MarketCategory.CRYPTO,
            yesPrice: 50,
            imageUrl: `https://picsum.photos/seed/${address}/600/400`,
            outcome: marketResolved
              ? outcomeWasYes
                ? MarketOutcome.YES
                : MarketOutcome.NO
              : MarketOutcome.PENDING,
            endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            poolYes: 0,
            poolNo: 0,
            priceHistory: [{ date: new Date(), yesPrice: 50 }],
            feeBps: 100,
          };

          return market;
        } catch (error) {
          console.error(`Error fetching market ${address}:`, error);
          return null;
        }
      })
    );

    return markets.filter((m): m is Market => m !== null);
  } catch (error) {
    console.error('Error fetching markets from contract:', error);
    return [];
  }
};
