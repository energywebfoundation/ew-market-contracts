import * as fs from 'fs';
import * as path from 'path';
import { MarketContractLookup } from '../wrappedContracts/MarketContractLookup';
import Web3 = require('web3');

import { deploy } from 'ew-deployment';
import { MarketContractLookupJSON, MarketLogicJSON, MarketDBJSON } from '..';

export async function migrateMarketRegistryContracts(
    web3: Web3,
    assetContractLookupAddress: string,
    deployKey: string,
): Promise<JSON> {
    return new Promise<any>(async (resolve, reject) => {

        const privateKeyDeployment = deployKey.startsWith('0x') ?
            deployKey : '0x' + deployKey;

        const marketContractLookupAddress = (await deploy(
            web3,
            MarketContractLookupJSON.bytecode,
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const marketLogicAddress = (await deploy(
            web3,
            MarketLogicJSON.bytecode +
            web3.eth.abi.encodeParameters(
                ['address', 'address'], [assetContractLookupAddress, marketContractLookupAddress],
            ).substr(2),
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const marketDBAddress = (await deploy(
            web3,
            MarketDBJSON.bytecode +
            web3.eth.abi.encodeParameter('address', marketLogicAddress).substr(2),
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const marketContractLookup = new MarketContractLookup(web3, marketContractLookupAddress);

        await marketContractLookup.init(assetContractLookupAddress, marketLogicAddress, marketDBAddress,
                                        { privateKey: privateKeyDeployment });

        const resultMapping = {} as any;
        resultMapping.MarketContractLookup = marketContractLookupAddress;
        resultMapping.MarketLogic = marketLogicAddress;
        resultMapping.MarketDB = marketDBAddress;

        resolve(resultMapping);
        /*    
        const marketContractLookupWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/MarketContractLookup.json'),
            [],
            { privateKey: privateKeyDeployment },
        );

        const marketLogicWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/MarketLogic.json'),
            [assetContractLookupAddress, marketContractLookupWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const marketDBWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/MarketDB.json'),
            [marketLogicWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const marketContractLookup: MarketContractLookup
            = new MarketContractLookup((web3 as any), marketContractLookupWeb3._address);

        await marketContractLookup.init(
            assetContractLookupAddress,
            marketLogicWeb3._address,
            marketDBWeb3._address,
            { privateKey: privateKeyDeployment });

        resolve(sloffle.deployedContracts);
        */
    });
}
