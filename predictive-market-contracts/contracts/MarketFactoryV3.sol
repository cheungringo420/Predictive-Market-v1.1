// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MarketV3.sol";

contract MarketFactoryV3 {
    address public immutable collateralToken;
    address[] public allMarkets;
    mapping(address => address[]) public marketsByCreator;

    event MarketCreated(address indexed marketAddress, string question, string metadataURI, address indexed creator);

    constructor(address _collateralToken) {
        collateralToken = _collateralToken;
    }

    function createMarket(string memory _question, string memory _metadataURI) external returns (address) {
        MarketV3 newMarket = new MarketV3(_question, _metadataURI, msg.sender, collateralToken);
        address marketAddress = address(newMarket);
        allMarkets.push(marketAddress);
        marketsByCreator[msg.sender].push(marketAddress);
        emit MarketCreated(marketAddress, _question, _metadataURI, msg.sender);
        return marketAddress;
    }

    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    function getMarketsByCreator(address creator) external view returns (address[] memory) {
        return marketsByCreator[creator];
    }
}