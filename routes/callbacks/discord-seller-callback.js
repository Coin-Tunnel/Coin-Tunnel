
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.get('/', apiLimiter, async (req, res) => {
    
        const accessCode = req.query.code;
        if (!accessCode){
          res.redirect("/signup-m");
          req.session = null;
        }
        const data = new FormData();
        data.append('client_id', clientId);
        data.append('client_secret', clientSecret);
        data.append('grant_type', 'authorization_code');
        data.append('redirect_uri', "https://www.coin-tunnel.ml/discord-seller-callback");
        data.append('scope', scopes.join(' '));
        data.append('code', accessCode);
        let x = await fetch('https://discordapp.com/api/oauth2/token', {
            method: 'POST',
            body: data
        })
        let response = await x.json()
        let y = await fetch('https://discordapp.com/api/users/@me', {
                method: 'GET',
                headers: {
                    Authorization: `${response.token_type} ${response.access_token}`
                },
        })
        let userResponse = await y.json()
        console.log(userResponse)
                userResponse.tag = `${userResponse.username}#${userResponse.discriminator}`;
                req.session.muser = userResponse.id;
                console.log(req.session.muser);
    
        const db = mongoclient.db("cointunnel");
            let testresult = await db.collection("merchantData").find( {"name": req.session.muser}).count();
    
            if (testresult === 0){
              var generateId = "none"
              for (var t = 0; t<10; t++){
                if (t === 8) res.status(500).send("Could not create an id that isn't taken after 8 tries!")
                generateId = await makeid(25)
                let testid = await db.collection("merchantData").find( {"tunnelId": generateId}).count();
                if (testid === 0) break
              }
              console.log(userResponse)
              await mongoclient.db("cointunnel").collection("merchantData").insertOne(
              {
                name: req.session.muser,
                tunnelId: generateId,
                type:"discord",
                deposit: "none",
                key: "none",
                email: userResponse.email,
                discord: {
                  tag: userResponse.tag
                }
              })
              res.redirect("/checkUserM")
            }
            else {
              res.render("error", {error: "You already have an account! Try signing in instead!"})
            }
    });
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
