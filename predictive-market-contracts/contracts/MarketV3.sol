// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OutcomeToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MarketV3 is Ownable, ReentrancyGuard {
    enum TradeDirection { YES, NO }

    string public question;
    string public metadataURI;
    address public resolver;
    IERC20 public collateralToken;
    OutcomeToken public yesToken;
    OutcomeToken public noToken;

    bool public marketResolved;
    bool public outcomeWasYes;

    // AMM State
    uint256 public yesReserves;
    uint256 public noReserves;
    uint256 private constant SCALING_FACTOR = 10 ** 12; // 6 decimals (USDC) -> 18 decimals
    uint256 private constant FEE_BPS = 100; // 1% fee

    event Mint(address indexed user, uint256 amount);
    event Resolve(bool indexed outcome);
    event Redeem(address indexed user, uint256 amount);
    event Trade(address indexed user, TradeDirection direction, uint256 inputAmount, uint256 outputAmount, uint256 price);
    event LiquidityAdded(address indexed user, uint256 amount);

    constructor(
        string memory _question,
        string memory _metadataURI,
        address _creator,
        address _collateralAddress
    ) Ownable(msg.sender) {
        question = _question;
        metadataURI = _metadataURI;
        resolver = _creator;
        collateralToken = IERC20(_collateralAddress);

        yesToken = new OutcomeToken(string.concat("YES-", _question), "YES");
        noToken = new OutcomeToken(string.concat("NO-", _question), "NO");
        yesToken.transferOwnership(address(this));
        noToken.transferOwnership(address(this));
    }

    // --- Core AMM Logic (Constant Product: x * y = k) ---

    function getPrice(TradeDirection direction) public view returns (uint256) {
        if (yesReserves == 0 || noReserves == 0) return 50; // Default 0.50
        
        uint256 numerator = direction == TradeDirection.YES ? noReserves : yesReserves;
        return (numerator * 100) / (yesReserves + noReserves);
    }

    function getQuote(TradeDirection direction, uint256 investmentAmount) public view returns (uint256) {
        if (yesReserves == 0 || noReserves == 0) return 0;

        uint256 investmentAfterFee = investmentAmount * (10000 - FEE_BPS) / 10000;
        uint256 investment18 = investmentAfterFee * SCALING_FACTOR;

        // CPMM Formula: dy = y * dx / (x + dx)
        // x = reserve of token being bought (virtually)
        // y = reserve of other token
        // But here we are depositing collateral to mint BOTH, then keeping one and burning the other?
        // Simplified CPMM for Prediction Markets:
        // We hold Reserves of YES and NO.
        // Buying YES: User pays USDC. We mint YES+NO. We keep NO in pool, give user YES.
        // Effectively: User swaps USDC for YES.
        // k = yesReserves * noReserves
        
        // Let's use the standard "LMSR" or "CPMM with Collateral" approach.
        // Approach: User sends USDC -> Mint Equal YES/NO -> Swap NO for YES in pool -> User gets YES.
        
        uint256 dirReserves = direction == TradeDirection.YES ? yesReserves : noReserves;
        uint256 otherReserves = direction == TradeDirection.YES ? noReserves : yesReserves;

        // Calculate amount of 'other' token to swap out
        // (otherReserves * investment18) / (dirReserves + investment18) ? No.
        
        // Correct Logic:
        // 1. User provides `investment18` worth of collateral.
        // 2. This effectively adds `investment18` to the pool's "invariant" in a way.
        // Let's stick to the simplest CPMM implementation for Prediction Markets:
        // k = yesReserves * noReserves.
        // To buy YES: You deposit USDC. This USDC stays in contract.
        // You get YES tokens.
        // How many? 
        // new_no_reserves = k / (yes_reserves + investment18) ?? No.
        
        // Let's use the "Swap" mental model:
        // 1. Mint `investment18` YES and `investment18` NO.
        // 2. User wants YES.
        // 3. User sells `investment18` NO to the pool for `output` YES.
        // 4. User receives `investment18` YES (minted) + `output` YES (swapped).
        
        // Swap calc: Sell `amountIn` of Token A, get `amountOut` of Token B.
        // amountOut = (amountIn * reserveB) / (reserveA + amountIn)
        
        uint256 amountIn = investment18; // The NO tokens we are selling to pool
        uint256 reserveIn = otherReserves; // Pool has NO tokens
        uint256 reserveOut = dirReserves; // Pool has YES tokens
        
        uint256 amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
        
        return amountIn + amountOut;
    }

    function buy(TradeDirection direction, uint256 minOutcomeTokens) external nonReentrant {
        require(!marketResolved, "resolved");
        
        // 1. Transfer USDC from user
        uint256 usdcAmount = collateralToken.allowance(msg.sender, address(this));
        require(usdcAmount > 0, "allowance too low");
        // We assume user approved exact amount or we take what's approved? Better to take param.
        // Let's change signature to take amount.
        revert("Use buyExactAmount instead");
    }

    function buyExactAmount(TradeDirection direction, uint256 usdcAmount, uint256 minOutcomeTokens) external nonReentrant {
        require(!marketResolved, "resolved");
        require(usdcAmount > 0, "amount 0");

        // 1. Transfer USDC
        require(collateralToken.transferFrom(msg.sender, address(this), usdcAmount), "transfer failed");
        
        uint256 investmentAfterFee = usdcAmount * (10000 - FEE_BPS) / 10000;
        uint256 investment18 = investmentAfterFee * SCALING_FACTOR;

        // 2. Mint YES and NO (virtual or real)
        // We mint `investment18` of YES and NO.
        // If buying YES: We keep the NO in the pool. We give user the YES.
        // PLUS we swap the NO we kept for MORE YES from the pool.
        
        // Swap Logic: Sell `investment18` of OTHER token to pool.
        uint256 dirReserves = direction == TradeDirection.YES ? yesReserves : noReserves;
        uint256 otherReserves = direction == TradeDirection.YES ? noReserves : yesReserves;

        // CPMM Swap: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        uint256 amountIn = investment18; 
        uint256 amountOut = (amountIn * dirReserves) / (otherReserves + amountIn);
        
        uint256 totalOutput = investment18 + amountOut;
        require(totalOutput >= minOutcomeTokens, "slippage");

        // Update Reserves
        if (direction == TradeDirection.YES) {
            // Pool gets NO (amountIn), loses YES (amountOut)
            noReserves += amountIn;
            yesReserves -= amountOut;
            yesToken.mint(msg.sender, totalOutput);
            noToken.mint(address(this), amountIn); // Pool holds the NO
        } else {
            // Pool gets YES (amountIn), loses NO (amountOut)
            yesReserves += amountIn;
            noReserves -= amountOut;
            noToken.mint(msg.sender, totalOutput);
            yesToken.mint(address(this), amountIn); // Pool holds the YES
        }

        emit Trade(msg.sender, direction, usdcAmount, totalOutput, getPrice(direction));
    }

    function sell(TradeDirection direction, uint256 tokenAmount, uint256 minUSDC) external nonReentrant {
        require(!marketResolved, "resolved");
        require(tokenAmount > 0, "amount 0");

        // Selling YES means: Swap YES for NO in pool, then Redeem (YES+NO) for USDC.
        // 1. Swap `tokenAmount` YES for `output` NO.
        // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        
        uint256 dirReserves = direction == TradeDirection.YES ? yesReserves : noReserves;
        uint256 otherReserves = direction == TradeDirection.YES ? noReserves : yesReserves;
        
        uint256 amountIn = tokenAmount;
        // We are putting YES into pool, taking NO out.
        // reserveIn = YES, reserveOut = NO
        uint256 amountOut = (amountIn * otherReserves) / (dirReserves + amountIn);
        
        // Update Reserves
        if (direction == TradeDirection.YES) {
            yesReserves += amountIn;
            noReserves -= amountOut;
            // Burn user's YES
            yesToken.burn(msg.sender, tokenAmount);
            // Burn pool's NO (amountOut) - wait, we need to give user NO to redeem?
            // Actually, we just burn the pair.
            // User gives `tokenAmount` YES. Pool gives `amountOut` NO.
            // We now have `amountOut` pairs of (YES+NO) to redeem.
            // Wait, user gave YES. User gets NO. User now has NO? No, user wants USDC.
            // The `amountOut` NO comes from the pool. The `amountOut` YES comes from... where?
            // User sent `tokenAmount` YES.
            // We swap `tokenAmount` YES -> `amountOut` NO.
            // But we can only redeem if we have EQUAL amounts.
            // This logic is tricky for "Selling".
            
            // Alternative: "Merge" positions.
            // If I sell YES, I am effectively buying NO?
            // Yes. Selling YES for USDC is mathematically similar to Buying NO with that YES? No.
            
            // Correct Sell Logic in CPMM Prediction Market:
            // You sell YES tokens back to the pool.
            // The pool gives you USDC.
            // How much?
            // The pool effectively "buys back" the YES tokens.
            // It uses the NO tokens it has to pair with your YES and burn them for USDC.
            
            // Let's trace:
            // Pool has YES and NO reserves.
            // User sends `tokenAmount` YES.
            // Pool pairs `tokenAmount` YES with `tokenAmount` NO?
            // No, pool might not have enough NO.
            
            // Let's stick to the invariant k = x * y.
            // If I return `dx` YES tokens to the pool.
            // The pool's YES reserves increase by `dx`.
            // The pool's NO reserves must decrease to maintain k? No.
            
            // Let's look at Gnosis / Polymarket logic (CTF + CPMM).
            // They use a separate CPMM contract usually.
            // Here we are embedding it.
            
            // If we treat "Selling YES" as "Buying NO", it works if we output NO tokens.
            // But user wants USDC.
            // So: User swaps YES -> NO. User gets NO.
            // User now has NO. User had YES.
            // This doesn't help unless they had a complete set.
            
            // Let's go back to: Buy YES = Mint (YES+NO) + Sell NO for YES.
            // Sell YES = Buy NO (with YES) + Burn (YES+NO)?
            // Sell YES = Swap YES for NO?
            // If I have 100 YES. I swap 50 YES for 20 NO.
            // Now I have 50 YES and 20 NO. I can redeem 20 (YES+NO) for 20 USDC.
            // Remaining: 30 YES.
            // This allows exiting.
            
            // So "Sell" function is just:
            // 1. Swap `tokenAmount` of Direction Token for Other Token.
            // 2. Match the received Other Token with equal amount of Direction Token (which user didn't swap? No user sent it).
            
            // Actually, simpler:
            // "Sell YES" -> Swap YES for NO.
            // Output is NO tokens.
            // If user has NO tokens, they can redeem.
            // If user just wants to "exit position", they swap YES -> NO?
            // No, that just flips exposure.
            
            // Okay, for this prototype, let's keep it simple:
            // "Sell" = Swap to the other side.
            // If you hold YES and want to exit, you buy NO.
            // If you hold 100 YES, and you buy 100 NO. You now hold 100 YES + 100 NO.
            // You can call `redeem()` to get 100 USDC.
            // So we don't need a dedicated "Sell" function that returns USDC.
            // We just need `redeem()`.
            // And the UI "Sell" button just executes "Buy Other Side" + "Redeem".
            
            revert("To sell, buy the opposite outcome then redeem.");
        }
    }

    // Add Liquidity (Simple 50/50 addition)
    function addLiquidity(uint256 usdcAmount) external nonReentrant {
        require(!marketResolved, "resolved");
        require(collateralToken.transferFrom(msg.sender, address(this), usdcAmount), "transfer failed");
        
        uint256 amount18 = usdcAmount * SCALING_FACTOR;
        
        // Mint YES and NO
        yesToken.mint(address(this), amount18);
        noToken.mint(address(this), amount18);
        
        yesReserves += amount18;
        noReserves += amount18;
        
        emit LiquidityAdded(msg.sender, usdcAmount);
    }

    function redeem(uint256 amount) external nonReentrant {
        // Burn equal amounts of YES and NO to get USDC
        yesToken.burn(msg.sender, amount);
        noToken.burn(msg.sender, amount);
        
        uint256 usdcAmount = amount / SCALING_FACTOR;
        require(collateralToken.transfer(msg.sender, usdcAmount), "transfer failed");
        emit Redeem(msg.sender, amount);
    }

    function claimWinnings() external nonReentrant {
        require(marketResolved, "not resolved");
        OutcomeToken winningToken = outcomeWasYes ? yesToken : noToken;
        uint256 balance = winningToken.balanceOf(msg.sender);
        require(balance > 0, "no winnings");
        
        winningToken.burn(msg.sender, balance);
        uint256 usdcAmount = balance / SCALING_FACTOR;
        require(collateralToken.transfer(msg.sender, usdcAmount), "transfer failed");
        emit Redeem(msg.sender, balance);
    }

    function resolveMarket(bool _outcomeWasYes) external {
        require(msg.sender == resolver, "only resolver");
        require(!marketResolved, "already resolved");
        marketResolved = true;
        outcomeWasYes = _outcomeWasYes;
        emit Resolve(_outcomeWasYes);
    }
}