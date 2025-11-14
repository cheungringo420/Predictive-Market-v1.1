import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header: React.FC = () => {
  const handleLogoClick = () => {
    // Refresh the page to go to main page
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-surface/80 backdrop-blur-md border-b border-brand-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
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
        <ConnectButton />
      </div>
    </header>
  );
};