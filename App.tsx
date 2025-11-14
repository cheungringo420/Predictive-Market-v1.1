import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './components/Header';
import { MarketList } from './components/MarketList';
import { MarketDetailModal } from './components/MarketDetailModal';
import { CreateMarketModal } from './components/CreateMarketModal';
import { fetchMarkets, placeTrade } from './services/marketService';
import type { Market, TradeDirection } from './types';

const App: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isCreateMarketOpen, setIsCreateMarketOpen] = useState<boolean>(false);
  
  // Use Wagmi's useAccount hook for wallet connection
  const { address: walletAddress, isConnected } = useAccount();

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setIsLoading(true);
        const marketsData = await fetchMarkets();
        setMarkets(marketsData);
      } catch (err) {
        setError('Failed to load markets. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarkets();
  }, []);

  const handleOpenMarketModal = (market: Market) => {
    setSelectedMarket(market);
  };

  const handleCloseMarketModal = () => {
    setSelectedMarket(null);
  };

  const handlePlaceTrade = async (marketId: string, direction: TradeDirection, amount: number) => {
    try {
        const updatedMarket = await placeTrade(marketId, direction, amount);
        
        // Update the markets list
        setMarkets(prevMarkets => 
            prevMarkets.map(m => m.id === marketId ? updatedMarket : m)
        );
        
        // Update the selected market in the modal to reflect the change instantly
        if (selectedMarket?.id === marketId) {
            setSelectedMarket(updatedMarket);
        }

    } catch(err) {
        console.error("Trade failed:", err);
        alert("There was an error processing your trade.");
        throw err; // Re-throw so the caller can handle its own state
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

  const handleMarketCreated = (marketAddress: string) => {
    // Refresh markets list after market creation
    // Add a delay to allow blockchain to sync
    const loadMarkets = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        
        // Wait a bit for the blockchain to sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const marketsData = await fetchMarkets();
        setMarkets(marketsData);
      } catch (err) {
        console.error('Error loading markets after creation:', err);
        // Don't set error state, just log it
        // The mock data will still show, and the new market will appear when chain syncs
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only refresh if not already loading
    if (!isLoading) {
      loadMarkets();
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-light font-sans">
      <Header onCreateMarketClick={() => setIsCreateMarketOpen(true)} />
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