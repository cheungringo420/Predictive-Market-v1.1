
export enum MarketCategory {
  FINANCE = 'Finance',
  WEATHER = 'Weather',
  POLITICS = 'Politics',
  SPORTS = 'Sports',
  CRYPTO = 'Crypto',
}

export enum MarketOutcome {
  YES = 'YES',
  NO = 'NO',
  PENDING = 'PENDING',
}

export interface PriceHistoryPoint {
    date: Date;
    yesPrice: number;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  yesPrice: number; // Stored as a value between 0 and 100
  imageUrl: string;
  outcome: MarketOutcome;
  endsAt: Date;
  poolYes: number; // in USDT
  poolNo: number; // in USDT
  priceHistory: PriceHistoryPoint[];
  feeBps: number; // Fee in basis points (e.g., 100 = 1%)
}

export enum TradeDirection {
  YES = 'YES',
  NO = 'NO',
}