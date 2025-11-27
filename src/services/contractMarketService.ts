// services/contractMarketService.ts
// Service to fetch markets from smart contracts

import { readContract } from '@wagmi/core';
import { wagmiConfig } from '../wagmiConfig';
import { MARKET_FACTORY_ABI, MARKET_ABI, getFactoryAddress } from './contracts/contractInfo';
import type { Market } from '../types';
import { MarketCategory, MarketOutcome } from '../types';
import { parseQuestionMetadata } from './metadataService';

const getDefaultCategory = (value?: MarketCategory): MarketCategory => {
  if (!value) return MarketCategory.CRYPTO;
  return Object.values(MarketCategory).includes(value) ? value : MarketCategory.CRYPTO;
};

const getDefaultEndDate = (metadataDate?: string) => {
  if (metadataDate) {
    const parsed = new Date(metadataDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

export const fetchMarketsFromContract = async (chainId: number): Promise<Market[]> => {
  try {
    const factoryAddress = getFactoryAddress(chainId);
    if (!factoryAddress) {
      console.warn('Factory not deployed on this network');
      return [];
    }

    const marketAddresses = (await readContract(wagmiConfig, {
      address: factoryAddress as `0x${string}`,
      abi: MARKET_FACTORY_ABI,
      functionName: 'getAllMarkets',
    } as any)) as `0x${string}`[];

    const markets = await Promise.all(
      marketAddresses.map(async (address) => {
        try {
          const questionRaw = (await readContract(wagmiConfig, {
            address,
            abi: MARKET_ABI,
            functionName: 'question',
          } as any)) as string;

          const { questionText, metadataUri, metadata } = await parseQuestionMetadata(questionRaw);

          const marketResolved = (await readContract(wagmiConfig, {
            address,
            abi: MARKET_ABI,
            functionName: 'marketResolved',
          } as any)) as boolean;

          const outcomeWasYes = marketResolved
            ? ((await readContract(wagmiConfig, {
              address,
              abi: MARKET_ABI,
              functionName: 'outcomeWasYes',
            } as any)) as boolean)
            : false;

          const resolvedOutcome = marketResolved
            ? outcomeWasYes
              ? MarketOutcome.YES
              : MarketOutcome.NO
            : MarketOutcome.PENDING;

          // Fetch Prices and Reserves
          const yesPriceRaw = (await readContract(wagmiConfig, {
            address,
            abi: MARKET_ABI,
            functionName: 'getPrice',
            args: [0],
          } as any)) as bigint;

          const yesReservesRaw = (await readContract(wagmiConfig, {
            address,
            abi: MARKET_ABI,
            functionName: 'yesReserves',
          } as any)) as bigint;

          const noReservesRaw = (await readContract(wagmiConfig, {
            address,
            abi: MARKET_ABI,
            functionName: 'noReserves',
          } as any)) as bigint;

          const yesPrice = Number(yesPriceRaw);
          const poolYes = Number(yesReservesRaw) / 1e18; // Display as tokens
          const poolNo = Number(noReservesRaw) / 1e18;

          const category = getDefaultCategory(metadata?.category);
          const endsAt = getDefaultEndDate(metadata?.endDate);
          const title = metadata?.question?.trim() || questionText;
          const description = metadata?.description?.trim() || questionText;
          const imageUrl = metadata?.imageUrl?.trim() || `https://picsum.photos/seed/${address}/600/400`;

          const market: Market = {
            id: address,
            title,
            description,
            category,
            yesPrice,
            imageUrl,
            outcome: resolvedOutcome,
            endsAt,
            poolYes,
            poolNo,
            priceHistory: [{ date: new Date(), yesPrice }],
            feeBps: 100,
            metadataUri,
            source: 'onchain',
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

