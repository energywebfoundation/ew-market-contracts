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
// @authors: slock.it GmbH, Martin Kuechler, martin.kuechler@slock.it
pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../contracts/Trading/MarketDB.sol";
import "../../contracts/Trading/AgreementLogic.sol";

/// @title The logic contract for the AgreementDB of Origin list
contract MarketLogic is AgreementLogic {

    event createdNewDemand(address _sender, uint indexed _demandId);
    event createdNewSupply(address _sender, uint indexed _supplyId);
    AssetContractLookupInterface public assetContractLookup;
    
    /// @notice constructor
    constructor(
        AssetContractLookupInterface _assetContractLookup,
        MarketContractLookupInterface _marketContractLookup
    ) 
        AgreementLogic(_assetContractLookup,_marketContractLookup) 
        public 
    {
  
    }

    /// @notice Function to create a demand
    /// @param _propertiesDocumentHash document-hash with all the properties of the demand
    /// @param _documentDBURL url-address of the demand     
     /// @dev will return an event with the event-Id
    function createDemand( 
        string _propertiesDocumentHash,
        string _documentDBURL
    )
        external
        isInitialized
        onlyRole(RoleManagement.Role.Trader)
     {
        uint demandID = db.createDemand(_propertiesDocumentHash, _documentDBURL, msg.sender);
        emit createdNewDemand(msg.sender, demandID);
    }

     /// @notice Function to create a demand
    /// @param _propertiesDocumentHash document-hash with all the properties of the demand
    /// @param _documentDBURL url-address of the demand     
     /// @dev will return an event with the event-Id
    function createSupply( 
        string _propertiesDocumentHash,
        string _documentDBURL,
        uint _assetId
    )
        external
        isInitialized
     {  
        require(AssetProducingInterface(assetContractLookup.assetProducingRegistry()).getFullAsset(_assetId).owner == msg.sender, "approveAgreementSupply: wrong msg.sender");
        uint supplyID = db.createSupply(_propertiesDocumentHash, _documentDBURL, _assetId);
        emit createdNewSupply(msg.sender, supplyID);
    }

    /// @notice function to return the length of the allDemands-array in the database
    /// @return length of the allDemansa-array
    function getAllDemandListLength() external isInitialized view returns (uint) {
        return db.getAllDemandListLength();
    }

        /// @notice function to return the length of the allSupply-array in the database
    /// @return length of the allDemansa-array
    function getAllSupplyListLength() external isInitialized view returns (uint) {
        return db.getAllSupplyListLength();
    }

    /// @notice Returns the information of a demand
    /// @param _demandId index of the demand in the allDemands-array
    /// @return propertiesDocumentHash, documentDBURL and owner 
    function getDemand(uint _demandId) 
        external 
        isInitialized 
        view 
        returns (
            string _propertiesDocumentHash,
            string _documentDBURL,
            address _owner
        )
    {
        MarketDB.Demand memory demand = db.getDemand(_demandId);
        _propertiesDocumentHash = demand.propertiesDocumentHash;
        _documentDBURL = demand.documentDBURL;
        _owner = demand.demandOwner;
    }

    function getSupply(uint _supplyId)
        external 
        isInitialized 
        view 
        returns (
            string _propertiesDocumentHash,
            string _documentDBURL,
            uint _assetId
        )
    {
        MarketDB.Supply memory supply = db.getSupply(_supplyId);
        _propertiesDocumentHash = supply.propertiesDocumentHash;
        _documentDBURL = supply.documentDBURL;
        _assetId = supply.assetId;
    } 

}