import React, { useState, useEffect } from 'react';
import type { Market, TradeDirection } from '../types';
import { usePriceData } from '../hooks/usePriceData';
import { MarketOutcome, TradeDirection as TradeDirectionEnum } from '../types';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { MARKET_ABI, MOCK_USDC_ADDRESS, erc20Abi } from '../services/contracts/contractInfo';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface MarketCardProps {
    market: Market;
    onTrade: (market: Market) => void;
    onPlaceTrade: (marketId: string, direction: TradeDirection, amount: number) => Promise<void>;
    isConnected: boolean;
}

const CategoryPill: React.FC<{ category: string }> = ({ category }) => (
    <span className="absolute top-4 left-4 inline-block bg-brand-surface/90 backdrop-blur-sm border border-brand-border/50 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">{category}</span>
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

export const MarketCard: React.FC<MarketCardProps> = ({ market, onTrade, onPlaceTrade, isConnected }) => {
    const [tradeAmount, setTradeAmount] = useState<string>('10');
    const [showTradeUI, setShowTradeUI] = useState(false);
    const [isTrading, setIsTrading] = useState(false);
    const [loadingDirection, setLoadingDirection] = useState<TradeDirectionEnum | null>(null);

    const { writeContractAsync } = useWriteContract();
    const queryClient = useQueryClient();
    const { address } = useAccount();

    const isResolved = market.outcome !== MarketOutcome.PENDING;
    const isOnChainMarket = market.id.toLowerCase().startsWith('0x') && market.id.length === 42;
    const marketAddress = isOnChainMarket ? (market.id as `0x${string}`) : undefined;

    // Check Allowance
    const { data: allowance } = useReadContract({
        address: MOCK_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: address && marketAddress ? [address, marketAddress] : undefined,
        query: { enabled: !!address && !!marketAddress },
    });

    const { priceYes: liveYesPrice, priceNo: liveNoPrice, yesLiquidityUSD, noLiquidityUSD } = usePriceData(marketAddress);
    const yesPriceValue = typeof liveYesPrice === 'number' ? liveYesPrice : market.yesPrice;
    const noPriceValue = typeof liveNoPrice === 'number' ? liveNoPrice : 100 - yesPriceValue;

    const totalLiquidity = typeof yesLiquidityUSD === 'number' || typeof noLiquidityUSD === 'number'
        ? (yesLiquidityUSD ?? 0) + (noLiquidityUSD ?? 0)
        : null;

    useEffect(() => {
        if (showTradeUI) {
            setTradeAmount('10');
        }
    }, [showTradeUI]);

    const [isUpdating, setIsUpdating] = useState(false);

    const handleFastTrade = async (e: React.MouseEvent, direction: TradeDirectionEnum) => {
        e.stopPropagation();
        if (isTrading) return;
        setIsTrading(true);
        setLoadingDirection(direction);

        if (!isConnected) {
            toast.error("Please connect your wallet");
            setIsTrading(false);
            setLoadingDirection(null);
            return;
        }
        if (!tradeAmount || isNaN(Number(tradeAmount)) || Number(tradeAmount) <= 0) {
            toast.error("Please enter a valid amount");
            setIsTrading(false);
            setLoadingDirection(null);
            return;
        }

        try {
            if (isOnChainMarket && marketAddress) {
                const amountBigInt = parseUnits(tradeAmount, 6); // USDC 6 decimals
                const maxUint256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

                // 1. Approve (Infinite) if needed
                if (!allowance || allowance < amountBigInt) {
                    try {
                        await writeContractAsync({
                            address: MOCK_USDC_ADDRESS,
                            abi: erc20Abi,
                            functionName: 'approve',
                            args: [marketAddress, maxUint256],
                            account: address,
                            chain: undefined,
                        });
                    } catch (err) {
                        console.log("Approval failed or rejected");
                        throw err;
                    }
                }

                // 2. Buy
                await writeContractAsync({
                    address: marketAddress,
                    abi: MARKET_ABI,
                    functionName: 'buyExactAmount',
                    args: [direction === TradeDirectionEnum.YES ? 0 : 1, amountBigInt, 0n],
                    account: address,
                    chain: undefined,
                });

                toast.success(`Bought $${tradeAmount} of ${direction}!`);
                queryClient.invalidateQueries({ queryKey: ['readContract'] });
                queryClient.invalidateQueries({ queryKey: ['marketHistory'] });
                setShowTradeUI(false);
                setIsUpdating(true);
                setTimeout(() => setIsUpdating(false), 5000); // Show updating state for 5s
            } else {
                // Mock trade
                await onPlaceTrade(market.id, direction, Number(tradeAmount));
                toast.success(`Bought $${tradeAmount} of ${direction}!`);
                setShowTradeUI(false);
                setIsUpdating(true);
                setTimeout(() => setIsUpdating(false), 2000);
            }
        } catch (error: any) {
            console.error("Trade failed:", error);
            const errorMessage = error.shortMessage || "Transaction rejected";
            toast.error(errorMessage, {
                style: { background: '#ef4444', color: '#fff' }
            });
        } finally {
            setIsTrading(false);
            setLoadingDirection(null);
        }
    };

    return (
        <div
            className={`relative group border-glow rounded-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-glow ${isUpdating ? 'syncing-card' : ''}`}
            onClick={() => onTrade(market)}
        >
            {/* Inner Card Container - Handles content clipping and background */}
            <div className="glass-panel rounded-xl shadow-card overflow-hidden flex flex-col h-full relative z-10 transition-colors duration-300">
                <div className={`absolute inset-0 shimmer-effect transition-opacity duration-500 pointer-events-none ${isUpdating ? 'opacity-100' : 'opacity-0 hover-shine-trigger'}`}></div>

                <div className="relative cursor-pointer overflow-hidden">
                    <img src={market.imageUrl} alt={market.title} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent opacity-90"></div>
                    <CategoryPill category={market.category} />
                    <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-lg font-bold text-white leading-tight shadow-black drop-shadow-md">{market.title}</h3>
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-grow relative z-10">
                    <div className="flex justify-between items-center mb-3 text-xs text-brand-muted font-medium uppercase tracking-wider">
                        <span>Ends {market.endsAt.toLocaleDateString()}</span>
                        {totalLiquidity && (
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                                ${totalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })} Liquidity
                            </span>
                        )}
                    </div>

                    {/* Fast Trade UI */}
                    {!isResolved && (
                        <div className="mt-auto space-y-3" onClick={e => e.stopPropagation()}>
                            {!showTradeUI ? (
                                <div className="grid grid-cols-2 gap-3 relative">
                                    {isUpdating && (
                                        <div className="absolute -top-10 left-0 right-0 flex justify-center animate-fade-in z-20">
                                            <span className="bg-brand-surface/95 text-brand-primary text-xs font-bold px-3 py-1.5 rounded-full border border-brand-primary/50 flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] backdrop-blur-md animate-pulse-glow">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-primary"></span>
                                                </span>
                                                Syncing prices...
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowTradeUI(true);
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl bg-brand-yes/10 border-2 border-brand-yes/30 hover:bg-brand-yes/20 hover:border-brand-yes/60 transition-all group/btn shadow-sm hover:shadow-md ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <span className="text-brand-yes font-extrabold text-lg group-hover/btn:scale-105 transition-transform">Buy YES</span>
                                        <span className="text-xl font-black text-brand-yes drop-shadow-sm tracking-tight">${yesPriceValue.toFixed(2)}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowTradeUI(true);
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl bg-brand-no/10 border-2 border-brand-no/30 hover:bg-brand-no/20 hover:border-brand-no/60 transition-all group/btn shadow-sm hover:shadow-md ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <span className="text-brand-no font-extrabold text-lg group-hover/btn:scale-105 transition-transform">Buy NO</span>
                                        <span className="text-xl font-black text-brand-no drop-shadow-sm tracking-tight">${noPriceValue.toFixed(2)}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-brand-bg/90 rounded-lg p-3 border border-brand-border/50 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-brand-muted font-medium">Fast Trade</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowTradeUI(false); }}
                                            className="text-brand-muted hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between bg-brand-bg rounded p-2 border border-brand-border/30">
                                        <span className="text-brand-muted text-xs">Amount</span>
                                        <div className="flex items-center">
                                            <span className="text-brand-muted text-xs mr-1">$</span>
                                            <input
                                                type="number"
                                                value={tradeAmount}
                                                onChange={(e) => setTradeAmount(e.target.value)}
                                                className="bg-transparent text-right text-white font-bold outline-none w-16 text-sm pr-1"
                                                placeholder="10"
                                                min="1"
                                                max="1000"
                                            />
                                        </div>
                                    </div>

                                    <input
                                        type="range"
                                        min="1"
                                        max="1000"
                                        value={tradeAmount || 0}
                                        onChange={(e) => setTradeAmount(e.target.value)}
                                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    />
                                    <div className="flex justify-between text-[10px] text-brand-muted px-1">
                                        <span>$1</span>
                                        <span>$1000</span>
                                    </div>

                                    {/* Price Impact Display */}
                                    {tradeAmount && Number(tradeAmount) > 0 && (
                                        <div className="flex justify-between items-center text-xs px-1">
                                            <span className="text-brand-muted">Est. Price Impact</span>
                                            <span className="text-brand-warning">
                                                {(() => {
                                                    return "~" + (Number(tradeAmount) / 1000).toFixed(2) + "%"; // Mock impact for now to show UI
                                                })()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button
                                            onClick={(e) => handleFastTrade(e, TradeDirectionEnum.YES)}
                                            disabled={!isConnected || isTrading}
                                            className="py-2 rounded bg-brand-yes text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isTrading && loadingDirection === TradeDirectionEnum.YES ? (
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : "YES"}
                                        </button>
                                        <button
                                            onClick={(e) => handleFastTrade(e, TradeDirectionEnum.NO)}
                                            disabled={!isConnected || isTrading}
                                            className="py-2 rounded bg-brand-no text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isTrading && loadingDirection === TradeDirectionEnum.NO ? (
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : "NO"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {isResolved && <ResolutionBanner outcome={market.outcome} />}
                </div>
            </div>
        </div>
    );
};