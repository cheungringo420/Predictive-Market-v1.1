import React, { useState, useEffect, useRef } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getFactoryAddress, factoryABI } from '../services/contracts/contractInfo';
import { validateMarketParams, formatMarketQuestion, type CreateMarketParams } from '../services/createMarketService';
import { MarketCategory } from '../types';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarketCreated?: (marketAddress?: string) => void;
}

const CloseIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({ isOpen, onClose, onMarketCreated }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MarketCategory>(MarketCategory.CRYPTO);
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const factoryAddress = getFactoryAddress(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuestion('');
      setDescription('');
      setCategory(MarketCategory.CRYPTO);
      setEndDate('');
      setImageUrl('');
    }
  }, [isOpen]);

  // Handle transaction success - use ref to prevent multiple calls
  const hasCalledCallback = useRef(false);
  
  useEffect(() => {
    if (isConfirmed && hash && !hasCalledCallback.current) {
      hasCalledCallback.current = true;
      
      toast.success('✅ Market created successfully!', {
        duration: 3000,
        style: { background: '#10b981', color: '#fff' },
        id: 'market-created-success' // Use unique ID to prevent duplicates
      });
      
      // Invalidate queries to refresh market list
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      
      // Call callback if provided (only once)
      if (onMarketCreated) {
        onMarketCreated(hash);
      }
      
      // Close modal immediately after showing success
      // Don't wait for market list refresh
      setTimeout(() => {
        onClose();
        // Reset the ref after modal closes
        setTimeout(() => {
          hasCalledCallback.current = false;
        }, 1000);
      }, 500); // Reduced delay to close faster
    }
  }, [isConfirmed, hash, onClose, onMarketCreated, queryClient]);

  // Handle transaction errors
  useEffect(() => {
    if (error) {
      toast.error(`❌ ${error.shortMessage || error.message}`, {
        duration: 4000,
        style: { background: '#ef4444', color: '#fff' }
      });
    }
  }, [error]);

  // Show loading toast
  useEffect(() => {
    if (isPending) {
      toast.loading('Waiting for wallet approval...', { id: 'create-market' });
    } else if (isConfirming) {
      toast.loading('Creating market on blockchain...', { id: 'create-market' });
    } else {
      toast.dismiss('create-market');
    }
  }, [isPending, isConfirming]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending && !isConfirming) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isPending, isConfirming, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first', {
        duration: 3000,
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    if (!factoryAddress) {
      toast.error('MarketFactory not deployed on this network', {
        duration: 3000,
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    const params: CreateMarketParams = {
      question: question.trim(),
      description: description.trim() || undefined,
      category,
      endDate: endDate ? new Date(endDate) : undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    const validation = validateMarketParams(params);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid market parameters', {
        duration: 3000,
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Format question for blockchain (combine question and description)
    const marketQuestion = formatMarketQuestion(params);

    // Call smart contract
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: factoryABI,
      functionName: 'createMarket',
      args: [marketQuestion],
    });
  };

  if (!isOpen) return null;

  const isSubmitting = isPending || isConfirming;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 z-10 text-brand-muted hover:text-white transition-colors disabled:opacity-50"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-brand-border">
          <h2 className="text-2xl font-bold text-white">Create New Market</h2>
          <p className="text-sm text-brand-muted mt-1">Create a prediction market for any real-world event</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Network Warning */}
          {!factoryAddress && (
            <div className="bg-brand-no/20 border border-brand-no rounded-lg p-4">
              <p className="text-brand-no text-sm">
              ⚠️ MarketFactory not deployed on this network. Please switch to Base Sepolia.
              </p>
            </div>
          )}

          {/* Wallet Warning */}
          {!isConnected && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-500 text-sm">
              ⚠️ Please connect your wallet to create a market.
              </p>
            </div>
          )}

          {/* Question */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-brand-light mb-2">
              Market Question <span className="text-brand-no">*</span>
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will the S&P 500 close above 5,500 by end of Q4 2024?"
              className="w-full bg-brand-bg border border-brand-border rounded-md px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
              required
              maxLength={200}
              disabled={isSubmitting}
            />
            <p className="text-xs text-brand-muted mt-1">{question.length}/200 characters</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-brand-light mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context about how this market will be resolved..."
              rows={4}
              className="w-full bg-brand-bg border border-brand-border rounded-md px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-brand-light mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as MarketCategory)}
              className="w-full bg-brand-bg border border-brand-border rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
              disabled={isSubmitting}
            >
              {Object.values(MarketCategory).map((cat) => (
                <option key={cat} value={cat} className="bg-brand-surface">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-brand-light mb-2">
              End Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-brand-bg border border-brand-border rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-brand-muted mt-1">When should this market resolve?</p>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-brand-light mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-brand-bg border border-brand-border rounded-md px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-brand-border text-white font-semibold rounded-lg hover:bg-brand-border/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConnected || !factoryAddress || isSubmitting || !question.trim()}
              className="flex-1 px-4 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Market'}
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-brand-muted text-center pt-2">
            Creating a market requires a blockchain transaction. Gas fees apply.
          </p>
        </form>
      </div>
    </div>
  );
};

