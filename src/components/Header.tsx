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
    <header className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border/50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-2">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
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
            <div className="bg-brand-surface border border-brand-border rounded-lg p-2 transition-all duration-300 group-hover:border-brand-primary group-hover:shadow-glow">
              <svg className="w-6 h-6 text-brand-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight group-hover:text-brand-primary transition-colors">Predictive Horizon</span>
          </div>

          <div className="flex items-center gap-3">
            {onRefreshMarkets && (
              <button
                onClick={onRefreshMarkets}
                disabled={isRefreshing}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-brand-surface border border-brand-border text-brand-muted rounded-lg hover:text-white hover:border-brand-primary transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Markets"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing' : 'Refresh'}
              </button>
            )}

            {isConnected && onCreateMarketClick && (
              <button
                onClick={onCreateMarketClick}
                className="hidden md:block px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover hover:shadow-glow transition-all text-sm transform hover:-translate-y-0.5"
              >
                + Create Market
              </button>
            )}

            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] md:text-xs text-brand-muted font-mono border-t border-brand-border/30 pt-2 mt-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${networkLabel?.includes('No supported') ? 'bg-brand-no' : 'bg-brand-yes animate-pulse'}`}></span>
            <span>{networkLabel || 'Network status unavailable'}</span>
          </div>
          {lastUpdated && (
            <span className="opacity-70">Updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </header>
  );
};