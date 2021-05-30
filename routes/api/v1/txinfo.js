const MongoClient = require('mongodb/lib/mongo_client');

const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
  router.get("/useSession/:txid", apiLimiter, async (req, res) => {
    if (!req.session.muser) return res.status(403).send({
      status: "failed",
      reason: "no valid session found!"
    })
        var tx;
        var type;
        let merchantId = req.session.muser;
        tx = await mongoclient.db("cointunnel").collection("finished-transactions")
           .findOne({txid: req.params.txid, merchant: merchantId});
        if (tx) type = "payment received"
        if (!tx){ tx = await mongoclient.db("cointunnel").collection("open-transactions").findOne({txid: req.params.txid, merchant: merchantId}); if (tx) type = "Awaiting payment"}
        
        if (!tx){ tx = await mongoclient.db("cointunnel").collection("err-transactions").findOne({txid: req.params.txid, merchant: merchantId}); if (tx) type = "Errored Transactions"}
        if (!tx){ tx = await mongoclient.db("cointunnel").collection("err-transactions").findOne({"data.txid": req.params.txid, "data.merchant": merchantId}); if (tx) type = "Errored Transactions"}
        console.log(tx)
        // put error transactions in here too
        if (!tx) return res.status(404).send({status: "failed", reason: "Could not find transaction id: "+req.params.txid+" for user: "+merchantId});
        delete tx._id
        delete tx.privateAddress
        tx = JSON.stringify(tx)
        res.render("jsonviewer", {jsonRendered: tx, fillin: req.query.fillin || ""})
        //res.status(200).send({status: "ok", "payment-status": type, data: tx})
  })
    router.get("/", apiLimiter, async (req, res) => {
        res.status(400).send({
            status: "failed",
            reason: "no transaction id found in your path! /api/v1/txinfo/transactionID/APIkey",
            timeStamp: Date.now()
        })
    })
    router.get("/:txid", apiLimiter, async (req, res) => {
        res.status(400).send({
            status: "failed",
            reason: "no api Key found in your path! /api/v1/txinfo/transactionID/APIkey",
            timeStamp: Date.now()
        })
    })
    router.get("/:txid/:apikey", apiLimiter, async (req, res) => {
        if (!req.params.txid) return res.status(400).send({
          status: "failed",
          reason: "No transaction ID! (/api/v1/:txid/:apikey)",
          timeStamp: Date.now()
        })
        else if (!req.params.apikey) return res.status(401).send({
          status: "failed",
          reason: "No api key! (/api/v1/:txid/:apikey)",
          timeStamp: Date.now()
        })
        // hash stupid api key
        let prefix = req.params.apikey.slice(0, 10);
        let key = req.params.apikey.slice(10);
      
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
        // update dbkey uses 
        let merchantId = dbKey.userId;
        var tx;
        var type;
        tx = await mongoclient.db("cointunnel").collection("finished-transactions")
           .findOne({txid: req.params.txid, merchant: merchantId});
        if (tx) type = "payment received"
        if (!tx){ tx = await mongoclient.db("cointunnel").collection("open-transactions").findOne({txid: req.params.txid, merchant: merchantId}); if (tx) type = "Awaiting payment"}
        
        if (!tx){ tx = await mongoclient.db("cointunnel").collection("err-transactions").findOne({txid: req.params.txid, merchant: merchantId}); if (tx) type = "Errored Transactions"}
        if (!tx){ tx = await mongoclient.db("cointunnel").collection("err-transactions").findOne({"data.txid": req.params.txid, "data.merchant": merchantId}); if (tx) type = "Errored Transactions"}

        // put error transactions in here too
        if (!tx) return res.status(404).send({status: "failed", reason: "Could not find transaction id: "+req.params.txid+" for user: "+merchantId});
        delete tx._id
        delete tx.privateAddress
        res.status(200).send({status: "ok", "payment-status": type, data: tx})
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
