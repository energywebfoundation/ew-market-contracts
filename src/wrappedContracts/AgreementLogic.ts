
    import { GeneralFunctions, SpecialTx, SearchLog, getClientVersion } from './GeneralFunctions'
    import * as fs from 'fs'
    import * as path from 'path'
    import Web3 = require('web3');
    import { Tx, BlockType } from 'web3/eth/types';
    import { TransactionReceipt, Logs } from 'web3/types';
    import { JsonRPCResponse } from 'web3/providers';
    import AgreementLogicJSON from '../../contract-build/AgreementLogic.json'

    export class AgreementLogic extends GeneralFunctions
{
    web3: Web3
    buildFile = AgreementLogicJSON
    constructor(web3: Web3, address?: string){
        super(address ? new web3.eth.Contract(AgreementLogicJSON.abi, address) : new web3.eth.Contract(AgreementLogicJSON.abi, AgreementLogicJSON.networks.length > 0 ? (AgreementLogicJSON.networks[0]) : null))
        this.web3 = web3
    }


    async getAllLogAgreementFullySignedEvents(eventFilter?:SearchLog){
        let filterParams
        if(eventFilter){
            filterParams = {
                fromBlock: eventFilter.fromBlock? eventFilter.fromBlock: 0, 
                toBlock: eventFilter.toBlock? eventFilter.toBlock: 'latest'
            }
            if (eventFilter.topics) {
                filterParams.topics = eventFilter.topics;
            }
        } else {
            filterParams = {
                fromBlock:0,
                toBlock:'latest' 
            }
        }
        return await this.web3Contract.getPastEvents('LogAgreementFullySigned', filterParams)
    }
            
    async getAllLogAgreementCreatedEvents(eventFilter?:SearchLog){
        let filterParams
        if(eventFilter){
            filterParams = {
                fromBlock: eventFilter.fromBlock? eventFilter.fromBlock: 0, 
                toBlock: eventFilter.toBlock? eventFilter.toBlock: 'latest'
            }
            if (eventFilter.topics) {
                filterParams.topics = eventFilter.topics;
            }
        } else {
            filterParams = {
                fromBlock:0,
                toBlock:'latest' 
            }
        }
        return await this.web3Contract.getPastEvents('LogAgreementCreated', filterParams)
    }
            
    async getAllLogChangeOwnerEvents(eventFilter?:SearchLog){
        let filterParams
        if(eventFilter){
            filterParams = {
                fromBlock: eventFilter.fromBlock? eventFilter.fromBlock: 0, 
                toBlock: eventFilter.toBlock? eventFilter.toBlock: 'latest'
            }
            if (eventFilter.topics) {
                filterParams.topics = eventFilter.topics;
            }
        } else {
            filterParams = {
                fromBlock:0,
                toBlock:'latest' 
            }
        }
        return await this.web3Contract.getPastEvents('LogChangeOwner', filterParams)
    }
            
    async getAllEvents(eventFilter?:SearchLog){
        let filterParams
        if(eventFilter){
            filterParams = {
                fromBlock: eventFilter.fromBlock? eventFilter.fromBlock: 0,
                toBlock: eventFilter.toBlock? eventFilter.toBlock: 'latest',
                topics: eventFilter.topics? eventFilter.topics: [null]
            }
        } else {
            filterParams = {
                fromBlock:0,
                toBlock:'latest',
                topics:[null]
            }
        }
        return await this.web3Contract.getPastEvents('allEvents', filterParams)
    }
    	async createAgreement(_propertiesDocumentHash:string,_documentDBURL:string,_matcherPropertiesDocumentHash:string,_matcherDBURL:string,_demandId:number,_supplyId:number, txParams?:SpecialTx){

            let transactionParams

            const txData = await this.web3Contract.methods.createAgreement(_propertiesDocumentHash,_documentDBURL,_matcherPropertiesDocumentHash,_matcherDBURL,_demandId,_supplyId)
            .encodeABI()

            let gas

        

            if(txParams){

                if(txParams.privateKey){
                    const privateKey = txParams.privateKey.startsWith("0x") ? txParams.privateKey : "0x" + txParams.privateKey;
                    txParams.from = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
                    txParams.nonce = txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from))
                }

                if(!txParams.gas){

                    try{
                    gas = await this.web3Contract.methods.createAgreement(_propertiesDocumentHash,_documentDBURL,_matcherPropertiesDocumentHash,_matcherDBURL,_demandId,_supplyId)
                        .estimateGas({ from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0]} )
                    } catch(ex){

                        if (!(await getClientVersion(this.web3)).includes('Parity')) throw new Error(ex) ;

                        const errorResult = await this.getErrorMessage(this.web3, 
                            {
                            from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0] ,
                            to: this.web3Contract._address,
                            data: txData,
                            gas: this.web3.utils.toHex(7000000)
                            }
                         )
                         throw new Error(errorResult);

                    }
                    gas = Math.round(gas*2)
                    
                    txParams.gas = gas 
                }

                transactionParams = {
                    from: txParams.from ? txParams.from : (await this.web3.eth.getAccounts())[0],
                    gas: txParams.gas ? txParams.gas : Math.round(gas * 1.1 + 21000),
                    gasPrice: 0,
                    nonce: txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from)),
                    data: txParams.data ? txParams.data : '',
                    to: this.web3Contract._address,
                    privateKey: txParams.privateKey? txParams.privateKey: ""
                }
            }else {
                transactionParams = {from:(await this.web3.eth.getAccounts())[0],
                    gas:  Math.round(gas * 1.1 +21000),
                    gasPrice: 0,
                    nonce:  (await this.web3.eth.getTransactionCount((await this.web3.eth.getAccounts())[0])),
                    data: '',
                    to: this.web3Contract._address,
                    privateKey: ""
                }
            }
            
         
            if (transactionParams.privateKey !== '') {
            
                transactionParams.data = txData
                return (await this.sendRaw(this.web3, transactionParams.privateKey, transactionParams))
            } else {
                return await this.web3Contract.methods.createAgreement(_propertiesDocumentHash,_documentDBURL,_matcherPropertiesDocumentHash,_matcherDBURL,_demandId,_supplyId)
                    .send({from: transactionParams.from, gas: transactionParams.gas}) 
            }
	}
	async approveAgreementSupply(_agreementId:number, txParams?:SpecialTx){

            let transactionParams

            const txData = await this.web3Contract.methods.approveAgreementSupply(_agreementId)
            .encodeABI()

            let gas

        

            if(txParams){

                if(txParams.privateKey){
                    const privateKey = txParams.privateKey.startsWith("0x") ? txParams.privateKey : "0x" + txParams.privateKey;
                    txParams.from = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
                    txParams.nonce = txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from))
                }

                if(!txParams.gas){

                    try{
                    gas = await this.web3Contract.methods.approveAgreementSupply(_agreementId)
                        .estimateGas({ from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0]} )
                    } catch(ex){

                        if (!(await getClientVersion(this.web3)).includes('Parity')) throw new Error(ex) ;

                        const errorResult = await this.getErrorMessage(this.web3, 
                            {
                            from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0] ,
                            to: this.web3Contract._address,
                            data: txData,
                            gas: this.web3.utils.toHex(7000000)
                            }
                         )
                         throw new Error(errorResult);

                    }
                    gas = Math.round(gas*2)
                    
                    txParams.gas = gas 
                }

                transactionParams = {
                    from: txParams.from ? txParams.from : (await this.web3.eth.getAccounts())[0],
                    gas: txParams.gas ? txParams.gas : Math.round(gas * 1.1 + 21000),
                    gasPrice: 0,
                    nonce: txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from)),
                    data: txParams.data ? txParams.data : '',
                    to: this.web3Contract._address,
                    privateKey: txParams.privateKey? txParams.privateKey: ""
                }
            }else {
                transactionParams = {from:(await this.web3.eth.getAccounts())[0],
                    gas:  Math.round(gas * 1.1 +21000),
                    gasPrice: 0,
                    nonce:  (await this.web3.eth.getTransactionCount((await this.web3.eth.getAccounts())[0])),
                    data: '',
                    to: this.web3Contract._address,
                    privateKey: ""
                }
            }
            
         
            if (transactionParams.privateKey !== '') {
            
                transactionParams.data = txData
                return (await this.sendRaw(this.web3, transactionParams.privateKey, transactionParams))
            } else {
                return await this.web3Contract.methods.approveAgreementSupply(_agreementId)
                    .send({from: transactionParams.from, gas: transactionParams.gas}) 
            }
	}
	async update(_newLogic:string, txParams?:SpecialTx){

            let transactionParams

            const txData = await this.web3Contract.methods.update(_newLogic)
            .encodeABI()

            let gas

        

            if(txParams){

                if(txParams.privateKey){
                    const privateKey = txParams.privateKey.startsWith("0x") ? txParams.privateKey : "0x" + txParams.privateKey;
                    txParams.from = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
                    txParams.nonce = txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from))
                }

                if(!txParams.gas){

                    try{
                    gas = await this.web3Contract.methods.update(_newLogic)
                        .estimateGas({ from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0]} )
                    } catch(ex){

                        if (!(await getClientVersion(this.web3)).includes('Parity')) throw new Error(ex) ;

                        const errorResult = await this.getErrorMessage(this.web3, 
                            {
                            from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0] ,
                            to: this.web3Contract._address,
                            data: txData,
                            gas: this.web3.utils.toHex(7000000)
                            }
                         )
                         throw new Error(errorResult);

                    }
                    gas = Math.round(gas*2)
                    
                    txParams.gas = gas 
                }

                transactionParams = {
                    from: txParams.from ? txParams.from : (await this.web3.eth.getAccounts())[0],
                    gas: txParams.gas ? txParams.gas : Math.round(gas * 1.1 + 21000),
                    gasPrice: 0,
                    nonce: txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from)),
                    data: txParams.data ? txParams.data : '',
                    to: this.web3Contract._address,
                    privateKey: txParams.privateKey? txParams.privateKey: ""
                }
            }else {
                transactionParams = {from:(await this.web3.eth.getAccounts())[0],
                    gas:  Math.round(gas * 1.1 +21000),
                    gasPrice: 0,
                    nonce:  (await this.web3.eth.getTransactionCount((await this.web3.eth.getAccounts())[0])),
                    data: '',
                    to: this.web3Contract._address,
                    privateKey: ""
                }
            }
            
         
            if (transactionParams.privateKey !== '') {
            
                transactionParams.data = txData
                return (await this.sendRaw(this.web3, transactionParams.privateKey, transactionParams))
            } else {
                return await this.web3Contract.methods.update(_newLogic)
                    .send({from: transactionParams.from, gas: transactionParams.gas}) 
            }
	}
	async approveAgreementDemand(_agreementId:number, txParams?:SpecialTx){

            let transactionParams

            const txData = await this.web3Contract.methods.approveAgreementDemand(_agreementId)
            .encodeABI()

            let gas

        

            if(txParams){

                if(txParams.privateKey){
                    const privateKey = txParams.privateKey.startsWith("0x") ? txParams.privateKey : "0x" + txParams.privateKey;
                    txParams.from = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
                    txParams.nonce = txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from))
                }

                if(!txParams.gas){

                    try{
                    gas = await this.web3Contract.methods.approveAgreementDemand(_agreementId)
                        .estimateGas({ from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0]} )
                    } catch(ex){

                        if (!(await getClientVersion(this.web3)).includes('Parity')) throw new Error(ex) ;

                        const errorResult = await this.getErrorMessage(this.web3, 
                            {
                            from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0] ,
                            to: this.web3Contract._address,
                            data: txData,
                            gas: this.web3.utils.toHex(7000000)
                            }
                         )
                         throw new Error(errorResult);

                    }
                    gas = Math.round(gas*2)
                    
                    txParams.gas = gas 
                }

                transactionParams = {
                    from: txParams.from ? txParams.from : (await this.web3.eth.getAccounts())[0],
                    gas: txParams.gas ? txParams.gas : Math.round(gas * 1.1 + 21000),
                    gasPrice: 0,
                    nonce: txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from)),
                    data: txParams.data ? txParams.data : '',
                    to: this.web3Contract._address,
                    privateKey: txParams.privateKey? txParams.privateKey: ""
                }
            }else {
                transactionParams = {from:(await this.web3.eth.getAccounts())[0],
                    gas:  Math.round(gas * 1.1 +21000),
                    gasPrice: 0,
                    nonce:  (await this.web3.eth.getTransactionCount((await this.web3.eth.getAccounts())[0])),
                    data: '',
                    to: this.web3Contract._address,
                    privateKey: ""
                }
            }
            
         
            if (transactionParams.privateKey !== '') {
            
                transactionParams.data = txData
                return (await this.sendRaw(this.web3, transactionParams.privateKey, transactionParams))
            } else {
                return await this.web3Contract.methods.approveAgreementDemand(_agreementId)
                    .send({from: transactionParams.from, gas: transactionParams.gas}) 
            }
	}
	async getAllAgreementListLength(txParams ?: SpecialTx){
		return (await this.web3Contract.methods.getAllAgreementListLength().call(txParams)) 
	}
	async userContractLookup(txParams ?: SpecialTx){
		return (await this.web3Contract.methods.userContractLookup().call(txParams)) 
	}
	async db(txParams ?: SpecialTx){
		return (await this.web3Contract.methods.db().call(txParams)) 
	}
	async getAgreement(_agreementId:number, txParams?:SpecialTx){
		return (await this.web3Contract.methods.getAgreement(_agreementId).call(txParams)) 
	}
	async setMatcherProperties(_agreementId:number,_matcherPropertiesDocumentHash:string,_matcherDBURL:string, txParams?:SpecialTx){

            let transactionParams

            const txData = await this.web3Contract.methods.setMatcherProperties(_agreementId,_matcherPropertiesDocumentHash,_matcherDBURL)
            .encodeABI()

            let gas

        

            if(txParams){

                if(txParams.privateKey){
                    const privateKey = txParams.privateKey.startsWith("0x") ? txParams.privateKey : "0x" + txParams.privateKey;
                    txParams.from = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
                    txParams.nonce = txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from))
                }

                if(!txParams.gas){

                    try{
                    gas = await this.web3Contract.methods.setMatcherProperties(_agreementId,_matcherPropertiesDocumentHash,_matcherDBURL)
                        .estimateGas({ from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0]} )
                    } catch(ex){

                        if (!(await getClientVersion(this.web3)).includes('Parity')) throw new Error(ex) ;

                        const errorResult = await this.getErrorMessage(this.web3, 
                            {
                            from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0] ,
                            to: this.web3Contract._address,
                            data: txData,
                            gas: this.web3.utils.toHex(7000000)
                            }
                         )
                         throw new Error(errorResult);

                    }
                    gas = Math.round(gas*2)
                    
                    txParams.gas = gas 
                }

                transactionParams = {
                    from: txParams.from ? txParams.from : (await this.web3.eth.getAccounts())[0],
                    gas: txParams.gas ? txParams.gas : Math.round(gas * 1.1 + 21000),
                    gasPrice: 0,
                    nonce: txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from)),
                    data: txParams.data ? txParams.data : '',
                    to: this.web3Contract._address,
                    privateKey: txParams.privateKey? txParams.privateKey: ""
                }
            }else {
                transactionParams = {from:(await this.web3.eth.getAccounts())[0],
                    gas:  Math.round(gas * 1.1 +21000),
                    gasPrice: 0,
                    nonce:  (await this.web3.eth.getTransactionCount((await this.web3.eth.getAccounts())[0])),
                    data: '',
                    to: this.web3Contract._address,
                    privateKey: ""
                }
            }
            
         
            if (transactionParams.privateKey !== '') {
            
                transactionParams.data = txData
                return (await this.sendRaw(this.web3, transactionParams.privateKey, transactionParams))
            } else {
                return await this.web3Contract.methods.setMatcherProperties(_agreementId,_matcherPropertiesDocumentHash,_matcherDBURL)
                    .send({from: transactionParams.from, gas: transactionParams.gas}) 
            }
	}
	async assetContractLookup(txParams ?: SpecialTx){
		return (await this.web3Contract.methods.assetContractLookup().call(txParams)) 
	}
	async owner(txParams ?: SpecialTx){
		return (await this.web3Contract.methods.owner().call(txParams)) 
	}
	async changeOwner(_newOwner:string, txParams?:SpecialTx){

            let transactionParams

            const txData = await this.web3Contract.methods.changeOwner(_newOwner)
            .encodeABI()

            let gas

        

            if(txParams){

                if(txParams.privateKey){
                    const privateKey = txParams.privateKey.startsWith("0x") ? txParams.privateKey : "0x" + txParams.privateKey;
                    txParams.from = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
                    txParams.nonce = txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from))
                }

                if(!txParams.gas){

                    try{
                    gas = await this.web3Contract.methods.changeOwner(_newOwner)
                        .estimateGas({ from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0]} )
                    } catch(ex){

                        if (!(await getClientVersion(this.web3)).includes('Parity')) throw new Error(ex) ;

                        const errorResult = await this.getErrorMessage(this.web3, 
                            {
                            from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0] ,
                            to: this.web3Contract._address,
                            data: txData,
                            gas: this.web3.utils.toHex(7000000)
                            }
                         )
                         throw new Error(errorResult);

                    }
                    gas = Math.round(gas*2)
                    
                    txParams.gas = gas 
                }

                transactionParams = {
                    from: txParams.from ? txParams.from : (await this.web3.eth.getAccounts())[0],
                    gas: txParams.gas ? txParams.gas : Math.round(gas * 1.1 + 21000),
                    gasPrice: 0,
                    nonce: txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from)),
                    data: txParams.data ? txParams.data : '',
                    to: this.web3Contract._address,
                    privateKey: txParams.privateKey? txParams.privateKey: ""
                }
            }else {
                transactionParams = {from:(await this.web3.eth.getAccounts())[0],
                    gas:  Math.round(gas * 1.1 +21000),
                    gasPrice: 0,
                    nonce:  (await this.web3.eth.getTransactionCount((await this.web3.eth.getAccounts())[0])),
                    data: '',
                    to: this.web3Contract._address,
                    privateKey: ""
                }
            }
            
         
            if (transactionParams.privateKey !== '') {
            
                transactionParams.data = txData
                return (await this.sendRaw(this.web3, transactionParams.privateKey, transactionParams))
            } else {
                return await this.web3Contract.methods.changeOwner(_newOwner)
                    .send({from: transactionParams.from, gas: transactionParams.gas}) 
            }
	}
	async isRole(_role:number,_caller:string, txParams?:SpecialTx){
		return (await this.web3Contract.methods.isRole(_role,_caller).call(txParams)) 
	}
	async getAgreementStruct(_agreementId:number, txParams?:SpecialTx){
		return (await this.web3Contract.methods.getAgreementStruct(_agreementId).call(txParams)) 
	}
	async init(_database:string,_admin:string, txParams?:SpecialTx){

            let transactionParams

            const txData = await this.web3Contract.methods.init(_database,_admin)
            .encodeABI()

            let gas

        

            if(txParams){

                if(txParams.privateKey){
                    const privateKey = txParams.privateKey.startsWith("0x") ? txParams.privateKey : "0x" + txParams.privateKey;
                    txParams.from = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
                    txParams.nonce = txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from))
                }

                if(!txParams.gas){

                    try{
                    gas = await this.web3Contract.methods.init(_database,_admin)
                        .estimateGas({ from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0]} )
                    } catch(ex){

                        if (!(await getClientVersion(this.web3)).includes('Parity')) throw new Error(ex) ;

                        const errorResult = await this.getErrorMessage(this.web3, 
                            {
                            from: txParams ? txParams.from : (await this.web3.eth.getAccounts())[0] ,
                            to: this.web3Contract._address,
                            data: txData,
                            gas: this.web3.utils.toHex(7000000)
                            }
                         )
                         throw new Error(errorResult);

                    }
                    gas = Math.round(gas*2)
                    
                    txParams.gas = gas 
                }

                transactionParams = {
                    from: txParams.from ? txParams.from : (await this.web3.eth.getAccounts())[0],
                    gas: txParams.gas ? txParams.gas : Math.round(gas * 1.1 + 21000),
                    gasPrice: 0,
                    nonce: txParams.nonce ? txParams.nonce : (await this.web3.eth.getTransactionCount(txParams.from)),
                    data: txParams.data ? txParams.data : '',
                    to: this.web3Contract._address,
                    privateKey: txParams.privateKey? txParams.privateKey: ""
                }
            }else {
                transactionParams = {from:(await this.web3.eth.getAccounts())[0],
                    gas:  Math.round(gas * 1.1 +21000),
                    gasPrice: 0,
                    nonce:  (await this.web3.eth.getTransactionCount((await this.web3.eth.getAccounts())[0])),
                    data: '',
                    to: this.web3Contract._address,
                    privateKey: ""
                }
            }
            
         
            if (transactionParams.privateKey !== '') {
            
                transactionParams.data = txData
                return (await this.sendRaw(this.web3, transactionParams.privateKey, transactionParams))
            } else {
                return await this.web3Contract.methods.init(_database,_admin)
                    .send({from: transactionParams.from, gas: transactionParams.gas}) 
            }
	}

}
    