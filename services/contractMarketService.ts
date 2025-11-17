// services/contractMarketService.ts
// Service to fetch markets from smart contracts

import { readContract } from '@wagmi/core';
import { wagmiConfig } from '../wagmiConfig';
import { factoryABI, marketABI, getFactoryAddress } from './contracts/contractInfo';
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
      abi: factoryABI,
      functionName: 'getAllMarkets',
    })) as `0x${string}`[];

    const markets = await Promise.all(
      marketAddresses.map(async (address) => {
        try {
          const questionRaw = (await readContract(wagmiConfig, {
            address,
            abi: marketABI,
            functionName: 'question',
          })) as string;

          const { questionText, metadataUri, metadata } = await parseQuestionMetadata(questionRaw);

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

          const resolvedOutcome = marketResolved
            ? outcomeWasYes
              ? MarketOutcome.YES
              : MarketOutcome.NO
            : MarketOutcome.PENDING;

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
            yesPrice: 50,
            imageUrl,
            outcome: resolvedOutcome,
            endsAt,
            poolYes: 0,
            poolNo: 0,
            priceHistory: [{ date: new Date(), yesPrice: 50 }],
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
