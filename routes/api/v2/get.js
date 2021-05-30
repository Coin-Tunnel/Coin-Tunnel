
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.get("/", apiLimiter, async (req, res) => {
        res.status(400).send({
            status: "failed",
            reason: "no response type found in your path! /api/v2/txinfo/responsetype/transactionType/APIkey",
            timeStamp: Date.now()
        })
    })
    router.get("/:responsetype", apiLimiter, async (req, res) => {
        res.status(400).send({
            status: "failed",
            reason: "no transaction type found in your path! /api/v2/txinfo/responsetype/transactionType/APIkey",
            timeStamp: Date.now()
        })
    })
    router.get("/raw/:responsetype/:type", apiLimiter, async (req, res) => {
        res.status(400).send({
            status: "failed",
            reason: "no apikey type found in your path! /api/v2/txinfo/responsetype/transactionType/APIkey",
            timeStamp: Date.now()
        })
    })
    router.get("/raw/:type/:apikey", apiLimiter, async (req, res) => {
        if (!req.params.type) return res.status(400).send({
          status: "failed",
          reason: "no type of query found"
        })
        if (!req.params.apikey) return res.status(401).send({
          status: "failed",
          reason: "invalid api key"
        });
        // hash key
        let prefix = req.params.apikey.slice(0, 10);
        let key = req.params.apikey.slice(10);
      
        const hmac = createHmac('sha512', key);
        hmac.update(JSON.stringify(prefix));
        const signature = hmac.digest('hex');
      
        let dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({hash: signature})
        if (!dbKey) return res.status(401).send({
          status: "failed",
          reason: "Invalid API key",
          timeStamp: Date.now()
        })
        await mongoclient.db("cointunnel").collection("keys")
           .updateOne({hash: signature}, { $inc: {"uses":1}})
        let currentIp = req.connection.remoteAddress;
        if (!dbKey.ip.includes(currentIp)){
          await mongoclient.db("cointunnel").collection("keys")
            .updateOne({hash: signature}, {$push: {ip: currentIp}})
        }
        let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: dbKey.userId});
        if (!merchant) return res.status(500).send({
          status: "failed",
          reason: "internal server error",
          cause: "could not find a merchant with userid "+dbKey.userId+" In correct amount of time",
          timeStamp: Date.now()
        })
            // check key
        if (req.params.type.toLowerCase().includes("succes")){
           let allTxs = await mongoclient.db("cointunnel").collection("finished-transactions")
             .find({merchant: merchant.name})
           let array = await allTxs.toArray();
              for (var i = 0; i<array.length; i++){
                delete array[i]._id;
                delete array[i].buyerId
              }
           return res.send({
             status: "ok",
             data: array,
             timeStamp: Date.now()
           })
        }else if (req.params.type.toLowerCase().includes("fail")){
          let allTxs = await mongoclient.db("cointunnel").collection("err-transactions")
          .find({"merchant": merchant.name})
        let array = await allTxs.toArray();
           for (var i = 0; i<array.length; i++){
             delete array[i]._id;
           }
        return res.send({
          status: "ok",
          data: array,
          timeStamp: Date.now()
        })
        }else if (req.params.type.toLowerCase().includes("open")){
          let allTxs = await mongoclient.db("cointunnel").collection("open-transactions")
             .find({merchant: merchant.name})
           let array = await allTxs.toArray();
              for (var i = 0; i<array.length; i++){
                delete array[i]._id;
                delete array[i].buyerId
              }
           return res.send({
             status: "ok",
             data: array,
             timeStamp: Date.now()
           })
        }else if (req.params.type.toLowerCase().includes("all")){
          let allSuccess = await mongoclient.db("cointunnel").collection("finished-transactions")
             .find({merchant: merchant.name})
           let successful = await allSuccess.toArray();
              for (var i = 0; i<successful.length; i++){
                delete successful[i]._id;
                delete successful[i].buyerId
              }
          let allFailed = await mongoclient.db("cointunnel").collection("err-transactions")
              .find({"merchant": merchant.name})
          let failed = await allFailed.toArray();
              for (var i = 0; i<failed.length; i++){
                 delete failed[i]._id;
              }
          let allOpen = await mongoclient.db("cointunnel").collection("open-transactions")
              .find({merchant: merchant.name})
            let open = await allOpen.toArray();
               for (var i = 0; i<open.length; i++){
                 delete open[i]._id;
                 delete open[i].buyerId
               }
          res.status(200).send({
            status: "ok",
            successful_txs: successful,
            failed_txs: failed,
            open_txs: open,
          })
        }else return res.status(400).send({
          status: "failed",
          reason: "no valid `type` parameter.",
          fix: "Include a type parameter like this: /api/v1/success/:apikey",
          timeStamp: Date.now()
        })
    })
    router.get("/html/:type/:apikey", apiLimiter, async (req, res) => {
        if (!req.params.type) return res.status(400).send({
            status: "failed",
            reason: "no type of query found"
          })
          var dbKey = {};
          if (req.params.apikey === "session" && !req.session.muser) return res.status(401).send({
            status: "failed",
            reason: "invalid api key or no merchant session"
          });
          if (req.params.apikey !== "session"){
// hash key
let prefix = req.params.apikey.slice(0, 10);
let key = req.params.apikey.slice(10);

const hmac = createHmac('sha512', key);
hmac.update(JSON.stringify(prefix));
const signature = hmac.digest('hex');

dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({hash: signature})
if (!dbKey) return res.status(401).send({
  status: "failed",
  reason: "Invalid API key",
  timeStamp: Date.now()
})
await mongoclient.db("cointunnel").collection("keys")
   .updateOne({hash: signature}, { $inc: {"uses":1}})
let currentIp = req.connection.remoteAddress;
if (!dbKey.ip.includes(currentIp)){
  await mongoclient.db("cointunnel").collection("keys")
    .updateOne({hash: signature}, {$push: {ip: currentIp}})
}
          }else dbKey.userId = req.session.muser;
          let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: dbKey.userId});
          if (!merchant) return res.status(500).send({
            status: "failed",
            reason: "internal server error",
            cause: "could not find a merchant with userid "+dbKey.userId+" In correct amount of time",
            timeStamp: Date.now()
          })
              // check key
          if (req.params.type.toLowerCase().includes("succes")){
             let allTxs = await mongoclient.db("cointunnel").collection("finished-transactions")
               .find({merchant: merchant.name})
             let array = await allTxs.toArray();
                for (var i = 0; i<array.length; i++){
                  delete array[i]._id;
                  delete array[i].buyerId
                }
             let send = {
                status: "ok",
                data: array,
                timeStamp: Date.now()
             }
             send = JSON.stringify(send);
             res.render("jsonviewer", {jsonRendered: send, fillin: req.query.fillin || ""})
          }else if (req.params.type.toLowerCase().includes("fail")){
            let allTxs = await mongoclient.db("cointunnel").collection("err-transactions")
            .find({"merchant": merchant.name})
          let array = await allTxs.toArray();
             for (var i = 0; i<array.length; i++){
               delete array[i]._id;
             }
          let send = {
            status: "ok",
            data: array,
            timeStamp: Date.now()
         }
         send = JSON.stringify(send);
         res.render("jsonviewer", {jsonRendered: send, fillin: req.query.fillin || ""})
          }else if (req.params.type.toLowerCase().includes("open")){
            let allTxs = await mongoclient.db("cointunnel").collection("open-transactions")
               .find({merchant: merchant.name})
             let array = await allTxs.toArray();
                for (var i = 0; i<array.length; i++){
                  delete array[i]._id;
                  delete array[i].buyerId
                }
                let send = {
                    status: "ok",
                    data: array,
                    timeStamp: Date.now()
                 }
                 send = JSON.stringify(send);
                 res.render("jsonviewer", {jsonRendered: send, fillin: req.query.fillin || ""})
          }else if (req.params.type.toLowerCase().includes("all")){
            let allSuccess = await mongoclient.db("cointunnel").collection("finished-transactions")
               .find({merchant: merchant.name})
             let successful = await allSuccess.toArray();
                for (var i = 0; i<successful.length; i++){
                  delete successful[i]._id;
                  delete successful[i].buyerId
                }
            let allFailed = await mongoclient.db("cointunnel").collection("err-transactions")
                .find({"merchant": merchant.name})
            let failed = await allFailed.toArray();
                for (var i = 0; i<failed.length; i++){
                   delete failed[i]._id;
                }
            let allOpen = await mongoclient.db("cointunnel").collection("open-transactions")
                .find({merchant: merchant.name})
              let open = await allOpen.toArray();
                 for (var i = 0; i<open.length; i++){
                   delete open[i]._id;
                   delete open[i].buyerId
                 }
                 let send = {
                    status: "ok",
                    successful_txs: successful,
                    failed_txs: failed,
                    open_txs: open,
                 }
                 send = JSON.stringify(send);
                 res.render("jsonviewer", {jsonRendered: send, fillin: req.query.fillin || ""})
          }else return res.status(400).send({
            status: "failed",
            reason: "no valid `type` parameter.",
            fix: "Include a type parameter like this: /api/v2/txinfo/html/success/:apikey",
            timeStamp: Date.now()
          })
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
