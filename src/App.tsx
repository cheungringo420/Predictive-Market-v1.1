import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAccount, useChainId, useWatchContractEvent } from 'wagmi';
import { Header } from './components/Header';
import { MarketList } from './components/MarketList';
import { MarketDetailModal } from './components/MarketDetailModal';
import { CreateMarketModal } from './components/CreateMarketModal';
import { fetchMarkets, placeTrade } from './services/marketService';
import { fetchMarketsFromContract } from './services/contractMarketService';
import { MARKET_FACTORY_ABI as factoryABI, getFactoryAddress } from './services/contracts/contractInfo';
import type { Market, TradeDirection } from './types';

const ONCHAIN_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 45000;

const App: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isCreateMarketOpen, setIsCreateMarketOpen] = useState<boolean>(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const backgroundRequests = useRef(0);

  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const factoryAddress = chainId ? getFactoryAddress(chainId) : null;
  const networkLabel = factoryAddress ? `Chain ID ${chainId}` : 'No supported factory on this network';

  const loadMarkets = useCallback(
    async ({ showLoader = true, delayMs = 0 }: { showLoader?: boolean; delayMs?: number } = {}) => {
      if (showLoader) {
        setIsLoading(true);
        setError(null);
      } else {
        backgroundRequests.current += 1;
        setIsBackgroundRefreshing(true);
      }

      try {
        if (delayMs) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const onChainPromise = chainId
          ? fetchMarketsFromContract(chainId).catch((err) => {
            console.error('Error fetching markets from chain:', err);
            return [] as Market[];
          })
          : Promise.resolve<Market[]>([]);

        const safeOnChainPromise = Promise.race([
          onChainPromise,
          new Promise<Market[]>((resolve) => setTimeout(() => resolve([]), ONCHAIN_TIMEOUT_MS)),
        ]);

        const [onChainMarkets, mockMarkets] = await Promise.all([
          safeOnChainPromise,
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
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error loading markets:', err);
        if (showLoader) {
          setError('Failed to load markets. Please try again later.');
          setMarkets([]);
        }
      } finally {
        if (showLoader) {
          setIsLoading(false);
        } else {
          backgroundRequests.current = Math.max(0, backgroundRequests.current - 1);
          if (backgroundRequests.current === 0) {
            setIsBackgroundRefreshing(false);
          }
        }
      }
    },
    [chainId]
  );

  useEffect(() => {
    loadMarkets({ showLoader: true });
  }, [loadMarkets]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMarkets({ showLoader: false });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMarkets]);

  useWatchContractEvent({
    address: factoryAddress as `0x${string}` | undefined,
    abi: factoryABI,
    eventName: 'MarketCreated',
    onLogs: () => loadMarkets({ showLoader: false, delayMs: 1500 }),
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
    } catch (err) {
      console.error("Trade failed:", err);
      toast.error("There was an error processing your trade.");
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
    <div className="min-h-screen text-brand-light font-sans">
      <Header
        onCreateMarketClick={() => setIsCreateMarketOpen(true)}
        onRefreshMarkets={handleManualRefresh}
        isRefreshing={isLoading || isBackgroundRefreshing}
        lastUpdated={lastUpdated}
        networkLabel={networkLabel}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Prediction Markets</h1>
          <p className="text-lg text-brand-muted mt-2">Trade on the outcome of real-world events.</p>
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
