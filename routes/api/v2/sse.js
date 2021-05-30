
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}


sleep(1000).then(thing => {
    router.ws('/transaction/:txid/:authorization', async (ws, req) => {
        //console.log(ws.clients)
        console.log("a;lskdfj;alsdkjf")
        console.log(req.session)
        console.log(req.session.buser);
        req.session.websocket = "a;sldkfjasafa;sdflkajs;dflkjpls work pog pog It works if you can see this and reading this straight off the code doesn't work";
        req.session.save();
        ws.on('message', async msg => {
            for(var t = 0; t< 1000000; t++){
                if (t===300) {
                    return ws.close()
                }
                function date() {
                    var d = new Date();
                    var year = d.getFullYear();
                    var month = d.getMonth()+1;
                    var date = d.getDate()
                    return year+"/"+month+"/"+date+" "+d.toTimeString();
                  }
                try{
                    let randomWait = Math.floor(Math.random()*4000);
                    await sleep(randomWait);
                    ws.send(date())
                }catch(err){
                    return err.toString()
                }
                
                await sleep(1000);
            }
        })
        ws.on('close', () => {
            return;
        })
        
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
