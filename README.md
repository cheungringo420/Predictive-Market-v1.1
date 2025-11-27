# Predictive Horizon

**Predictive Horizon** is a decentralized prediction market application built on the Base Sepolia testnet. It allows users to create markets, trade positions (YES/NO) on real-world events, and track market outcomes in a transparent and trustless environment.

## 🚀 Features

- **Decentralized Trading**: Trade directly from your wallet using smart contracts.
- **Market Creation**: Create new prediction markets with custom questions and end dates.
- **Dynamic Pricing**: Automated Market Maker (AMM) logic for real-time price adjustments based on supply and demand.
- **Wallet Integration**: Seamless connection with MetaMask and other Web3 wallets via RainbowKit.
- **Responsive Design**: Modern, dark-themed UI optimized for both desktop and mobile.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS (Custom Design System)
- **Web3 Integration**: Wagmi v2, Viem, RainbowKit
- **State Management**: TanStack Query
- **Smart Contracts**: Solidity (Deployed on Base Sepolia)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd predictive-horizon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory (optional, for IPFS support):
   ```env
   VITE_PINATA_JWT=your_pinata_jwt_token
   VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🔗 Smart Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| **MarketFactoryV2** | `0xF3eA8120BEd32a9E5229D832F305BE3335342Cfb` |
| **MockUSDC** | `0xb97D5A8b34b207e6303956E8c5DE4C58ff196421` |

## 🔒 Security

This project is a prototype for educational/demonstration purposes.
- **Contracts**: The smart contracts are currently in a testnet environment.
- **Audit**: This code has **not** been professionally audited. Use at your own risk.
- **Reporting**: If you find a security vulnerability, please refer to [SECURITY.md](SECURITY.md).

## 📄 License

[MIT](LICENSE)
