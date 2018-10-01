import { Sloffle } from 'sloffle';
import * as fs from 'fs';
import * as path from 'path';
import { MarketContractLookup } from '../wrappedContracts/MarketContractLookup';
import { Web3Type } from '../types/web3';
import { migrateUserRegistryContracts } from 'ew-user-registry-contracts';

export async function migrateMarketRegistryContracts(
    web3: Web3Type,
    assetContractLookupAddress: string,
): Promise<JSON> {
    return new Promise<any>(async (resolve, reject) => {

        const configFile = JSON.parse(fs.readFileSync(process.cwd() + '/connection-config.json', 'utf8'));

        const sloffle = new Sloffle((web3 as any));

        const privateKeyDeployment = configFile.develop.deployKey.startsWith('0x') ?
            configFile.develop.deployKey : '0x' + configFile.develop.deployKey;
        const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

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
    });
}
