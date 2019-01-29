import MarketContractLookupJSON from '../contract-build/MarketContractLookup.json';
import MarketDBJSON from '../contract-build/MarketDB.json';
import MarketLogicJSON from '../contract-build/MarketLogic.json';

export { MarketContractLookupJSON, MarketDBJSON, MarketLogicJSON };
export { MarketLogic } from './wrappedContracts/MarketLogic';
export { MarketContractLookup } from './wrappedContracts/MarketContractLookup';
export { migrateMarketRegistryContracts } from './utils/migrateContracts';
