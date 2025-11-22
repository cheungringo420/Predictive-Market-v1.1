// components/SmartContractTrade.tsx
// Component for trading using Uniswap V2 Router

import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { toast } from 'react-hot-toast';
import {
  uniswapV2RouterAddress,
  uniswapV2RouterABI,
  mockUSDCABI,
  getMockUSDCAddress,
} from '../services/contracts/contractInfo';
import { usePriceData } from '../hooks/usePriceData';

const MAX_ALLOWANCE = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

interface SmartContractTradeProps {
  marketAddress: `0x${string}`;
  onTradeSuccess?: () => void;
}

export const SmartContractTrade: React.FC<SmartContractTradeProps> = ({ marketAddress, onTradeSuccess }) => {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const currentMockUSDCAddress = getMockUSDCAddress(chainId);
  const [amountIn, setAmountIn] = useState('');
  const [direction, setDirection] = useState<'YES' | 'NO'>('YES');
  const [txType, setTxType] = useState<'approve' | 'swap' | null>(null);

  // Get prices from AMM
  const { priceYes, priceNo } = usePriceData(marketAddress);
  const currentPrice = direction === 'YES' ? priceYes : priceNo;

  // We need to get token addresses from the market contract
  // For now, we'll need to add this to marketABI or fetch separately
  // This is a simplified version - you may need to fetch yesToken/noToken addresses

  const amountInWei = amountIn ? parseUnits(amountIn, 6) : BigInt(0);

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: currentMockUSDCAddress as `0x${string}` | undefined,
    abi: mockUSDCABI,
    functionName: 'allowance',
    args: userAddress && uniswapV2RouterAddress ? [userAddress, uniswapV2RouterAddress] : undefined,
    query: {
      enabled: !!userAddress && !!currentMockUSDCAddress,
      watch: true,
    },
  });

  const needsApproval = amountInWei > 0 && allowance !== undefined && allowance < amountInWei;

  // Approve
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
    isError: isApproveError,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
    });

  // Swap
  const {
    writeContract: writeSwap,
    data: swapTxHash,
    isPending: isSwapPending,
    isError: isSwapError,
  } = useWriteContract();

  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({
    hash: swapTxHash,
  });

  const handleApprove = () => {
    if (!userAddress || !currentMockUSDCAddress) {
      toast.error('Please connect wallet');
      return;
    }
    setTxType('approve');
    writeApprove({
      address: currentMockUSDCAddress as `0x${string}`,
      abi: mockUSDCABI,
      functionName: 'approve',
      args: [uniswapV2RouterAddress, MAX_ALLOWANCE],
    });
  };

  const handleSwap = () => {
    // Note: This is a simplified version. You'll need to fetch yesToken/noToken addresses
    // from the market contract to complete this function
    toast.error('Token addresses not yet implemented. Please use the full trading interface.');
  };

  // Handle approve status
  useEffect(() => {
    if (txType === 'approve') {
      if (isApprovePending) {
        toast.loading('Waiting for wallet approval...', { id: 'approve-tx' });
      } else if (isApproveConfirming) {
        toast.loading('Submitting approval...', { id: 'approve-tx' });
      } else if (isApproveConfirmed) {
        toast.success('✅ Approval successful!', { id: 'approve-tx' });
        setTxType(null);
        refetchAllowance();
      } else if (isApproveError) {
        toast.error('❌ Approval failed', { id: 'approve-tx' });
        setTxType(null);
      }
    }
  }, [isApprovePending, isApproveConfirming, isApproveConfirmed, isApproveError, txType, refetchAllowance]);

  // Handle swap status
  useEffect(() => {
    if (txType === 'swap') {
      if (isSwapPending) {
        toast.loading('Waiting for wallet approval...', { id: 'swap-tx' });
      } else if (isSwapConfirming) {
        toast.loading('Submitting trade...', { id: 'swap-tx' });
      } else if (isSwapConfirmed) {
        toast.success(`✅ Trade successful! ${amountIn} mUSDC swapped`, { id: 'swap-tx' });
        setTxType(null);
        setAmountIn('');
        queryClient.invalidateQueries();
        if (onTradeSuccess) onTradeSuccess();
      } else if (isSwapError) {
        toast.error('❌ Trade failed', { id: 'swap-tx' });
        setTxType(null);
      }
    }
  }, [
    isSwapPending,
    isSwapConfirming,
    isSwapConfirmed,
    isSwapError,
    txType,
    amountIn,
    queryClient,
    onTradeSuccess,
  ]);

  return (
    <div className="bg-brand-bg p-6 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-4 text-center">Place Your Trade</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setDirection('YES')}
          className={`py-3 rounded-lg font-bold text-lg transition-colors ${
            direction === 'YES'
              ? 'bg-brand-yes text-white'
              : 'bg-brand-border hover:bg-brand-yes/20'
          }`}
        >
          Buy YES ({priceYes !== null ? `${priceYes.toFixed(2)}¢` : '...'})
        </button>
        <button
          onClick={() => setDirection('NO')}
          className={`py-3 rounded-lg font-bold text-lg transition-colors ${
            direction === 'NO'
              ? 'bg-brand-no text-white'
              : 'bg-brand-border hover:bg-brand-no/20'
          }`}
        >
          Buy NO ({priceNo !== null ? `${priceNo.toFixed(2)}¢` : '...'})
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-brand-light mb-1">
          mUSDC Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-brand-primary focus:border-brand-primary"
          placeholder="e.g., 100"
        />
      </div>

      {needsApproval && (
        <button
          onClick={handleApprove}
          disabled={isApprovePending || isApproveConfirming || !userAddress}
          className="w-full mb-3 py-3 bg-brand-secondary text-white font-bold rounded-lg hover:bg-brand-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isApprovePending || isApproveConfirming ? 'Processing...' : '1️⃣ Approve mUSDC'}
        </button>
      )}

      <button
        onClick={handleSwap}
        disabled={
          !userAddress ||
          needsApproval ||
          amountInWei === BigInt(0) ||
          isSwapPending ||
          isSwapConfirming ||
          currentPrice === null
        }
        className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isSwapPending || isSwapConfirming
          ? 'Processing...'
          : `Buy ${direction} (${currentPrice !== null ? currentPrice.toFixed(2) : '...'}¢)`}
      </button>
    </div>
  );
};

