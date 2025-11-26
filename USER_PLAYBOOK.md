# Predictive Horizon - User Playbook (v1)

Welcome to **Predictive Horizon**, a decentralized prediction market platform on Base Sepolia. This guide explains how to engage with the platform as a Market Creator or a Trader.

## 🚀 Getting Started

### 1. Connect Your Wallet
- Click the **Connect Wallet** button in the top right corner.
- Supported Wallets: MetaMask, Rainbow, Coinbase Wallet, etc.
- **Network**: You must be connected to **Base Sepolia** testnet.

### 2. Get Mock USDC
The platform uses a testnet USDC token for all trades.
- **Token Address**: `0x388FBde0222693293Ab060789E816FfC8e317FeA`
- **How to get tokens**:
    1.  Go to [Base Sepolia Explorer](https://sepolia.basescan.org/address/0x388FBde0222693293Ab060789E816FfC8e317FeA#writeContract).
    2.  Connect your wallet to the explorer.
    3.  Use the `mint` function to send yourself tokens (e.g., `1000000000` for 1000 USDC, as it has 6 decimals).

---

## 🏛️ For Market Creators

Create markets for any future event and earn fees from trading volume.

### Step 1: Create a Market
1.  Click **+ Create Market** in the header.
2.  **Title**: A clear question (e.g., "Will ETH hit $5k by 2025?").
3.  **Description**: Detailed rules for resolution.
4.  **Image URL**: A visual representation of the market.
5.  **End Date**: When trading stops and the market resolves.
6.  **Click "Create Market"** and confirm the transaction.

### Step 2: Add Liquidity (CRITICAL) ⚠️
**New markets start with 0 liquidity and a static price of 50¢.** You MUST add liquidity for trading to work properly.
1.  Click on your newly created market card to open the **Market Details**.
2.  Switch to the **"Add Liquidity"** tab.
3.  Enter an amount of USDC (e.g., 100 USDC).
4.  **Approve** USDC usage and then **Confirm** the transaction.
5.  **Why?** This seeds the Automated Market Maker (AMM) pool. Without this, the price cannot move when people trade.

---

## 📈 For Traders

Predict outcomes and profit from your insights.

### Fast Trade (Quick Action)
Use this for rapid execution directly from the market list.
1.  Locate a market card.
2.  Click **YES** or **NO** to reveal the trading slider.
3.  **Slide** to choose your trade size.
4.  Click the button again to **Confirm**.
    *   *Note: The slider allows quick entry without opening the full details.*

### Detailed Trade (Deep Dive)
Use this for analysis and precise execution.
1.  **Click anywhere** on the market card (except the buttons) to open the **Detail Modal**.
2.  **Analyze**:
    *   **Price Chart**: View price trends over time.
    *   **Liquidity**: See how deep the pool is (deeper pools = less slippage).
3.  **Trade**:
    *   Select **Buy YES** or **Buy NO**.
    *   Enter the exact **USDC Amount**.
    *   Review **Est. Shares** and **Price Impact**.
    *   Click **Confirm Trade**.

### Understanding Pricing
- **Price Range**: 0¢ to 100¢.
- **Meaning**: A price of 60¢ means the market believes there is a 60% chance of "YES".
- **Payout**: If the outcome is YES, each YES share pays out $1.00. If NO, it pays $0.00.

---

## 🛠️ Technical Info

- **Network**: Base Sepolia (Chain ID: 84532)
- **Market Factory**: `0xffce02Dcb86Db2E20866d99c0dfd7e2405D3Bce6`
- **Mock USDC**: `0x388FBde0222693293Ab060789E816FfC8e317FeA`
