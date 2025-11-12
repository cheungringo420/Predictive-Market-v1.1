// services/contractMarketService.ts
// Service to fetch markets from smart contracts

import { readContract } from '@wagmi/core';
import { config } from '@wagmi/core';
import { factoryABI, marketABI, getFactoryAddress } from './contracts/contractInfo';
import { useChainId } from 'wagmi';
import type { Market, MarketCategory, MarketOutcome } from '../types';

// Helper to convert market address to Market type
// For now, we'll use a simplified version that fetches from contract
export const fetchMarketsFromContract = async (chainId: number): Promise<Market[]> => {
  try {
    const factoryAddress = getFactoryAddress(chainId);
    if (!factoryAddress) {
      console.warn('Factory not deployed on this network');
      return [];
    }

    // Get all market addresses
    const marketAddresses = await readContract(config, {
      address: factoryAddress as `0x${string}`,
      abi: factoryABI,
      functionName: 'getAllMarkets',
    }) as `0x${string}`[];

    // Fetch market data for each address
    const markets = await Promise.all(
      marketAddresses.map(async (address) => {
        try {
          const question = await readContract(config, {
            address,
            abi: marketABI,
            functionName: 'question',
          }) as string;

          const marketResolved = await readContract(config, {
            address,
            abi: marketABI,
            functionName: 'marketResolved',
          }) as boolean;

          const outcomeWasYes = marketResolved
            ? (await readContract(config, {
                address,
                abi: marketABI,
                functionName: 'outcomeWasYes',
              }) as boolean)
            : false;

          // Create a Market object from contract data
          // Note: We'll need to fetch prices separately using usePriceData hook
          const market: Market = {
            id: address,
            title: question,
            description: question, // Use question as description for now
            category: MarketCategory.CRYPTO, // Default category
            yesPrice: 50, // Will be updated by usePriceData hook
            imageUrl: `https://picsum.photos/seed/${address}/600/400`,
            outcome: marketResolved
              ? outcomeWasYes
                ? MarketOutcome.YES
                : MarketOutcome.NO
              : MarketOutcome.PENDING,
            endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days from now
            poolYes: 0, // Will be calculated from reserves
            poolNo: 0, // Will be calculated from reserves
            priceHistory: [{ date: new Date(), yesPrice: 50 }],
            feeBps: 100, // 1%
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

