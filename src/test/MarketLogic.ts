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

import { assert } from 'chai';
import * as fs from 'fs';
import 'mocha';
import { Web3Type } from '../types/web3';
import { migrateUserRegistryContracts, UserLogic, UserContractLookup } from 'ew-user-registry-contracts';
import { migrateAssetRegistryContracts, AssetContractLookup, AssetProducingRegistryLogic } from 'ew-asset-registry-contracts';
import { migrateMarketRegistryContracts } from '../utils/migrateContracts';
import { MarketContractLookup } from '../wrappedContracts/MarketContractLookup';
import { MarketDB } from '../wrappedContracts/MarketDB';
import { MarketLogic } from '../wrappedContracts/MarketLogic';
import { getClientVersion } from 'sloffle';
describe('MarketLogic', () => {

    const configFile = JSON.parse(fs.readFileSync(process.cwd() + '/connection-config.json', 'utf8'));

    const Web3 = require('web3');
    const web3: Web3Type = new Web3(configFile.develop.web3);

    const privateKeyDeployment = configFile.develop.deployKey.startsWith('0x') ?
        configFile.develop.deployKey : '0x' + configFile.develop.deployKey;

    const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

    let assetRegistryContract: AssetContractLookup;
    let marketRegistryContract: MarketContractLookup;
    let marketDB: MarketDB;
    let marketLogic: MarketLogic;
    let isGanache: boolean;
    let userRegistryLookup: UserContractLookup;
    let userLogic: UserLogic;
    let assetRegistry: AssetProducingRegistryLogic;

    const assetOwnerPK = '0xc118b0425221384fe0cbbd093b2a81b1b65d0330810e0792c7059e518cea5383';
    const accountAssetOwner = web3.eth.accounts.privateKeyToAccount(assetOwnerPK).address;

    const traderPK = '0x2dc5120c26df339dbd9861a0f39a79d87e0638d30fdedc938861beac77bbd3f5';
    const accountTrader = web3.eth.accounts.privateKeyToAccount(traderPK).address;

    it('should deploy the contracts', async () => {

        isGanache = (await getClientVersion(web3)).includes('EthereumJS');

        const userContracts = await migrateUserRegistryContracts(web3);

        userLogic = new UserLogic((web3 as any),
                                  userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserLogic.json']);

        userRegistryLookup = new UserContractLookup((web3 as any),
                                                    userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserContractLookup.json']);

        await userLogic.setUser(accountDeployment, 'admin', { privateKey: privateKeyDeployment });

        await userLogic.setRoles(accountDeployment, 3, { privateKey: privateKeyDeployment });

        const userContractLookupAddr = userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserContractLookup.json'];

        const assetContracts = await migrateAssetRegistryContracts(web3, userContractLookupAddr);

        const assetRegistryLookupAddr = assetContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetContractLookup.json'];
        const assetRegistryAddr = assetContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetProducingRegistryLogic.json'];

        const marketContracts = await migrateMarketRegistryContracts(web3, assetRegistryLookupAddr);

        assetRegistry = new AssetProducingRegistryLogic((web3 as any), assetRegistryAddr);
        assetRegistryContract = new AssetContractLookup((web3 as any), assetRegistryLookupAddr);
        marketRegistryContract = new MarketContractLookup((web3 as any));
        marketLogic = new MarketLogic((web3 as any));
        marketDB = new MarketDB((web3 as any));

        Object.keys(marketContracts).forEach(async (key) => {

            const deployedBytecode = await web3.eth.getCode(marketContracts[key]);
            assert.isTrue(deployedBytecode.length > 0);

            const contractInfo = JSON.parse(fs.readFileSync(key, 'utf8'));

            const tempBytecode = '0x' + contractInfo.deployedBytecode;
            assert.equal(deployedBytecode, tempBytecode);

        });
    });

    it('should have the right owner', async () => {

        assert.equal(await marketLogic.owner(), marketRegistryContract.web3Contract._address);

    });

    it('should have the lookup-contracts', async () => {

        assert.equal(await marketLogic.assetContractLookup(), assetRegistryContract.web3Contract._address);
        assert.equal(await marketLogic.userContractLookup(), userRegistryLookup.web3Contract._address);
    });

    it('should have the right db', async () => {

        assert.equal(await marketLogic.db(), marketDB.web3Contract._address);

    });

    it('should fail when trying to call init', async () => {

        let failed = false;

        try {
            await marketLogic.init(
                '0x1000000000000000000000000000000000000005', '0x1000000000000000000000000000000000000005',
                { privateKey: privateKeyDeployment });
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert msg.sender is not owner');
            }
        }
        assert.isTrue(failed);
    });

    it('should fail when trying to call update', async () => {

        let failed = false;

        try {
            await marketLogic.update(
                '0x1000000000000000000000000000000000000005',
                { privateKey: privateKeyDeployment });
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert msg.sender is not owner');
            }
        }
        assert.isTrue(failed);
    });

    it('should have 0 elements in allDemands', async () => {
        assert.equal(await marketLogic.getAllDemandListLength(), 0);
    });

    it('should throw an error when trying to access a non existing demand', async () => {

        let failed = false;
        try {
            await marketLogic.getDemand(0);
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create a demand as userAdmin', async () => {

        let failed = false;
        try {
            await marketLogic.createDemand(
                'propertiesDocumentHash',
                'documentDBURL',
                { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create a demand as non registered user', async () => {

        let failed = false;
        try {
            await marketLogic.createDemand(
                'propertiesDocumentHash',
                'documentDBURL',
                { privateKey: traderPK },
            );
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);
    });

    it('should set right roles to users', async () => {
        await userLogic.setUser(accountTrader, 'trader', { privateKey: privateKeyDeployment });
        await userLogic.setUser(accountAssetOwner, 'assetOwner', { privateKey: privateKeyDeployment });

        await userLogic.setRoles(accountTrader, 16, { privateKey: privateKeyDeployment });
        await userLogic.setRoles(accountAssetOwner, 8, { privateKey: privateKeyDeployment });
    });

    it('should fail when trying to create a demand as assetOwner', async () => {

        let failed = false;
        try {
            await marketLogic.createDemand(
                'propertiesDocumentHash',
                'documentDBURL',
                { privateKey: assetOwnerPK },
            );
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);
    });

    it('should create a demand as trader', async () => {

        const tx = await marketLogic.createDemand(
            'propertiesDocumentHash',
            'documentDBURL',
            { privateKey: traderPK },
        );

        const allEvents = await marketLogic.getAllcreatedNewDemandEvents(
            { fromBlock: tx.blockNumber, toBlock: tx.blockNumber },
        );

        assert.equal(allEvents.length, 1);

        const createDemandEvent = allEvents[0];
        assert.equal(createDemandEvent.event, 'createdNewDemand');
        assert.deepEqual(createDemandEvent.returnValues, {
            0: accountTrader,
            1: '0',
            _sender: accountTrader,
            _demandId: '0',
        });
    });

    it('should get a demand', async () => {

        const demand = await marketLogic.getDemand(0);
        demand[2] = demand[2].toLowerCase();
        demand._owner = demand._owner.toLowerCase();

        assert.deepEqual(demand, {
            0: 'propertiesDocumentHash',
            1: 'documentDBURL',
            2: accountTrader.toLowerCase(),
            _propertiesDocumentHash: 'propertiesDocumentHash',
            _documentDBURL: 'documentDBURL',
            _owner: accountTrader.toLowerCase(),
        });
    });

    it('should have 1 demand in demandList', async () => {
        assert.equal(await marketLogic.getAllDemandListLength(), 1);
    });

    it('should fail when trying to create a supply with an non-existing asset as assetOwner', async () => {

        let failed = false;
        try {
            await marketLogic.createSupply(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                { privateKey: assetOwnerPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create a supply with an non-existing asset as trader', async () => {

        let failed = false;
        try {
            await marketLogic.createSupply(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                { privateKey: traderPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create a supply with an non-existing asset as admin', async () => {

        let failed = false;
        try {
            await marketLogic.createSupply(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should onboard an asset', async () => {

        await assetRegistry.createAsset('0x1000000000000000000000000000000000000005',
                                        accountAssetOwner,
                                        10,
                                        '0x1000000000000000000000000000000000000005',
                                        true,
                                        'propertiesDocuementHash',
                                        'url',
                                        { privateKey: privateKeyDeployment });
    });

    it('should fail when trying to create a supply with an non-existing asset as trader', async () => {

        let failed = false;
        try {
            await marketLogic.createSupply(
                'propertiesDocumentHash',
                'documentDBURL',
                0,
                { privateKey: traderPK },
            );
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert approveAgreementSupply: wrong msg.sender');
                //    assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create a supply with an non-existing asset as admin', async () => {

        let failed = false;
        try {
            await marketLogic.createSupply(
                'propertiesDocumentHash',
                'documentDBURL',
                0,
                { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert approveAgreementSupply: wrong msg.sender');
                //    assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);
    });

    it('should have 0 elements in supplyList', async () => {

        assert.equal(await marketLogic.getAllSupplyListLength(), 0);

    });

    it('should create a supply as assetOwner', async () => {

        const tx = await marketLogic.createSupply(
            'propertiesDocumentHash',
            'documentDBURL',
            0,
            { privateKey: assetOwnerPK },
        );

        const allEvents =
            await marketLogic.getAllcreatedNewSupplyEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber });

        assert.equal(allEvents.length, 1);
        const createEvent = allEvents[0];

        assert.equal(createEvent.event, 'createdNewSupply');
        assert.deepEqual(createEvent.returnValues, {
            0: accountAssetOwner,
            1: '0',
            _sender: accountAssetOwner,
            _supplyId: '0',
        });
    });

    it('should have 1 elements in supplyList', async () => {
        assert.equal(await marketLogic.getAllSupplyListLength(), 1);
    });

    it('should fail when trying to create an aggreement with a non-existing supply as admin', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                0,
                1,
                { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing supply as assetOwner', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                0,
                1,
                { privateKey: assetOwnerPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing supply as trader', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                0,
                1,
                { privateKey: traderPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing demand as admin', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                0,
                { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing demand as assetOwner', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                0,
                { privateKey: assetOwnerPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing demand as trader', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                0,
                { privateKey: traderPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing demand and non-existing supply as admin', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                1,
                { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing demand and non-existing supply as assetOwner', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                1,
                { privateKey: assetOwnerPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement with a non-existing demand and non-existing supply as trader', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                1,
                1,
                { privateKey: traderPK },
            );
        }
        catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to create an aggreement as admin', async () => {

        let failed = false;
        try {
            await marketLogic.createAgreement(
                'propertiesDocumentHash',
                'documentDBURL',
                0,
                0,
                { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert createDemand: wrong owner when creating');
            }
        }

        assert.isTrue(failed);
    });

    it('should throw an error when accessing a non existing-agreement', async () => {

        let failed = false;
        try {
            const agreement = await marketLogic.getAgreement(0);
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should have 0 agreements in list', async () => {

        assert.equal(await marketLogic.getAllAgreementListLength(), 0);

    });

    it('should create an aggreement as assetOwner', async () => {

        const tx = await marketLogic.createAgreement(
            'propertiesDocumentHash',
            'documentDBURL',
            0,
            0,
            { privateKey: assetOwnerPK },
        );

        const allEvents = await marketLogic.getAllLogAgreementCreatedEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber });

        assert.equal(allEvents.length, 1);
        const agreementEvent = allEvents[0];
        assert.equal(agreementEvent.event, 'LogAgreementCreated');
        assert.deepEqual(agreementEvent.returnValues, {
            0: '0',
            1: '0',
            2: '0',
            _agreementId: '0',
            _demandId: '0',
            _supplyId: '0',
        });

    });

    it('should be able to approve aggreement again as supplyOwner', async () => {

        const tx = await marketLogic.approveAgreementSupply(0, { privateKey: assetOwnerPK });

    });

    it('should have 1 agreements in list', async () => {

        assert.equal(await marketLogic.getAllAgreementListLength(), 1);

    });

    it('should fail when trying to call approveAgreementDemand as assetOwner', async () => {

        let failed = false;
        try {
            const tx = await marketLogic.approveAgreementDemand(0, { privateKey: assetOwnerPK });

        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert approveAgreementDemand: wrong msg.sender');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to call approveAgreementDemand as admin', async () => {

        let failed = false;
        try {
            const tx = await marketLogic.approveAgreementDemand(0, { privateKey: privateKeyDeployment });

        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert approveAgreementDemand: wrong msg.sender');
            }
        }

        assert.isTrue(failed);
    });

    it('should return the (not yet full) agreement', async () => {

        const agreement = await marketLogic.getAgreement(0);

        assert.deepEqual(agreement, {
            0: 'propertiesDocumentHash',
            1: 'documentDBURL',
            2: '0',
            3: '0',
            4: true,
            5: false,
            _propertiesDocumentHash: 'propertiesDocumentHash',
            _documentDBURL: 'documentDBURL',
            _demandId: '0',
            _supplyId: '0',
            _approvedBySupplyOwner: true,
            _approvedByDemandOwner: false,
        });

    });

    it('should be able to approve agreementDemand as trader', async () => {

        const tx = await marketLogic.approveAgreementDemand(0, { privateKey: traderPK });

        const allEvents = await marketLogic.getAllLogAgreementFullySignedEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber });
        assert.equal(allEvents.length, 1);
        const signedEvent = allEvents[0];

        assert.equal(signedEvent.event, 'LogAgreementFullySigned');
        assert.deepEqual(signedEvent.returnValues, {
            0: '0',
            1: '0',
            2: '0',
            _agreementId: '0',
            _demandId: '0',
            _supplyId: '0',
        });
    });

    it('should return the full agreement', async () => {

        const agreement = await marketLogic.getAgreement(0);

        assert.deepEqual(agreement, {
            0: 'propertiesDocumentHash',
            1: 'documentDBURL',
            2: '0',
            3: '0',
            4: true,
            5: true,
            _propertiesDocumentHash: 'propertiesDocumentHash',
            _documentDBURL: 'documentDBURL',
            _demandId: '0',
            _supplyId: '0',
            _approvedBySupplyOwner: true,
            _approvedByDemandOwner: true,
        });

    });

    it('should create a 2nd supply as assetOwner', async () => {

        const tx = await marketLogic.createSupply(
            'propertiesDocumentHash_2',
            'documentDBURL_2',
            0,
            { privateKey: assetOwnerPK },
        );

        const allEvents =
            await marketLogic.getAllcreatedNewSupplyEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber });

        assert.equal(allEvents.length, 1);
        const createEvent = allEvents[0];

        assert.equal(createEvent.event, 'createdNewSupply');
        assert.deepEqual(createEvent.returnValues, {
            0: accountAssetOwner,
            1: '1',
            _sender: accountAssetOwner,
            _supplyId: '1',
        });
    });

    it('should create a 2nd demand as trader', async () => {

        const tx = await marketLogic.createDemand(
            'propertiesDocumentHash_2',
            'documentDBURL_2',
            { privateKey: traderPK },
        );

        const allEvents = await marketLogic.getAllcreatedNewDemandEvents(
            { fromBlock: tx.blockNumber, toBlock: tx.blockNumber },
        );

        assert.equal(allEvents.length, 1);

        const createDemandEvent = allEvents[0];
        assert.equal(createDemandEvent.event, 'createdNewDemand');
        assert.deepEqual(createDemandEvent.returnValues, {
            0: accountTrader,
            1: '1',
            _sender: accountTrader,
            _demandId: '1',
        });
    });

    it('should create an aggreement as trader', async () => {

        const tx = await marketLogic.createAgreement(
            'propertiesDocumentHash_2',
            'documentDBURL_2',
            1,
            1,
            { privateKey: traderPK },
        );

        const allEvents = await marketLogic.getAllLogAgreementCreatedEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber });

        assert.equal(allEvents.length, 1);
        const agreementEvent = allEvents[0];
        assert.equal(agreementEvent.event, 'LogAgreementCreated');
        assert.deepEqual(agreementEvent.returnValues, {
            0: '1',
            1: '1',
            2: '1',
            _agreementId: '1',
            _demandId: '1',
            _supplyId: '1',
        });

    });

    it('should return the (not yet full) 2nd agreement', async () => {

        const agreement = await marketLogic.getAgreement(1);

        assert.deepEqual(agreement, {
            0: 'propertiesDocumentHash_2',
            1: 'documentDBURL_2',
            2: '1',
            3: '1',
            4: false,
            5: true,
            _propertiesDocumentHash: 'propertiesDocumentHash_2',
            _documentDBURL: 'documentDBURL_2',
            _demandId: '1',
            _supplyId: '1',
            _approvedBySupplyOwner: false,
            _approvedByDemandOwner: true,
        });

    });

    it('should be able to approve 2nd aggreement again as supplyOwner', async () => {

        const tx = await marketLogic.approveAgreementDemand(1, { privateKey: traderPK });

    });

    it('should fail when trying to call approveAgreementSupply as admin', async () => {

        let failed = false;
        try {
            const tx = await marketLogic.approveAgreementSupply(1, { privateKey: privateKeyDeployment });

        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert approveAgreementSupply: wrong msg.sender');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to call approveAgreementSupply as trader', async () => {

        let failed = false;
        try {
            const tx = await marketLogic.approveAgreementSupply(1, { privateKey: traderPK });

        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert approveAgreementSupply: wrong msg.sender');
            }
        }

        assert.isTrue(failed);
    });

    it('shouldbe able to call approveAgreementSupply as assetOwner', async () => {

        const tx = await marketLogic.approveAgreementSupply(1, { privateKey: assetOwnerPK });
        const allEvents = await marketLogic.getAllLogAgreementFullySignedEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber });
        assert.equal(allEvents.length, 1);
        const signedEvent = allEvents[0];

        assert.equal(signedEvent.event, 'LogAgreementFullySigned');
        assert.deepEqual(signedEvent.returnValues, {
            0: '1',
            1: '1',
            2: '1',
            _agreementId: '1',
            _demandId: '1',
            _supplyId: '1',
        });
    });

    it('should return the (not yet full) 2nd agreement', async () => {

        const agreement = await marketLogic.getAgreement(1);

        assert.deepEqual(agreement, {
            0: 'propertiesDocumentHash_2',
            1: 'documentDBURL_2',
            2: '1',
            3: '1',
            4: true,
            5: true,
            _propertiesDocumentHash: 'propertiesDocumentHash_2',
            _documentDBURL: 'documentDBURL_2',
            _demandId: '1',
            _supplyId: '1',
            _approvedBySupplyOwner: true,
            _approvedByDemandOwner: true,
        });

    });

    it('should have 2 agreements in list', async () => {

        assert.equal(await marketLogic.getAllAgreementListLength(), 2);

    });

});