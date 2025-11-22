import React, { useState } from 'react';
import type { Market, TradeDirection } from '../types';
import { usePriceData } from '../hooks/usePriceData';
import { MarketOutcome, TradeDirection as TradeDirectionEnum } from '../types';

interface MarketCardProps {
  market: Market;
  onTrade: (market: Market) => void;
  onPlaceTrade: (marketId: string, direction: TradeDirection, amount: number) => Promise<void>;
  isConnected: boolean;
}

const CategoryPill: React.FC<{ category: string }> = ({ category }) => (
    <span className="absolute top-4 left-4 inline-block bg-brand-secondary/50 text-brand-primary text-xs font-bold px-3 py-1 rounded-full z-10">{category}</span>
);

const ResolutionBanner: React.FC<{ outcome: MarketOutcome }> = ({ outcome }) => {
    const isYes = outcome === MarketOutcome.YES;
    const bgColor = isYes ? 'bg-brand-yes/20' : 'bg-brand-no/20';
    const textColor = isYes ? 'text-brand-yes' : 'text-brand-no';
    const borderColor = isYes ? 'border-brand-yes' : 'border-brand-no';

    return (
        <div className={`mt-auto text-center p-3 rounded-lg border-2 ${borderColor} ${bgColor}`}>
            <p className="text-sm text-brand-muted">Market Resolved</p>
            <p className={`text-2xl font-bold ${textColor}`}>{outcome}</p>
        </div>
    );
};


const OutcomeButton: React.FC<{ 
    price: number; 
    direction: 'YES' | 'NO'; 
    onClick: (e: React.MouseEvent) => void; 
    disabled: boolean;
    isSelected: boolean;
}> = ({ price, direction, onClick, disabled, isSelected }) => {
    const isYes = direction === 'YES';
    const color = isYes ? 'text-brand-yes' : 'text-brand-no';
    const selectedRingColor = isYes ? 'ring-brand-yes' : 'ring-brand-no';
    const selectedBgColor = isYes ? 'bg-brand-yes/10' : 'bg-brand-no/10';
    
    const baseClasses = `flex w-full flex-col items-center p-3 rounded-lg transition-all duration-200 relative focus:outline-none`;
    const stateClasses = disabled 
        ? 'bg-brand-border/20 opacity-50 cursor-not-allowed' 
        : `bg-brand-border/30 hover:bg-brand-border/50`;
    
    const selectionClasses = isSelected
        ? `ring-2 ${selectedRingColor} scale-105 shadow-lg ${selectedBgColor}`
        : `scale-100 ${!disabled ? 'opacity-70 hover:opacity-100' : ''}`;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${stateClasses} ${selectionClasses}`}
        >
            <span className="text-xs text-brand-muted">{direction}</span>
            <span className={`text-2xl font-bold ${color}`}>{price.toFixed(2)}¢</span>
        </button>
    );
};

export const MarketCard: React.FC<MarketCardProps> = ({ market, onTrade, onPlaceTrade, isConnected }) => {
    const [isTrading, setIsTrading] = useState(false);
    const [selectedDirection, setSelectedDirection] = useState<TradeDirection | null>(null);
    const isResolved = market.outcome !== MarketOutcome.PENDING;
    const isOnChainMarket = market.id.toLowerCase().startsWith('0x') && market.id.length === 42;
    const marketAddress = isOnChainMarket ? (market.id as `0x${string}`) : undefined;
    const { priceYes: liveYesPrice, priceNo: liveNoPrice, yesLiquidityUSD, noLiquidityUSD } = usePriceData(marketAddress);
    const yesPriceValue = typeof liveYesPrice === 'number' ? liveYesPrice : market.yesPrice;
    const noPriceValue = typeof liveNoPrice === 'number' ? liveNoPrice : 100 - yesPriceValue;
    const totalLiquidity = typeof yesLiquidityUSD === 'number' || typeof noLiquidityUSD === 'number'
        ? (yesLiquidityUSD ?? 0) + (noLiquidityUSD ?? 0)
        : null;

    const handleSelectDirection = (e: React.MouseEvent, direction: TradeDirection) => {
        e.stopPropagation(); // Prevent modal from opening
        if (isTrading || isResolved || !isConnected) return;
        
        setSelectedDirection(prev => (prev === direction ? null : direction));
    };
    
    const handleConfirmTrade = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent modal from opening
        if (!selectedDirection || isTrading) return;

        setIsTrading(true);
        try {
            const defaultAmount = 100; // Default amount for quick trades
            await onPlaceTrade(market.id, selectedDirection, defaultAmount);
            setSelectedDirection(null); // Reset selection after successful trade
        } catch (error) {
            // Error is handled and alerted in App.tsx
        } finally {
            setIsTrading(false);
        }
    };

    const getButtonText = () => {
        if (!isConnected) return 'Connect Wallet to Trade';
        if (isTrading) return 'Processing...';
        if (selectedDirection) return `Trade ${selectedDirection}`;
        return 'Select an Outcome';
    }
    
    return (
        <div 
            className="bg-brand-surface border border-brand-border rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:border-brand-primary hover:shadow-2xl hover:-translate-y-1"
            onClick={() => onTrade(market)}
        >
            <div className="relative cursor-pointer">
                <img src={market.imageUrl} alt={market.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <CategoryPill category={market.category} />
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white mb-2 flex-grow cursor-pointer">{market.title}</h3>
                <p className="text-sm text-brand-muted mb-2 cursor-pointer">
                  Ends: {market.endsAt.toLocaleDateString()}
                </p>
                {market.description && (
                  <p className="text-sm text-brand-muted mb-4 overflow-hidden text-ellipsis">
                    {market.description}
                  </p>
                )}

                {isOnChainMarket && !isResolved && (
                  <div className="bg-brand-bg/40 border border-brand-border rounded-lg p-3 mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-brand-muted">Live YES</p>
                      <p className="text-white font-semibold">{yesPriceValue.toFixed(2)}¢</p>
                    </div>
                    <div>
                      <p className="text-brand-muted">Live NO</p>
                      <p className="text-white font-semibold">{noPriceValue.toFixed(2)}¢</p>
                    </div>
                    <div>
                      <p className="text-brand-muted">Liquidity</p>
                      <p className="text-brand-light font-semibold">{totalLiquidity ? `$${totalLiquidity.toLocaleString(undefined,{ maximumFractionDigits: 0 })}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-brand-muted">Pool</p>
                      <p className="text-brand-light text-xs break-all">{marketAddress?.slice(0, 6)}...{marketAddress?.slice(-4)}</p>
                    </div>
                  </div>
                )}

                {isResolved ? (
                    <ResolutionBanner outcome={market.outcome} />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <OutcomeButton 
                                price={yesPriceValue} 
                                direction="YES" 
                                onClick={(e) => handleSelectDirection(e, TradeDirectionEnum.YES)}
                                disabled={!isConnected || isTrading}
                                isSelected={selectedDirection === TradeDirectionEnum.YES}
                            />
                            <OutcomeButton 
                                price={noPriceValue} 
                                direction="NO" 
                                onClick={(e) => handleSelectDirection(e, TradeDirectionEnum.NO)}
                                disabled={!isConnected || isTrading}
                                isSelected={selectedDirection === TradeDirectionEnum.NO}
                            />
                        </div>
                        
                        <button
                            onClick={handleConfirmTrade}
                            disabled={!isConnected || isTrading || !selectedDirection}
                            className="w-full mt-auto px-4 py-2.5 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-brand-primary transition-all duration-200 disabled:bg-brand-border disabled:text-brand-muted disabled:cursor-not-allowed"
                        >
                            {isTrading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {getButtonText()}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};