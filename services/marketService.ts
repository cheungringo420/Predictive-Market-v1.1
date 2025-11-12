import { MarketCategory, MarketOutcome, TradeDirection } from '../types';
import type { Market } from '../types';

// Helper to calculate price from pools
const calculatePrices = (poolYes: number, poolNo: number): { yesPrice: number } => {
    const totalPool = poolYes + poolNo;
    if (totalPool === 0) return { yesPrice: 50 };
    const yesPrice = Math.round((poolYes / totalPool) * 100);
    return { yesPrice };
};

// Helper to re-hydrate a market object, converting date strings from JSON back to Date objects.
const reviveDates = (market: any): Market => {
  return {
    ...market,
    endsAt: new Date(market.endsAt),
    priceHistory: market.priceHistory.map((p: any) => ({
      ...p,
      date: new Date(p.date),
    })),
  };
};

const mockMarkets: Market[] = [
  {
    id: '1',
    title: 'Will the S&P 500 close above 5,500 by end of Q4 2024?',
    description: 'This market resolves to YES if the S&P 500 index closes at or above 5,500 on the last trading day of Q4 2024, according to official market data.',
    category: MarketCategory.FINANCE,
    yesPrice: 62,
    imageUrl: 'https://picsum.photos/seed/finance/600/400',
    outcome: MarketOutcome.PENDING,
    endsAt: new Date('2024-12-31T23:59:59Z'),
    poolYes: 6200,
    poolNo: 3800,
    feeBps: 100, // 1%
    priceHistory: [
        { date: new Date(new Date().getTime() - 86400000 * 2), yesPrice: 58 },
        { date: new Date(new Date().getTime() - 86400000), yesPrice: 60 },
        { date: new Date(), yesPrice: 62 },
    ]
  },
  {
    id: '2',
    title: 'Will a magnitude 7.0+ earthquake hit California in 2025?',
    description: 'This market resolves to YES if the USGS reports a magnitude 7.0 or greater earthquake with an epicenter within California state lines during 2025.',
    category: MarketCategory.WEATHER,
    yesPrice: 15,
    imageUrl: 'https://picsum.photos/seed/earthquake/600/400',
    outcome: MarketOutcome.PENDING,
    endsAt: new Date('2025-12-31T23:59:59Z'),
    poolYes: 1500,
    poolNo: 8500,
    feeBps: 100, // 1%
    priceHistory: [
        { date: new Date(new Date().getTime() - 86400000 * 2), yesPrice: 16 },
        { date: new Date(new Date().getTime() - 86400000), yesPrice: 14 },
        { date: new Date(), yesPrice: 15 },
    ]
  },
  {
    id: '3',
    title: 'Will Ethereum implement EIP-7212 (secp256r1) before 2025?',
    description: 'Resolves to YES if EIP-7212 is included in a successful mainnet hard fork on or before Dec 31, 2024, 11:59 PM UTC.',
    category: MarketCategory.CRYPTO,
    yesPrice: 78,
    imageUrl: 'https://picsum.photos/seed/crypto/600/400',
    outcome: MarketOutcome.PENDING,
    endsAt: new Date('2024-12-31T23:59:59Z'),
    poolYes: 78000,
    poolNo: 22000,
    feeBps: 100, // 1%
    priceHistory: [
        { date: new Date(new Date().getTime() - 86400000 * 2), yesPrice: 75 },
        { date: new Date(new Date().getTime() - 86400000), yesPrice: 77 },
        { date: new Date(), yesPrice: 78 },
    ]
  },
  // Add more markets with pool and history data...
    {
    id: '4',
    title: 'Will a Republican candidate win the 2024 US Presidential Election?',
    description: 'This market resolves to YES if the Associated Press declares a Republican candidate as the winner of the 2024 US Presidential Election.',
    category: MarketCategory.POLITICS,
    yesPrice: 48,
    imageUrl: 'https://picsum.photos/seed/politics/600/400',
    outcome: MarketOutcome.PENDING,
    endsAt: new Date('2024-11-06T05:00:00Z'),
    poolYes: 4800,
    poolNo: 5200,
    feeBps: 100, // 1%
    priceHistory: [
        { date: new Date(new Date().getTime() - 86400000 * 2), yesPrice: 50 },
        { date: new Date(new Date().getTime() - 86400000), yesPrice: 47 },
        { date: new Date(), yesPrice: 48 },
    ]
  },
  {
    id: '5',
    title: 'Will Brazil win the 2026 FIFA World Cup?',
    description: 'Resolves to YES if the Brazil national team wins the final match of the 2026 FIFA World Cup.',
    category: MarketCategory.SPORTS,
    yesPrice: 22,
    imageUrl: 'https://picsum.photos/seed/sports/600/400',
    outcome: MarketOutcome.PENDING,
    endsAt: new Date('2026-07-19T23:59:59Z'),
    poolYes: 220,
    poolNo: 780,
    feeBps: 100, // 1%
    priceHistory: [
      { date: new Date(new Date().getTime() - 86400000), yesPrice: 22 },
    ]
  },
  {
    id: '6',
    title: 'Will Bitcoin (BTC) price surpass $100,000 in 2024?',
    description: 'This market resolves to YES if the price of BTC reaches $100,000 USD on Coinbase Pro at any point in 2024.',
    category: MarketCategory.CRYPTO,
    yesPrice: 35,
    imageUrl: 'https://picsum.photos/seed/bitcoin/600/400',
    outcome: MarketOutcome.YES,
    endsAt: new Date('2024-03-15T23:59:59Z'),
    poolYes: 100000,
    poolNo: 25000,
    feeBps: 100, // 1%
    priceHistory: [
      { date: new Date('2024-03-15T23:59:59Z'), yesPrice: 80 },
    ]
  }
].map(m => ({ ...m, ...calculatePrices(m.poolYes, m.poolNo) })); // Initialize with calculated prices

// In-memory store for our markets to simulate a database
let marketsDB: Market[] = JSON.parse(JSON.stringify(mockMarkets));

export const fetchMarkets = (): Promise<Market[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a deep copy and revive the dates before resolving.
      resolve((JSON.parse(JSON.stringify(marketsDB)) as any[]).map(reviveDates));
    }, 500); // Simulate network delay
  });
};

export const placeTrade = (
    marketId: string, 
    direction: TradeDirection, 
    amount: number
): Promise<Market> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const marketIndex = marketsDB.findIndex(m => m.id === marketId);
            if (marketIndex === -1) {
                return reject(new Error('Market not found'));
            }

            const market = { ...marketsDB[marketIndex] };

            // Add the trade amount to the appropriate pool
            if (direction === TradeDirection.YES) {
                market.poolYes += amount;
            } else {
                market.poolNo += amount;
            }

            // Recalculate the price
            const { yesPrice } = calculatePrices(market.poolYes, market.poolNo);
            market.yesPrice = yesPrice;

            // Add a new point to the price history. This new date will be a Date object temporarily.
            market.priceHistory = [...market.priceHistory, { date: new Date(), yesPrice }];

            // Update the "database"
            marketsDB[marketIndex] = market;

            // Return a deep copy of the updated market, reviving ALL dates to ensure correct types in the UI.
            resolve(reviveDates(JSON.parse(JSON.stringify(market))));
        }, 300); // Simulate transaction delay
    });
};