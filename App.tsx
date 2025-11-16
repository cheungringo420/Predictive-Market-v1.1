import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useWatchContractEvent } from 'wagmi';
import { Header } from './components/Header';
import { MarketList } from './components/MarketList';
import { MarketDetailModal } from './components/MarketDetailModal';
import { CreateMarketModal } from './components/CreateMarketModal';
import { fetchMarkets, placeTrade } from './services/marketService';
import { fetchMarketsFromContract } from './services/contractMarketService';
import { factoryABI, getFactoryAddress } from './services/contracts/contractInfo';
import type { Market, TradeDirection } from './types';

const App: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isCreateMarketOpen, setIsCreateMarketOpen] = useState<boolean>(false);

  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const factoryAddress = chainId ? getFactoryAddress(chainId) : null;

  const loadMarkets = useCallback(
    async ({ showLoader = true, delayMs = 0 }: { showLoader?: boolean; delayMs?: number } = {}) => {
      if (showLoader) setIsLoading(true);
      setError(null);

      try {
        if (delayMs) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const [onChainMarkets, mockMarkets] = await Promise.all([
          chainId ? fetchMarketsFromContract(chainId) : Promise.resolve<Market[]>([]),
          fetchMarkets(),
        ]);

        const onChainIds = new Set(onChainMarkets.map((market) => market.id));
        const fallbackMarkets =
          onChainMarkets.length > 0
            ? mockMarkets.filter((mock) => !onChainIds.has(mock.id))
            : mockMarkets;

        const combinedMarkets =
          onChainMarkets.length > 0 ? [...onChainMarkets, ...fallbackMarkets] : fallbackMarkets;

        setMarkets(combinedMarkets);
      } catch (err) {
        console.error('Error loading markets:', err);
        setError('Failed to load markets. Please try again later.');
        if (showLoader) {
          setMarkets([]);
        }
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [chainId]
  );

  useEffect(() => {
    loadMarkets({ showLoader: true });
  }, [loadMarkets]);

  useWatchContractEvent({
    address: factoryAddress as `0x${string}` | undefined,
    abi: factoryABI,
    eventName: 'MarketCreated',
    listener: () => loadMarkets({ showLoader: false, delayMs: 1500 }),
    enabled: !!factoryAddress,
  });

  const handleOpenMarketModal = (market: Market) => {
    setSelectedMarket(market);
  };

  const handleCloseMarketModal = () => {
    setSelectedMarket(null);
  };

  const handlePlaceTrade = async (marketId: string, direction: TradeDirection, amount: number) => {
    try {
        const updatedMarket = await placeTrade(marketId, direction, amount);
        setMarkets(prevMarkets => 
            prevMarkets.map(m => m.id === marketId ? updatedMarket : m)
        );
        if (selectedMarket?.id === marketId) {
            setSelectedMarket(updatedMarket);
        }
    } catch(err) {
        console.error("Trade failed:", err);
        alert("There was an error processing your trade.");
        throw err;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-brand-light mt-16">Loading markets...</div>;
    }
    if (error) {
      return <div className="text-center text-brand-no mt-16">{error}</div>;
    }
    return <MarketList markets={markets} onTrade={handleOpenMarketModal} onPlaceTrade={handlePlaceTrade} isConnected={isConnected} />;
  };

  const handleMarketCreated = () => {
    loadMarkets({ showLoader: false, delayMs: 1500 });
  };

  const handleManualRefresh = () => {
    loadMarkets({ showLoader: true });
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-light font-sans">
      <Header onCreateMarketClick={() => setIsCreateMarketOpen(true)} />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Prediction Markets</h1>
            <p className="text-lg text-brand-muted mt-2">Trade on the outcome of real-world events.</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="text-sm text-brand-muted">
            Network:{' '}
            <span className="text-white font-semibold">
              {factoryAddress ? `Chain ID ${chainId}` : 'No supported factory on this network'}
            </span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-border text-white rounded-lg hover:bg-brand-border/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Markets'}
          </button>
        </div>
        {renderContent()}
      </main>
      <MarketDetailModal
        market={selectedMarket} 
        onClose={handleCloseMarketModal}
        isConnected={isConnected}
        onPlaceTrade={handlePlaceTrade}
      />
      <CreateMarketModal
        isOpen={isCreateMarketOpen}
        onClose={() => setIsCreateMarketOpen(false)}
        onMarketCreated={handleMarketCreated}
      />
       <footer className="text-center py-6 border-t border-brand-border mt-12">
          <p className="text-brand-muted">Predictive Horizon - Capstone Project Prototype</p>
          <p className="text-xs text-gray-500 mt-1">This is a conceptual prototype. Not for real financial transactions.</p>
       </footer>
    </div>
  );
};

export default App;
