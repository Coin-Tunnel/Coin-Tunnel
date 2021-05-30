
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.post("/", longLimiter, async (req, res) => {
        if (!req.session.muser) return res.send("You have to be signed in to your merchant account!")
        //validate stupid bitcoin address (done)
        var utxos = await axios.get(
            `https://sochain.com/api/v2/get_address_balance/${sochain_network}/${req.body.bitcoin}`
          ).catch(err => {
            res.send("That wasn't a valid bitcoin address");
            return "failed";
          })
        if (utxos === "failed") return;
        if (utxos.status === "fail"){
          return res.send("That wasn't a valid bitcoin address")
        }
        //send stupid email and update mongodb listing (Done)
        let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: req.session.muser})
        let expiry = Date.now()+600000;
              let randomid = await makeid(30);
              let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                name: randomid,
                type: "merchant-change-address",
                expiration: expiry,
                user: req.session.muser,
                options: {
                  address: req.body.bitcoin
                }
              });
      
        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: 'cointunnel.0x@gmail.com',
               pass: secrets.gmail_password
           }
       });
       const mailOptions = {
         from: 'cointunnel.0x@gmail.com', // sender address
         to: user.email, // list of receivers
         subject: 'Coin Tunnel Confirmation', // Subject line
         html:`<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your deposit address to the address: ${req.body.bitcoin} (This won't affect any balances) &nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised, because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
       };
       transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            console.log(err)
          else
            console.log(info);
          
        return res.send("good")
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
