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
// @authors: Martin Kuechler, martin.kuechler@slock.it

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../contracts/Trading/MarketDB.sol";
import "ew-user-registry-contracts/Users/RoleManagement.sol";
import "ew-utils-general-contracts/Interfaces/Updatable.sol";
import "ew-asset-registry-contracts/Interfaces/AssetGeneralInterface.sol";
import "ew-asset-registry-contracts/Interfaces/AssetProducingInterface.sol";
import "ew-asset-registry-contracts/Interfaces/AssetConsumingInterface.sol";
import "ew-asset-registry-contracts/Interfaces/AssetContractLookupInterface.sol";
import "../../contracts/Interfaces/MarketContractLookupInterface.sol";

contract AgreementLogic is RoleManagement, Updatable {

    event LogAgreementFullySigned(uint indexed _agreementId, uint indexed _demandId, uint indexed _supplyId);
    event LogAgreementCreated(uint indexed _agreementId, uint indexed _demandId, uint indexed _supplyId);

    /// @notice database contract
    MarketDB public db;
    
    AssetContractLookupInterface public assetContractLookup;

    modifier isInitialized {
        require((db) != address(0x0));
        _;
    }

    /// @notice constructor
    constructor(
        AssetContractLookupInterface _assetContractLookup,
        MarketContractLookupInterface _marketContractLookup
    ) 
        RoleManagement(UserContractLookupInterface(_assetContractLookup.userRegistry()), _marketContractLookup) 
        public 
    {
        assetContractLookup = _assetContractLookup;
    }

    /// @notice Function to create a demand
    /// @param _propertiesDocumentHash document-hash with all the properties of the demand
    /// @param _documentDBURL url-address of the demand     
     /// @dev will return an event with the event-Id
    function createAgreement( 
        string _propertiesDocumentHash,
        string _documentDBURL,
        uint _demandId,
        uint _supplyId
    )
        external
        isInitialized
    {
        MarketDB.Demand memory demand = db.getDemand(_demandId);
        MarketDB.Supply memory supply = db.getSupply(_supplyId);

        address supplyOwner = AssetGeneralInterface(assetContractLookup.assetProducingRegistry()).getAssetOwner(supply.assetId);

        require(msg.sender == demand.demandOwner || msg.sender == supplyOwner, "createDemand: wrong owner when creating");
        uint agreementId = db.createAgreementDB(_propertiesDocumentHash, _documentDBURL, _demandId, _supplyId);
        if(msg.sender == demand.demandOwner){
            approveAgreementDemand(agreementId);
        }
        if(msg.sender == supplyOwner){
            approveAgreementSupply(agreementId);
        }
        
        emit LogAgreementCreated(agreementId, _demandId, _supplyId);
    }

    /// @notice fuction to set the database contract, can only be called once
    function init(address _database, address _admin) 
        public
        onlyOwner
    {
        require(address(db) == 0x0);
        db = MarketDB(_database);
    }

    /// @notice Updates the logic contract
    /// @param _newLogic Address of the new logic contract
    function update(address _newLogic) 
        external
        onlyOwner    
    {
        db.changeOwner(_newLogic);
    }  

    /// @return length of the allAgreements-array
    function getAllAgreementListLength() external isInitialized view returns (uint) {
        return db.getAllAgreementListLengthDB();
    }

    function getAgreement(uint _agreementId)
        external 
        isInitialized
        view 
        returns (
            string _propertiesDocumentHash,
            string _documentDBURL,
            uint _demandId,
            uint _supplyId,
            bool _approvedBySupplyOwner,
            bool _approvedByDemandOwner
        )
    {
        MarketDB.Agreement memory agreement = db.getAgreementDB(_agreementId);
        _propertiesDocumentHash = agreement.propertiesDocumentHash;
        _documentDBURL = agreement.documentDBURL;
        _demandId = agreement.demandId;
        _supplyId = agreement.supplyId;
        _approvedBySupplyOwner = agreement.approvedBySupplyOwner;
        _approvedByDemandOwner = agreement.approvedByDemandOwner;
    }

    function approveAgreementDemand(uint _agreementId) 
        public
        isInitialized
    {
        MarketDB.Agreement memory agreement = db.getAgreementDB(_agreementId);
        require(db.getDemand(agreement.demandId).demandOwner == msg.sender, "approveAgreementDemand: wrong msg.sender");
        
        // we approve a demand. If it's returning true it means that both supply and demand are approved thus making the agreement complete
        if(db.approveAgreementDemandDB(_agreementId)) {
            emit LogAgreementFullySigned(_agreementId, agreement.demandId, agreement.supplyId);
        }    
    }

    function approveAgreementSupply(uint _agreementId) 
        public
        isInitialized
    {
        MarketDB.Agreement memory agreement = db.getAgreementDB(_agreementId);
        MarketDB.Supply memory supply = db.getSupply(agreement.supplyId);
        
        require(AssetGeneralInterface(assetContractLookup.assetProducingRegistry()).getAssetOwner(supply.assetId) == msg.sender, "approveAgreementSupply: wrong msg.sender");
        
        // we approve a supply. If it's returning true it means that both supply and demand are approved thus making the agreement complete
        if(db.approveAgreementSupplyDB(_agreementId)){
            emit LogAgreementFullySigned(_agreementId, agreement.demandId, agreement.supplyId);
        }  
    }

}