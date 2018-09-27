// Copyright 2018 Energy Web Foundation
// This file is part of the Origin Application brought to you by the Energy Web Foundation,
// a global non-profit organization focused on accelerating blockchain technology across the energy sector, 
// incorporated in Zug, Switzerland.
//
// The Origin Application is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY and without an implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details, at <http://www.gnu.org/licenses/>.
//
// @authors: slock.it GmbH, Martin Kuechler, martin.kuchler@slock.it

pragma solidity ^0.4.24;

import "ew-utils-general-contracts/Msc/Owned.sol";
import "ew-utils-general-contracts/Interfaces/Updatable.sol";
import "ew-user-registry-contracts/Interfaces/UserContractLookupInterface.sol";
import "../contracts/Interfaces/MarketContractLookupInterface.sol";
import "ew-asset-registry-contracts/Interfaces/AssetContractLookupInterface.sol";

/// @title Contract for storing the current logic-contracts-addresses for the certificate of origin
contract MarketContractLookup is Owned, MarketContractLookupInterface {
    
    Updatable public marketLogicRegistry;
    AssetContractLookupInterface public assetContractLookup;

    /// @notice The constructor 
    constructor() Owned(msg.sender) public{ } 

    /// @notice function to initialize the contracts, setting the needed contract-addresses
    function init(
        AssetContractLookupInterface _assetRegistry, 
        Updatable _marketLogicRegistry, 
        address _marketDB 
    ) 
        external
        onlyOwner
    {
        require(    
            _assetRegistry != address(0) && _marketLogicRegistry != address(0)
            && marketLogicRegistry == address(0) && assetContractLookup == address(0) && assetContractLookup == address(0),
            "already initialized"
        );
        require(_marketDB != 0, "marketDB cannot be 0");

        marketLogicRegistry = _marketLogicRegistry;
        assetContractLookup = _assetRegistry;

        marketLogicRegistry.init(_marketDB, msg.sender);
    }

   
    /// @notice function to update one or more logic-contracts
    /// @param _marketRegistry address of the new user-registry-logic-contract
    function update(
        Updatable _marketRegistry
    )
        external
        onlyOwner 
    {
        require(address(_marketRegistry)!= 0, "update: cannot set to 0");
        marketLogicRegistry.update(_marketRegistry);
        marketLogicRegistry = _marketRegistry;
    }

    function marketLogicRegistry() external view returns (address){
        return marketLogicRegistry;
    }

    function assetContractLookup() external view returns (address){
        return assetContractLookup;
    }



}