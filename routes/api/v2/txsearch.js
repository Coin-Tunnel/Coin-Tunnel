
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.get("/raw", apiLimiter, async (req, res) => {
        if (!req.headers.authorization) return res.status(401).send({
          status: "failed",
          reason: "invalid API key",
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
        });
        var type = "none";
        if (!req.query.type) return res.status(400).send({status: "failed", reason: "no type in query", timeStamp: Date.now()})
        if (req.query.type.toLowerCase().includes("succes")) type = "finished-transactions";
        else if (req.query.type.toLowerCase().includes("fail")) type = "err-transactions";
        else if (req.query.type.toLowerCase().includes("open")) type = "open-transactions";
        else if (req.query.type.toLowerCase().includes("all")) type = "all";
        else res.status(400).send({status: "failed", reason: "either no type parameter posted or invalid type", timeStamp: Date.now()});
        var send;
        if (!req.query.filter){
          if (type !== "all"){
            send = await mongoclient.db("cointunnel").collection(type).find({merchant: user.name});
            send = await send.toArray();
            if (send.length === 0){
              send = await mongoclient.db("cointunnel").collection("err-transactions").find({"data.merchant": user.name});
              send = await send.toArray()
              let sendx = await mongoclient.db('cointunnel').collection("err-transactions").find({merchant: user.name});
              sendx = await sendx.toArray();
              let send = await send.concat(sendx);
            }
          }else{
             let finished = await mongoclient.db("cointunnel").collection("finished-transactions").find({merchant: user.name}).toArray();
             let open = await mongoclient.db("cointunnel").collection("open-transactions").find({merchant: user.name}).toArray();
             let error = await mongoclient.db("cointunnel").collection("err-transactions").find({"data.merchant": user.name}).toArray();
             let errorx = await mongoclient.db("cointunnel").collection("err-transactions").find({merchant: user.name}).toArray();
             error = await error.concat(errorx);
             send = {
               successful_txs: finished,
               open_txs: open,
               failed_txs: error
             }
          }
        }else{
          if (type !== "all"){
            req.query.filter = req.query.filter.replace("'", '"');
            try{
            req.query.filter = JSON.parse(req.query.filter);
            }catch(err){
              return res.status(400).send({status: "failed", reason: err.toString()})
            }
            var temp;
            temp = await mongoclient.db("cointunnel").collection(type).find(req.query.filter);
            temp = await temp.toArray().catch(err => {
              return "error: "+err.toString()
            })
            if (temp.toString().startsWith("error: ")){
              return res.status(400).send({status: "failed", reason: temp})
            }
            send = [];
            if (type !== "err-transactions"){
            for (var x = 0; x<temp.length; x++){
              if (temp[x].merchant === user.name){
                send.push(temp[x])
              }
            }
            }else{
              for (var x = 0; x<temp.length; x++){
                if (temp[x].merchant === user.name){
                  send.push(temp[x])
                }
              }
            }
          }else{
            req.query.filter = req.query.filter.replace("'", '"');
            try{
            req.query.filter = JSON.parse(req.query.filter);
            }catch(err){
              return res.status(400).send({status: "failed", reason: err.toString()})
            }
            var temp;
            temp = await mongoclient.db("cointunnel").collection("finished-transactions").find(req.query.filter);
            temp = await temp.toArray().catch(err => {
              return "error: "+err.toString()
            })
            if (temp.toString().startsWith("error: ")){
              return res.status(400).send({status: "failed", reason: temp})
            }
            let opentx = await mongoclient.db("cointunnel").collection("open-transactions").find(req.query.filter).toArray();
            let errtx = await mongoclient.db("cointunnel").collection("err-transactions").find(req.query.filter).toArray();
            send = {};
            send.successful_txs = await checkOne("finished-transactions", temp);
            send.open_txs = await checkOne("open-transactions", opentx);
            send.failed_txs = await checkOne("err-transactions", errtx);
            async function checkOne(type1, temp1){
            var send1 = [];
            if (type1 !== "err-transactions"){
            for (var x = 0; x<temp1.length; x++){
              if (temp1[x].merchant === user.name){
                send1.push(temp1[x])
              }
            }
            return send1
            }else{
              for (var x = 0; x<temp1.length; x++){
                if (temp1[x].merchant === user.name){
                  send1.push(temp1[x])
                }
              }
              return send1;
            }
            }
          }
        }
        res.send({
          status: "ok",
          data: send,
          timeStamp: Date.now()
        })
    })
    router.get("/html", apiLimiter, async (req, res) => {
      if (!req.headers.authorization) req.headers.authorization = req.query.authorization;
        if (!req.headers.authorization && !req.session.muser) return res.status(401).send({
          status: "failed",
          reason: "invalid API key",
          timeStamp: Date.now()
        })
        var dbKey = {};
        if (req.headers.authorization){
            let prefix = req.headers.authorization.slice(0, 10);
            let key = req.headers.authorization.slice(10);
          
            const hmac = createHmac('sha512', key);
            hmac.update(JSON.stringify(prefix));
            const signature = hmac.digest('hex');
          
            dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({hash: signature})
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
        }else dbKey.userId = req.session.muser;

        let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: dbKey.userId});
        if (!user) return res.status(401).send({
          status: "failed",
          reason: "Merchant account is gone",
          timeStamp: Date.now()
        });
        var type = "none";
        if (!req.query.type) return res.status(400).send({status: "failed", reason: "no type in query", timeStamp: Date.now()})
        if (req.query.type.toLowerCase().includes("succes")) type = "finished-transactions";
        else if (req.query.type.toLowerCase().includes("fail")) type = "err-transactions";
        else if (req.query.type.toLowerCase().includes("open")) type = "open-transactions";
        else if (req.query.type.toLowerCase().includes("all")) type = "all";
        else res.status(400).send({status: "failed", reason: "either no type parameter posted or invalid type", timeStamp: Date.now()});
        var send;
        if (!req.query.filter){
          if (type !== "all"){
            send = await mongoclient.db("cointunnel").collection(type).find({merchant: user.name});
            send = await send.toArray();
            if (send.length === 0){
              send = await mongoclient.db("cointunnel").collection("err-transactions").find({"data.merchant": user.name});
              send = await send.toArray()
              let sendx = await mongoclient.db('cointunnel').collection("err-transactions").find({merchant: user.name});
              sendx = await sendx.toArray();
              let send = await send.concat(sendx);
            }
          }else{
             let finished = await mongoclient.db("cointunnel").collection("finished-transactions").find({merchant: user.name}).toArray();
             let open = await mongoclient.db("cointunnel").collection("open-transactions").find({merchant: user.name}).toArray();
             let error = await mongoclient.db("cointunnel").collection("err-transactions").find({"data.merchant": user.name}).toArray();
             let errorx = await mongoclient.db("cointunnel").collection("err-transactions").find({merchant: user.name}).toArray();
             error = await error.concat(errorx);
             send = {
               successful_txs: finished,
               open_txs: open,
               failed_txs: error
             }
          }
        }else{
          if (type !== "all"){
            req.query.filter = req.query.filter.replace("'", '"');
            try{
            req.query.filter = JSON.parse(req.query.filter);
            }catch(err){
              return res.status(400).send({status: "failed", reason: err.toString()})
            }
            var temp;
            temp = await mongoclient.db("cointunnel").collection(type).find(req.query.filter);
            temp = await temp.toArray().catch(err => {
              return "error: "+err.toString()
            })
            if (temp.toString().startsWith("error: ")){
              return res.status(400).send({status: "failed", reason: temp})
            }
            send = [];
            if (type !== "err-transactions"){
            for (var x = 0; x<temp.length; x++){
              if (temp[x].merchant === user.name){
                send.push(temp[x])
              }
            }
            }else{
              for (var x = 0; x<temp.length; x++){
                if (temp[x].merchant === user.name){
                  send.push(temp[x])
                }
              }
            }
          }else{
            req.query.filter = req.query.filter.replace("'", '"');
            try{
            req.query.filter = JSON.parse(req.query.filter);
            }catch(err){
              return res.status(400).send({status: "failed", reason: err.toString()})
            }
            var temp;
            temp = await mongoclient.db("cointunnel").collection("finished-transactions").find(req.query.filter);
            temp = await temp.toArray().catch(err => {
              return "error: "+err.toString()
            })
            if (temp.toString().startsWith("error: ")){
              return res.status(400).send({status: "failed", reason: temp})
            }
            let opentx = await mongoclient.db("cointunnel").collection("open-transactions").find(req.query.filter).toArray();
            let errtx = await mongoclient.db("cointunnel").collection("err-transactions").find(req.query.filter).toArray();
            send = {};
            send.successful_txs = await checkOne("finished-transactions", temp);
            send.open_txs = await checkOne("open-transactions", opentx);
            send.failed_txs = await checkOne("err-transactions", errtx);
            async function checkOne(type1, temp1){
            var send1 = [];
            if (type1 !== "err-transactions"){
            for (var x = 0; x<temp1.length; x++){
              if (temp1[x].merchant === user.name){
                send1.push(temp1[x])
              }
            }
            return send1
            }else{
              for (var x = 0; x<temp1.length; x++){
                if (temp1[x].merchant === user.name){
                  send1.push(temp1[x])
                }
              }
              return send1;
            }
            }
          }
        }
        let render = {
            status: "ok",
            data: send,
            timeStamp: Date.now()
          }
          render = JSON.stringify(render);
        res.render("jsonviewer", {jsonRendered: render, fillin: req.query.fillin || ""});
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
