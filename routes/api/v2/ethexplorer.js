const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}


sleep(1000).then(thing => {
    const Web3 = require("web3");
    const ethNetwork = `https://mainnet.infura.io/v3/${secrets.infura}`;
    const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));

    router.get('/auto/:hash', async (req, res) => {
        if (!req.params.hash) return res.status(400).send({status: "failed", reason: "No ethereum hash included in path!"});
        var type;
        var response;
        if (req.params.hash.length === 66) type = "txhash";
        else if (req.params.hash.length === 42) type  = "address";
        else if (Number(req.params.hash).toString().toLowerCase() !== "nan") type = "blocknum";
        else return res.status(400).send({status: "failed", reason: "invalid ETH hash!"})
        if (type === "txhash"){
            let transaction = await web3.eth.getTransaction(req.params.hash).catch(err => {return "error: "+err.toString()});
            if (JSON.stringify(transaction).toLowerCase().includes("error: ")){
                return res.status(400).send({
                    status: "failed",
                    reason: transaction.slice(7)
                })
            }
            response = transaction;
        }else if (type === "address"){
            let transaction = await web3.eth.getBalance(req.params.hash).catch(err => {return "error: "+err.toString()});
            if (JSON.stringify(transaction).toLowerCase().includes("error: ")){
                return res.status(400).send({
                    status: "failed",
                    reason: transaction.slice(7)
                })
            }
            let txcount = await web3.eth.getTransactionCount(req.params.hash)
            response = {
                wei: transaction,
                transactionCount: txcount
            }
        }else if (type === "blocknum"){
            let transaction = await web3.eth.getBlock(Number(req.params.hash)).catch(err => {return "error: "+err.toString()});
            if (JSON.stringify(transaction).toLowerCase().includes("error: ")){
                return res.status(400).send({
                    status: "failed",
                    reason: transaction.slice(7)
                })
            }
            response = transaction;
        }
        res.send({status: "ok", data: response})
    })
    router.get('/blockheight', async (req, res) => {
        let x = await web3.eth.getBlockNumber()
        res.status(200).send(x.toString())
    })
    router.get('/gasprice', async (req, res) => {
        let x = await web3.eth.getGasPrice();
        res.status(200).send(x.toString());
    })
    router.post('/pushtx/:tx', async (req, res) => {
       if (!req.params.tx) return res.status(200).send({status: "failed", reason: "no serialized tx found in path!"});
       let transaction = await web3.eth.sendSignedTransaction(req.params.tx).catch(err => {return "error: "+err.toString()});
       if (JSON.stringify(transaction).toLowerCase().includes("error: ")){
           return res.status(400).send({
               status: "failed",
               reason: transaction.slice(7)
           })
       }
       return res.send(transaction);
    })
    router.get("/tx/:tx", async (req, res) => {
        if (!req.params.tx) return res.status(400).send({status: "failed", reason: "You must enter a valid transaction hash!"});
        let transaction = await web3.eth.getTransaction(req.params.tx).catch(err => {return "error: "+err.toString()});
        if (JSON.stringify(transaction).toLowerCase().includes("error: ")){
            return res.status(400).send({
                status: "failed",
                reason: transaction.slice(7)
            })
        }
        console.log(transaction)
        return res.send(transaction);
    })
    router.get('/getproof', async (req, res) => {
        if (!req.query.address) return res.status(400).send({status: "failed", reason: "no apparent address found in query"});
        if (!req.query.storageKey) return res.status(400).send({status: "failed", reason: "no apprent storage key found in query! Syntax: `storageKey`"});
        if (!req.query.blockNumber) return res.status(400).send({status: "failed", reason: "no apparent block number found in query! Syntax: `blockNumber` options: `current`, `[any block number]`"})
        if (req.query.blockNumber === "current") req.query.blockNumber = await web3.eth.getBlockNumber();
        req.query.blockNumber = Number(req.query.blockNumber);
        var result;
        try{
           result = await web3.eth.getProof(req.query.address, req.query.storageKey, req.query.blockNumber).catch(err => {return "error: "+err.toString()});
        }catch(err){
            console.log(err.toString())
            return res.status(400).send({status: "failed", reason: err.toString()})
        }
        if (JSON.stringify(result).toLowerCase().includes("error: ")){
            return res.status(400).send({
                status: "failed",
                reason: transaction.slice(7)
            })
        }
        res.send({status: "ok", data: result})
    })
})


module.exports = function(var1){

    secrets = var1.secrets;
    bitcore = var1.bitcore;
    bitcoin = var1.bitcoin;
    BitcoinjsNetwork = var1.BitcoinjsNetwork;
    nodemailer = var1.nodemailer;
    requestIp = var1.requestIp;
    createHmac= var1.createHmac;
    crypto = var1.crypto;
    rateLimit = var1.rateLimit;
    axios = var1.axios;
    fetch = var1.fetch;
    FormData = var1.FormData;
    bodyParser = var1.bodyParser;
    clientId = var1.clientId;
    clientSecret = var1.clientSecret;
    scopes = var1.scopes;
    redirectUri = var1.redirectUri;
    secretKey = secrets.secret;
    apiLimiter = var1.apiLimiter;
    longLimiter = var1.longLimiter;
    guiLimiter = var1.guiLimiter;
    iv = crypto.randomBytes(16);
    router.use(bodyParser.json({ extended: true }));

    mongoclient = var1.mongoclient;
    checkUser = var1.checkUser;
    updateDocumentSet = var1.updateDocumentSet;
    createListing = var1.createListing;
    swap = var1.swap;
    updateUser = var1.updateUser;
    createUser = var1.createUser;
    checkStuff = var1.checkStuff;
    sleep = var1.sleep;
    sendBitcoin = var1.sendBitcoin;
    sendBitcoinIncludeFee = var1.sendBitcoinIncludeFee;
    getTxFee = var1.getTxFee;
    checkTxFee = var1.checkTxFee;
    generateKeyPairs = var1.generateKeyPairs;
    encrypt = var1.encrypt;
    decrypt = var1.decrypt;
    makeid = var1.makeid;
  
   return router;
}
