
import React, { useState, useEffect, useMemo } from 'react';
import type { Market, TradeDirection } from '../types';
import { TradeDirection as TradeDirectionEnum } from '../types';

interface MarketDetailModalProps {
    market: Market | null;
    onClose: () => void;
    isConnected: boolean;
    onPlaceTrade: (marketId: string, direction: TradeDirection, amount: number) => Promise<void>;
}

const CloseIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PriceHistoryChart: React.FC<{market: Market}> = ({market}) => {
    const { priceHistory, endsAt } = market;
    const width = 500;
    const height = 150;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };

    if (priceHistory.length < 2) {
        return <div className="h-[150px] flex items-center justify-center text-brand-muted">Not enough price data for chart.</div>
    }

    const startDate = priceHistory[0].date;
    const timeDomain = endsAt.getTime() - startDate.getTime();
    
    const points = priceHistory.map(p => {
        const x = padding.left + ((p.date.getTime() - startDate.getTime()) / timeDomain) * (width - padding.left - padding.right);
        const y = padding.top + ((100 - p.yesPrice) / 100) * (height - padding.top - padding.bottom);
        return `${x},${y}`;
    }).join(' ');

    const lastPoint = priceHistory[priceHistory.length - 1];
    const chartColor = lastPoint.yesPrice >= 50 ? "stroke-brand-yes" : "stroke-brand-no";


    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-Axis Labels */}
                <text x={padding.left - 8} y={padding.top + 5} textAnchor="end" className="text-xs fill-brand-muted">100¢</text>
                <text x={padding.left - 8} y={height / 2} textAnchor="end" className="text-xs fill-brand-muted">50¢</text>
                <text x={padding.left - 8} y={height - padding.bottom} textAnchor="end" className="text-xs fill-brand-muted">0¢</text>
                
                {/* Guideline */}
                <line x1={padding.left} y1={height/2} x2={width - padding.right} y2={height/2} className="stroke-brand-border" strokeDasharray="2,2"/>
                
                {/* Price Line */}
                <polyline
                    fill="none"
                    className={chartColor}
                    strokeWidth="2"
                    points={points}
                />
            </svg>
        </div>
    )
}

export const MarketDetailModal: React.FC<MarketDetailModalProps> = ({ market, onClose, isConnected, onPlaceTrade }) => {
    const [direction, setDirection] = useState<TradeDirectionEnum>(TradeDirectionEnum.YES);
    const [amount, setAmount] = useState<string>('100');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (market) {
            setDirection(TradeDirectionEnum.YES);
            setAmount('100');
        }
    }, [market]);
    
    const tradeDetails = useMemo(() => {
        if (!market || !amount || parseFloat(amount) <= 0) {
            return { cost: '0.00', fee: '0.00', totalCost: '0.00', potentialPayout: '0.00' };
        }
        const price = direction === TradeDirectionEnum.YES ? market.yesPrice : (100 - market.yesPrice);
        const cost = (parseFloat(amount) * price) / 100;
        const fee = cost * (market.feeBps / 10000);
        const totalCost = cost + fee;
        const potentialPayout = parseFloat(amount);

        return {
            cost: cost.toFixed(2),
            fee: fee.toFixed(2),
            totalCost: totalCost.toFixed(2),
            potentialPayout: potentialPayout.toFixed(2)
        };
    }, [amount, direction, market]);

    if (!market) return null;

    const handleSubmitTrade = async () => {
        if (!isConnected || !market) {
            alert("Please connect your wallet to submit a trade.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onPlaceTrade(market.id, direction, parseFloat(amount));
            // Don't close modal on success, so user can see the updated state
        } catch (e) {
            // Error is handled in App.tsx
        } finally {
            setIsSubmitting(false);
        }
    };

    const isYes = direction === TradeDirectionEnum.YES;
    const price = isYes ? market.yesPrice : 100 - market.yesPrice;
    const totalLiquidity = market.poolYes + market.poolNo;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="sticky top-4 right-4 z-10 float-right text-brand-muted hover:text-white">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <img src={market.imageUrl} alt={market.title} className="w-full h-48 object-cover rounded-t-xl" />
                <div className="p-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">{market.title}</h2>
                    <p className="text-sm text-brand-muted mb-6">{market.description}</p>
                    
                    <div className="bg-brand-bg/50 p-4 rounded-lg mb-6">
                        <h3 className="text-sm font-bold text-brand-light mb-2">Price History</h3>
                        <PriceHistoryChart market={market} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                        <div className="bg-brand-bg/50 p-3 rounded-lg">
                            <div className="text-xs text-brand-muted">Total Liquidity</div>
                            <div className="text-lg font-bold text-white">${totalLiquidity.toLocaleString()}</div>
                        </div>
                        <div className="bg-brand-bg/50 p-3 rounded-lg">
                            <div className="text-xs text-brand-muted">YES Pool</div>
                            <div className="text-lg font-bold text-brand-yes">${market.poolYes.toLocaleString()}</div>
                        </div>
                        <div className="bg-brand-bg/50 p-3 rounded-lg">
                            <div className="text-xs text-brand-muted">NO Pool</div>
                            <div className="text-lg font-bold text-brand-no">${market.poolNo.toLocaleString()}</div>
                        </div>
                    </div>


                    <div className="bg-brand-bg p-6 rounded-lg">
                         <h3 className="text-lg font-bold text-white mb-4 text-center">Place Your Trade</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => setDirection(TradeDirectionEnum.YES)} className={`py-3 rounded-lg font-bold text-lg transition-colors ${isYes ? 'bg-brand-yes text-white' : 'bg-brand-border hover:bg-brand-yes/20'}`}>
                                Buy YES ({market.yesPrice}¢)
                            </button>
                            <button onClick={() => setDirection(TradeDirectionEnum.NO)} className={`py-3 rounded-lg font-bold text-lg transition-colors ${!isYes ? 'bg-brand-no text-white' : 'bg-brand-border hover:bg-brand-no/20'}`}>
                                Buy NO ({100 - market.yesPrice}¢)
                            </button>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="amount" className="block text-sm font-medium text-brand-light mb-1">Shares to buy</label>
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="e.g., 100"
                            />
                        </div>
                        
                        <div className="bg-brand-bg border border-brand-border/50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-brand-muted">Price per share:</span>
                                <span className="text-white font-mono">{price}¢</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-brand-muted">Cost:</span>
                                <span className="text-white font-mono">{tradeDetails.cost} USDT</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-brand-muted">Trading Fee ({market.feeBps / 100}%):</span>
                                <span className="text-white font-mono">{tradeDetails.fee} USDT</span>
                            </div>
                            <div className="flex justify-between border-t border-brand-border pt-2 mt-2">
                                <span className="text-brand-light font-bold">Total Cost:</span>
                                <span className="text-white font-mono font-bold">{tradeDetails.totalCost} USDT</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-brand-muted">Potential Payout:</span>
                                <span className="text-white font-mono">{tradeDetails.potentialPayout} USDT</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmitTrade}
                            disabled={!isConnected || isSubmitting || !amount || parseFloat(amount) <= 0}
                            className="w-full mt-6 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : (isConnected ? 'Submit Trade' : 'Connect Wallet to Trade')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};