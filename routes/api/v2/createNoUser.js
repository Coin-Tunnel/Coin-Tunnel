
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
var coinInfo = require('coininfo')  //0.1.0
var CoinKey = require('coinkey')    //1.0.0
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {

    router.post("/ltc", apiLimiter, async (req, res) => {
        if (!req.headers.authorization) return res.status(401).send({
          status: "failed",
          reason: "no apparent authorization header",
          timeStamp: Date.now()
        })
        let prefix = req.headers.authorization.slice(0, 10);
        let key = req.headers.authorization.slice(10);
      
        const hmac = createHmac('sha512', key);
        hmac.update(JSON.stringify(prefix));
        const signature = hmac.digest('hex');
      
        let dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({hash: signature})
        if (!dbKey) return res.status(401).send({
          status: "failed",
          reason: "Incorrect API key",
          timeStamp: Date.now()
        })
        await mongoclient.db("cointunnel").collection("keys")
           .updateOne({hash: signature}, { $inc: {"uses":1}})
        let currentIp = req.connection.remoteAddress;
        if (!dbKey.ip.includes(currentIp)){
          await mongoclient.db("cointunnel").collection("keys")
            .updateOne({hash: signature}, {$push: {ip: currentIp}})
        }
        let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: dbKey.userId});
        if (!user) return res.status(401).send({
          status: "failed",
          reason: "Merchant account is gone",
          timeStamp: Date.now()
        })
      
        var callback = req.body.callback;
        var usd = req.body.usd;
        var note = req.body.note;
        var amountOfLtc;
        var txid = await makeid(35);
        var accuracy = 95;
        txid = "T"+txid;
        if (!req.body.callback) return res.status(400).send({status: "failed", reason: "No callback url found in body", timeStamp: Date.now()});
        if (!req.body.usd) return res.status(400).send({status: "failed", reason: "no USD amount found in body!", timeStamp: Date.now()})
        if (req.body.accuracy) accuracy = req.body.accuracy
        if (accuracy < 50) return res.status(400).send({
          status: "failed",
          reason: "accuracy too low",
          timeStamp: Date.now()
        })
      let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd")
      prices = await prices.json()
      let ltcPrice = Number(prices.litecoin.usd)
      amountOfLtc = usd/ltcPrice;
      if (amountOfLtc < 0.003) return res.status(400).send({status: "failed", reason: "LTC equivalent too low! Minimum is 0.003"})
      // generate new address FIX THIS
      var liteInfo = coinInfo('LTC').versions;
      var ck = new CoinKey.createRandom(liteInfo);

      let tempAddress = ck.publicAddress;
      let encryptedadr = await encrypt(ck.privateWif)
      // create mongodb transaction
      await mongoclient.db("cointunnel").collection("open-transactions").insertOne({
        merchant: user.name,
        price_in_usd: usd,
        price_in_crypto: amountOfLtc,
        coin: "LTC",
        version: "v2",
        creation: Date.now(),
        callback: callback,
        note: note,
        txid: txid,
        type: "no buyer account",
        accuracy: accuracy,
        publicAddress: tempAddress,
        privateAddress: encryptedadr,
        expiry: Date.now()+1800000
      })
      await mongoclient.db("cointunnel").collection("watched-wallets").insertOne({
        wallet: tempAddress,
        secret: encryptedadr,
        merchant: user.name,
        price_in_crypto: amountOfLtc,
        coin: "LTC",
        version: "v2",
        txid: txid,
        accuracy: accuracy,
        expiry: Date.now()+1800000
      })
      // send new address to callback
      return res.status(200).send({
        status: "ok",
        note: note,
        price_in_usd: usd,
        price_in_crypto: amountOfLtc,
        coin: "LTC",
        deposit_adr: tempAddress,
        accuracy: accuracy,
        type: "no buyer account",
        txid: txid,
        callback: callback,
        timeStamp: Date.now()
      })///
      // listen for deposits
    })

    router.post("/eth", apiLimiter, async (req, res) => {
        if (!req.headers.authorization) return res.status(401).send({
          status: "failed",
          reason: "no apparent authorization header",
          timeStamp: Date.now()
        })
        let prefix = req.headers.authorization.slice(0, 10);
        let key = req.headers.authorization.slice(10);
      
        const hmac = createHmac('sha512', key);
        hmac.update(JSON.stringify(prefix));
        const signature = hmac.digest('hex');
      
        let dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({hash: signature})
        if (!dbKey) return res.status(401).send({
          status: "failed",
          reason: "Incorrect API key",
          timeStamp: Date.now()
        })
        await mongoclient.db("cointunnel").collection("keys")
           .updateOne({hash: signature}, { $inc: {"uses":1}})
        let currentIp = req.connection.remoteAddress;
        if (!dbKey.ip.includes(currentIp)){
          await mongoclient.db("cointunnel").collection("keys")
            .updateOne({hash: signature}, {$push: {ip: currentIp}})
        }
        let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: dbKey.userId});
        if (!user) return res.status(401).send({
          status: "failed",
          reason: "Merchant account is gone",
          timeStamp: Date.now()
        })
      
        var callback = req.body.callback;
        var usd = req.body.usd;
        var note = req.body.note;
        var amountOfEth;
        var txid = await makeid(35);
        var accuracy = 95;
        txid = "T"+txid;
        if (!req.body.callback) return res.status(400).send({status: "failed", reason: "No callback url found in body", timeStamp: Date.now()});
        if (!req.body.usd) return res.status(400).send({status: "failed", reason: "no USD amount found in body!", timeStamp: Date.now()})
        if (req.body.accuracy) accuracy = req.body.accuracy
        if (accuracy < 50) return res.status(400).send({
          status: "failed",
          reason: "accuracy too low",
          timeStamp: Date.now()
        })
      let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      prices = await prices.json()
      let ethPrice = Number(prices.ethereum.usd)
      amountOfEth = usd/ethPrice;
      
      // generate new address CHANGE THIS
        const { ethers } = require("ethers");
        const randomMnemonic = ethers.Wallet.createRandom().mnemonic;
        const wallet = ethers.Wallet.fromMnemonic(randomMnemonic.phrase);
        let signingkey = wallet._signingKey();
        let encryptedadr = await encrypt(signingkey.privateKey);

      let tempAddress = wallet.address;
      // create mongodb transaction
      await mongoclient.db("cointunnel").collection("open-transactions").insertOne({
        merchant: user.name,
        price_in_usd: usd,
        price_in_crypto: amountOfEth,
        coin: "ETH",
        version: "v2",
        creation: Date.now(),
        callback: callback,
        note: note,
        txid: txid,
        type: "no buyer account",
        accuracy: accuracy,
        publicAddress: tempAddress,
        privateAddress: encryptedadr,
        expiry: Date.now()+86400000
      })
      await mongoclient.db("cointunnel").collection("watched-wallets").insertOne({
        wallet: tempAddress,
        secret: encryptedadr,
        merchant: user.name,
        price_in_crypto: amountOfEth,
        coin: "ETH",
        version: "v2",
        txid: txid,
        accuracy: accuracy,
        expiry: Date.now()+86400000
      })
      // send new address to callback
      return res.status(200).send({
        status: "ok",
        note: note,
        price_in_usd: usd,
        price_in_crypto: amountOfEth,
        coin: "ETH",
        deposit_adr: tempAddress,
        accuracy: accuracy,
        type: "no buyer account",
        expiry: Date.now()+86400000,
        txid: txid,
        callback: callback,
        timeStamp: Date.now()
      })///
      // listen for deposits
    })
})


module.exports = function(var1){
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
 
    secrets = var1.secrets;
    bitcore = var1.bitcore;
    bitcoin = var1.bitcoin;
    sochain_network = var1.sochain_network;
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
   return router;
}
