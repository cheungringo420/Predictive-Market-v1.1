import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, sepolia, arbitrumSepolia, polygonAmoy } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Predictive Horizon',
  projectId: '6fbcb32d284de172a63eaff867c02814',
  chains: [baseSepolia, sepolia, arbitrumSepolia, polygonAmoy],
});
