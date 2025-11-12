
import React, { useState, useMemo } from 'react';
import { MarketCard } from './MarketCard';
import type { Market, TradeDirection } from '../types';
import { MarketCategory } from '../types';

interface MarketListProps {
  markets: Market[];
  onTrade: (market: Market) => void;
  onPlaceTrade: (marketId: string, direction: TradeDirection, amount: number) => Promise<void>;
  isConnected: boolean;
}

const categories = [null, ...Object.values(MarketCategory)];

export const MarketList: React.FC<MarketListProps> = ({ markets, onTrade, onPlaceTrade, isConnected }) => {
  const [activeFilter, setActiveFilter] = useState<MarketCategory | null>(null);

  const filteredMarkets = useMemo(() => {
    if (!activeFilter) {
      return markets;
    }
    return markets.filter(market => market.category === activeFilter);
  }, [markets, activeFilter]);

  return (
    <div>
      <div className="flex justify-center flex-wrap gap-2 mb-8">
        {categories.map((category, index) => {
          const isSelected = activeFilter === category;
          return (
            <button
              key={index}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-primary text-white shadow-lg'
                  : 'bg-brand-surface text-brand-light hover:bg-brand-border'
              }`}
            >
              {category || 'All'}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((market) => (
          <MarketCard 
            key={market.id} 
            market={market} 
            onTrade={onTrade} 
            onPlaceTrade={onPlaceTrade}
            isConnected={isConnected}
          />
        ))}
      </div>
    </div>
  );
};