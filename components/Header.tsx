import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface HeaderProps {
  onCreateMarketClick?: () => void;
  onRefreshMarkets?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
  networkLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({ onCreateMarketClick, onRefreshMarkets, isRefreshing, lastUpdated, networkLabel }) => {
  const { isConnected } = useAccount();

  const handleLogoClick = () => {
    // Refresh the page to go to main page
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-surface/80 backdrop-blur-md border-b border-brand-border">
      <div className="container mx-auto px-4 py-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoClick();
              }
            }}
            aria-label="Go to home page"
          >
            <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
            </svg>
            <span className="text-xl font-bold text-white">Predictive Horizon</span>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshMarkets && (
              <button
                onClick={onRefreshMarkets}
                disabled={isRefreshing}
                className="px-3 py-2 bg-brand-border text-white rounded-lg hover:bg-brand-border/80 transition-colors text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
            {isConnected && onCreateMarketClick && (
              <button
                onClick={onCreateMarketClick}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-secondary transition-colors text-sm"
              >
                + Create Market
              </button>
            )}
            <ConnectButton />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-xs text-brand-muted">
          <span>{networkLabel || 'Network status unavailable'}</span>
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </header>
  );
};