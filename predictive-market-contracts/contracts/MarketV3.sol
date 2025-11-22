// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OutcomeToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MarketV3 is Ownable {
    enum TradeDirection { YES, NO }

    string public question;
    string public metadataURI;
    address public resolver;
    IERC20 public collateralToken;
    OutcomeToken public yesToken;
    OutcomeToken public noToken;

    bool public marketResolved;
    bool public outcomeWasYes;

    address public yesPoolAddress;
    address public noPoolAddress;

    uint256 public yesReserve;
    uint256 public noReserve;

    uint256 private constant SCALING_FACTOR = 10 ** 12;

    event Mint(address indexed user, uint256 amount);
    event Resolve(bool indexed outcome);
    event Redeem(address indexed user, uint256 amount);
    event PoolsSet(address yesPool, address noPool);
    event MarketPriceUpdated(uint256 yesReserve, uint256 noReserve, uint256 priceYes, uint256 priceNo);
    event TradeExecuted(address indexed trader, TradeDirection direction, uint256 amount, uint256 price, uint256 timestamp);

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

    function mint(uint256 usdcAmount) external {
        require(!marketResolved, "resolved");
        uint256 outcomeAmount = usdcAmount * SCALING_FACTOR;
        require(collateralToken.transferFrom(msg.sender, address(this), usdcAmount), "transfer failed");
        yesToken.mint(msg.sender, outcomeAmount);
        noToken.mint(msg.sender, outcomeAmount);
        emit Mint(msg.sender, outcomeAmount);
    }

    function setPoolAddresses(address _yesPool, address _noPool) external {
        require(msg.sender == resolver, "only resolver");
        require(yesPoolAddress == address(0) && noPoolAddress == address(0), "already set");
        yesPoolAddress = _yesPool;
        noPoolAddress = _noPool;
        emit PoolsSet(_yesPool, _noPool);
    }

    function recordSwap(uint256 _yesReserve, uint256 _noReserve, TradeDirection dir, uint256 amount, uint256 price) external onlyOwner {
        yesReserve = _yesReserve;
        noReserve = _noReserve;
        emit MarketPriceUpdated(_yesReserve, _noReserve, getYesPrice(), getNoPrice());
        emit TradeExecuted(tx.origin, dir, amount, price, block.timestamp);
    }

    function resolveMarket(bool _outcomeWasYes) external {
        require(msg.sender == resolver, "only resolver");
        require(!marketResolved, "already resolved");
        marketResolved = true;
        outcomeWasYes = _outcomeWasYes;
        emit Resolve(_outcomeWasYes);
    }

    function redeemWinnings(uint256 amount) external {
        require(marketResolved, "not resolved");
        OutcomeToken winning = outcomeWasYes ? yesToken : noToken;
        winning.burn(msg.sender, amount);
        uint256 usdcAmount = amount / SCALING_FACTOR;
        require(collateralToken.transfer(msg.sender, usdcAmount), "transfer failed");
        emit Redeem(msg.sender, amount);
    }

    function getYesPrice() public view returns (uint256) {
        if (yesReserve == 0 || noReserve == 0) return 50;
        return (yesReserve * 100) / (yesReserve + noReserve);
    }

    function getNoPrice() public view returns (uint256) {
        return 100 - getYesPrice();
    }
}