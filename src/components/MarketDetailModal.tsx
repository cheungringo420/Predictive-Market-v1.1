import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import type { Market, TradeDirection } from '../types';
import { TradeDirection as TradeDirectionEnum } from '../types';
import { usePriceData } from '../hooks/usePriceData';
import { useMarketHistory } from '../hooks/useMarketHistory';
import { PriceHistoryChart } from './PriceHistoryChart';
import { useChainId, useAccount, useWriteContract, useReadContract } from 'wagmi';
import { MARKET_ABI, MOCK_USDC_ADDRESS } from '../services/contracts/contractInfo';
import { erc20Abi, parseUnits } from 'viem';

interface MarketDetailModalProps {
    market: Market | null;
    onClose: () => void;
    isConnected: boolean;
    onPlaceTrade: (marketId: string, direction: TradeDirection, amount: number) => Promise<void>;
}

const CloseIcon: React.FC<{ className: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const MarketDetailModal: React.FC<MarketDetailModalProps> = ({ market, onClose, isConnected, onPlaceTrade }) => {
    const [direction, setDirection] = useState<TradeDirectionEnum>(TradeDirectionEnum.YES);
    const [amount, setAmount] = useState<string>('100');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // New State for Liquidity Tab
    const [activeTab, setActiveTab] = useState<'trade' | 'liquidity'>('trade');
    const [liquidityAmount, setLiquidityAmount] = useState<string>('100');

    const chainId = useChainId();
    const { address: userAddress } = useAccount();
    const queryClient = useQueryClient();
    const isOnChainMarket = !!(market?.id && market.id.toLowerCase().startsWith('0x') && market.id.length === 42);
    const marketAddress = isOnChainMarket ? (market?.id as `0x${string}`) : undefined;

    // Wagmi hooks for writing
    const { writeContractAsync } = useWriteContract();

    // Check Allowance
    const { data: allowance } = useReadContract({
        address: MOCK_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: userAddress && marketAddress ? [userAddress, marketAddress] : undefined,
        query: { enabled: !!userAddress && !!marketAddress },
    });

    const { priceYes: liveYesPrice, priceNo: liveNoPrice, yesLiquidityUSD, noLiquidityUSD } = usePriceData(marketAddress);

    // Fetch Historical Data
    const { history, isLoading: isHistoryLoading } = useMarketHistory(marketAddress);

    const yesPriceValue = market ? (typeof liveYesPrice === 'number' ? liveYesPrice : market.yesPrice) : 50;
    const noPriceValue = market ? (typeof liveNoPrice === 'number' ? liveNoPrice : 100 - yesPriceValue) : 50;
    const totalLiquidityUSD = typeof yesLiquidityUSD === 'number' || typeof noLiquidityUSD === 'number'
        ? (yesLiquidityUSD ?? 0) + (noLiquidityUSD ?? 0)
        : null;
    const explorerBase = chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://basescan.org';
    const getExplorerUrl = (address: string) => `${explorerBase}/address/${address}`;

    useEffect(() => {
        if (market) {
            setDirection(TradeDirectionEnum.YES);
            setAmount('100');
            setIsSuccess(false);
            setActiveTab('trade');
        }
    }, [market]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && market) {
                onClose();
            }
        };

        if (market) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [market, onClose]);

    const tradeDetails = useMemo(() => {
        if (!market || !amount || parseFloat(amount) <= 0) {
            return { cost: '0.00', fee: '0.00', totalCost: '0.00', potentialPayout: '0.00' };
        }
        const activePrice = direction === TradeDirectionEnum.YES ? yesPriceValue : noPriceValue;

        // Input 'amount' is USDC.
        const totalCost = parseFloat(amount);

        // Fee is deducted from the investment
        const fee = totalCost * (market.feeBps / 10000);
        const investmentAfterFee = totalCost - fee;

        // Shares = Investment / Price
        // Price is in cents (e.g. 50), so divide by 100 to get dollar price (0.50)
        const priceInDollars = activePrice / 100;
        const potentialPayout = priceInDollars > 0 ? investmentAfterFee / priceInDollars : 0;

        return {
            cost: investmentAfterFee.toFixed(2),
            fee: fee.toFixed(2),
            totalCost: totalCost.toFixed(2),
            potentialPayout: potentialPayout.toFixed(2)
        };
    }, [amount, direction, market, yesPriceValue, noPriceValue]);

    if (!market) return null;

    const handleSubmitTrade = async () => {
        if (!isConnected || !market) {
            toast.error("Please connect your wallet to submit a trade.");
            return;
        }
        setIsSubmitting(true);
        try {
            if (isOnChainMarket && marketAddress) {
                const amountBigInt = parseUnits(amount, 6); // USDC has 6 decimals
                const maxUint256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

                // 1. Approve if needed
                if (!allowance || allowance < amountBigInt) {
                    setIsApproving(true);
                    toast.loading("Approving USDC (Unlimited)...", { id: 'approve' });
                    try {
                        await writeContractAsync({
                            address: MOCK_USDC_ADDRESS,
                            abi: erc20Abi,
                            functionName: 'approve',
                            args: [marketAddress, maxUint256], // Infinite approval
                        } as any);

                        toast.success("Approval submitted! You can now confirm the trade.", { id: 'approve' });
                    } catch (err) {
                        console.error("Approval failed", err);
                        toast.error("Approval failed");
                        setIsApproving(false);
                        return;
                    } finally {
                        setIsApproving(false);
                    }
                }

                // 2. Buy
                toast.loading("Submitting trade...", { id: 'trade' });
                await writeContractAsync({
                    address: marketAddress,
                    abi: MARKET_ABI,
                    functionName: 'buyExactAmount',
                    args: [direction === TradeDirectionEnum.YES ? 0 : 1, amountBigInt, 0n], // 0 minOutcomeTokens for now (no slippage protection)
                } as any);

                toast.success("Trade submitted!", { id: 'trade' });

                // Refresh Data
                queryClient.invalidateQueries({ queryKey: ['readContract'] });
                queryClient.invalidateQueries({ queryKey: ['marketHistory'] });

                // Show Success State
                setIsSuccess(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#10b981', '#3b82f6', '#f59e0b']
                });
            } else {
                // Mock trade
                await onPlaceTrade(market.id, direction, parseFloat(amount));
                queryClient.invalidateQueries({ queryKey: ['readContract'] });
                setIsSuccess(true);
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (e: any) {
            console.error("Trade failed:", e);
            const errorMessage = e.shortMessage || "Transaction rejected";
            toast.error(errorMessage, {
                style: { background: '#ef4444', color: '#fff' }
            });
        } finally {
            setIsSubmitting(false);
            setIsApproving(false);
        }
    };

    const handleAddLiquidity = async () => {
        if (!isConnected || !market) {
            toast.error("Please connect your wallet.");
            return;
        }
        setIsSubmitting(true);
        try {
            if (isOnChainMarket && marketAddress) {
                const amountBigInt = parseUnits(liquidityAmount, 6);
                const maxUint256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

                // 1. Approve
                if (!allowance || allowance < amountBigInt) {
                    setIsApproving(true);
                    toast.loading("Approving USDC...", { id: 'approve' });
                    try {
                        await writeContractAsync({
                            address: MOCK_USDC_ADDRESS,
                            abi: erc20Abi,
                            functionName: 'approve',
                            args: [marketAddress, maxUint256],
                        } as any);
                        toast.success("Approval submitted!");
                    } catch (err) {
                        console.error("Approval failed", err);
                        toast.error("Approval failed");
                        setIsApproving(false);
                        return;
                    } finally {
                        setIsApproving(false);
                    }
                }

                // 2. Add Liquidity
                toast.loading("Adding liquidity...", { id: 'liquidity' });
                await writeContractAsync({
                    address: marketAddress,
                    abi: MARKET_ABI,
                    functionName: 'addLiquidity',
                    args: [amountBigInt],
                } as any);

                toast.success("Liquidity added!");
                queryClient.invalidateQueries({ queryKey: ['readContract'] });
                setIsSuccess(true);
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (e: any) {
            console.error("Liquidity failed:", e);
            toast.error(e.shortMessage || "Transaction rejected");
        } finally {
            setIsSubmitting(false);
            setIsApproving(false);
        }
    };

    const isYes = direction === TradeDirectionEnum.YES;
    const price = isYes ? yesPriceValue : noPriceValue;
    const totalLiquidity = market.poolYes + market.poolNo;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="glass-panel border-brand-border/50 rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="sticky top-4 right-4 z-10 float-right text-brand-muted hover:text-white bg-black/20 rounded-full p-1 backdrop-blur-md transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="relative h-64 w-full">
                    <img src={market.imageUrl} alt={market.title} className="w-full h-full object-cover rounded-t-xl" />
                </div>

                <div className="p-6 relative z-10 bg-brand-bg">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">{market.title}</h2>
                    <div className="h-px w-full bg-brand-border/30 mb-4"></div>
                    <p className="text-brand-secondary mb-8 text-lg leading-relaxed">{market.description}</p>

                    <div className="bg-brand-surface/50 border border-brand-border/30 p-6 rounded-xl mb-8 backdrop-blur-sm">
                        <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-4">Price History ({isYes ? 'YES' : 'NO'})</h3>
                        <PriceHistoryChart
                            data={isYes ? history : history.map(p => ({ ...p, noPrice: 100 - p.yesPrice }))}
                            isLoading={isHistoryLoading}
                            color={isYes ? '#10B981' : '#EF4444'}
                            dataKey={isYes ? 'yesPrice' : 'noPrice'}
                        />
                    </div>

                    {isOnChainMarket && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-brand-surface/30 border border-brand-border/30 rounded-xl p-5 space-y-3 col-span-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-brand-muted text-sm">Total Liquidity</span>
                                    <span className="text-white font-mono font-semibold">{totalLiquidityUSD ? `$${totalLiquidityUSD.toLocaleString()}` : '—'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-brand-muted text-sm">Pool Address</span>
                                    <a href={getExplorerUrl(marketAddress!)} target="_blank" rel="noreferrer" className="text-brand-primary hover:text-brand-primary-hover text-xs font-mono underline decoration-dotted">
                                        {marketAddress?.slice(0, 6)}...{marketAddress?.slice(-4)}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Transaction Successful!</h3>
                            <p className="text-brand-muted text-center mb-8 max-w-xs">
                                Your transaction has been successfully processed.
                            </p>
                            <div className="flex gap-4 w-full px-6">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-brand-surface border border-brand-border text-white font-semibold rounded-xl hover:bg-brand-surface-highlight transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => setIsSuccess(false)}
                                    className="flex-1 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-glow"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-brand-surface border border-brand-border/50 p-6 rounded-xl shadow-inner">
                            {/* Tabs */}
                            <div className="flex border-b border-brand-border/30 mb-6">
                                <button
                                    className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'trade' ? 'border-brand-primary text-white' : 'border-transparent text-brand-muted hover:text-white'}`}
                                    onClick={() => setActiveTab('trade')}
                                >
                                    Trade
                                </button>
                                <button
                                    className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'liquidity' ? 'border-brand-primary text-white' : 'border-transparent text-brand-muted hover:text-white'}`}
                                    onClick={() => setActiveTab('liquidity')}
                                >
                                    Add Liquidity
                                </button>
                            </div>

                            {activeTab === 'trade' ? (
                                <>
                                    <div className="flex p-1 bg-brand-bg rounded-xl mb-6 border border-brand-border/50 gap-2">
                                        <button
                                            onClick={() => setDirection(TradeDirectionEnum.YES)}
                                            className={`flex-1 py-4 rounded-lg font-extrabold text-xl transition-all duration-200 border-2 ${isYes ? 'bg-brand-yes text-white border-brand-yes shadow-lg scale-[1.02]' : 'bg-transparent text-brand-muted border-transparent hover:bg-brand-yes/10 hover:text-brand-yes hover:border-brand-yes/30'}`}
                                        >
                                            Buy YES
                                        </button>
                                        <button
                                            onClick={() => setDirection(TradeDirectionEnum.NO)}
                                            className={`flex-1 py-4 rounded-lg font-extrabold text-xl transition-all duration-200 border-2 ${!isYes ? 'bg-brand-no text-white border-brand-no shadow-lg scale-[1.02]' : 'bg-transparent text-brand-muted border-transparent hover:bg-brand-no/10 hover:text-brand-no hover:border-brand-no/30'}`}
                                        >
                                            Buy NO
                                        </button>
                                    </div>

                                    <div className="mb-6">
                                        <div className="relative mb-3">
                                            <label htmlFor="amount" className="absolute -top-2.5 left-3 bg-brand-surface px-1 text-xs font-medium text-brand-primary">Amount (USDC)</label>
                                            <input
                                                type="number"
                                                id="amount"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-transparent border border-brand-border rounded-lg px-4 py-3 pr-16 text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all font-mono text-2xl font-bold"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-4 top-3.5 text-brand-muted text-sm font-mono">USDC</div>
                                        </div>

                                        {/* Slider */}
                                        <div className="px-1">
                                            <input
                                                type="range"
                                                min="1"
                                                max="1000"
                                                value={amount || 0}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary hover:accent-brand-primary-hover"
                                            />
                                            <div className="flex justify-between text-xs text-brand-muted font-mono mt-1">
                                                <span>$1</span>
                                                <span>$1000</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm mb-6 px-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-brand-muted">Price per share</span>
                                            <span className={`font-mono text-3xl font-black tracking-tight drop-shadow-sm ${isYes ? 'text-brand-yes' : 'text-brand-no'}`}>${price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-brand-muted">Est. Shares</span>
                                            <span className="text-white font-mono">{tradeDetails.potentialPayout}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-brand-muted">Est. Price Impact</span>
                                            <span className="text-brand-warning">
                                                {(() => {
                                                    if (!amount || parseFloat(amount) <= 0) return "0.00%";
                                                    if (totalLiquidityUSD && totalLiquidityUSD > 0) {
                                                        const impact = (parseFloat(amount) / totalLiquidityUSD) * 100;
                                                        return `~${impact.toFixed(2)}%`;
                                                    }
                                                    return "—";
                                                })()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-brand-border/30 pt-3 mt-3">
                                            <span className="text-brand-light font-bold">Total Cost</span>
                                            <span className="text-white font-mono font-bold">{tradeDetails.totalCost} USDC</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmitTrade}
                                        disabled={!isConnected || isSubmitting || !amount || parseFloat(amount) <= 0}
                                        className={`w-full py-4 font-bold rounded-xl transition-all duration-200 shadow-lg ${!isConnected || isSubmitting || !amount || parseFloat(amount) <= 0
                                            ? 'bg-brand-surface-highlight text-brand-muted cursor-not-allowed'
                                            : 'bg-brand-primary hover:bg-brand-primary-hover text-white hover:shadow-glow transform hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {isApproving ? 'Approving...' : 'Processing...'}
                                            </span>
                                        ) : (isConnected ? (isApproving ? 'Waiting for Approval...' : 'Confirm Trade') : 'Connect Wallet to Trade')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <p className="text-sm text-brand-muted mb-4">
                                            Add liquidity to earn fees from trading volume. You will provide equal amounts of YES and NO tokens (minted from USDC).
                                        </p>
                                        <div className="relative">
                                            <label htmlFor="liquidityAmount" className="absolute -top-2.5 left-3 bg-brand-surface px-1 text-xs font-medium text-brand-primary">Amount (USDC)</label>
                                            <input
                                                type="number"
                                                id="liquidityAmount"
                                                value={liquidityAmount}
                                                onChange={(e) => setLiquidityAmount(e.target.value)}
                                                className="w-full bg-transparent border border-brand-border rounded-lg px-4 py-3 pr-16 text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all font-mono text-lg"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-4 top-3.5 text-brand-muted text-sm font-mono">USDC</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddLiquidity}
                                        disabled={!isConnected || isSubmitting || !liquidityAmount || parseFloat(liquidityAmount) <= 0}
                                        className={`w-full py-4 font-bold rounded-xl transition-all duration-200 shadow-lg ${!isConnected || isSubmitting || !liquidityAmount || parseFloat(liquidityAmount) <= 0
                                            ? 'bg-brand-surface-highlight text-brand-muted cursor-not-allowed'
                                            : 'bg-brand-secondary hover:bg-brand-secondary-hover text-white hover:shadow-glow transform hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {isApproving ? 'Approving...' : 'Adding Liquidity...'}
                                            </span>
                                        ) : (isConnected ? (isApproving ? 'Waiting for Approval...' : 'Add Liquidity') : 'Connect Wallet')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
};