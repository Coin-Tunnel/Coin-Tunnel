
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.get("/", apiLimiter, async (req, res) =>{
        let todo = {
          "client_id":"d2de28a42e1d27bb8ff2",
          "client_secret":secrets.github_merchant,
          "code":req.query.code
        }
       let github = await fetch('https://github.com/login/oauth/access_token', {
         method: 'POST',
         body: JSON.stringify(todo),
         headers: { 'Content-Type': 'application/json' }
     })
     github = await github.text()
     let position = github.indexOf("=");
     let and = github.indexOf("&");
     github = github.slice(position+1, and);
     console.log(github)
     let user = await fetch('https://api.github.com/user', {
         method: 'GET',
         headers: { 'Content-Type': 'application/json', "Authorization":"token "+github }
     })
     user = await user.json();
     console.log(user);
     req.session.muser = user.id;
     let emails = await fetch("https://api.github.com/user/emails", {
       method: 'GET',
         headers: { 'Content-Type': 'application/json', "Authorization":"token "+github }
     })
     emails = await emails.json();
     if (!emails[0]) return res.redirect("/dashboard-m")
     else console.log(emails[0].email)
     const db = mongoclient.db("cointunnel");
             let testresult = await db.collection("merchantData").find( {"name": user.id}).count();
     
             if (testresult === 0){
               var generateId = "none"
               for (var y = 0; y<10; y++){
                 if (y === 8) res.status(500).send("Could not create an id that isn't taken after 8 tries!")
                 generateId = await makeid(25)
                 let testid = await db.collection("merchantData").find( {"tunnelId": generateId}).count();
                 if (testid === 0) break
               }
               await await mongoclient.db("cointunnel").collection("merchantData").insertOne(
               {
                 name: user.id,
                 tunnelId:generateId,
                 type:"github",
                 deposit: "none",
                 key: "none",
                 email: emails[0].email
               })
               req.session.muser = user.id
               return res.redirect("/checkUserM")
             }
             else {
               res.redirect("/dashboard-m")
             }
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
