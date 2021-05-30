
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.get("/", longLimiter, async (req, res) => {
        if (!req.session.buser) return res.redirect("/signin-b");
        let user = await checkStuff(mongoclient, req.session.buser);
        if (!user) return res.render("error", {error: "You must signup before you can use this!"})
              // good
              let newWallet = await generateKeyPairs();
              
              let x = await encrypt(newWallet.privateKey);
              console.log(x)
              let expiry = Date.now()+600000;
              let randomid = await makeid(30);
              await mongoclient.db("cointunnel").collection("emails").insertOne({
                name: randomid,
                type: "change_to_cloud_wallet",
                expiration: expiry,
                user: req.session.buser,
                options: {
                  secret: x,
                  publicKey: newWallet.address
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
         html:`<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your wallet setup to a cloud wallet. Please note that if your current wallet is also cloud, the contents in that wallet will be lost! If you are going from a connected wallet, this will not affect any funds in the connected wallet.&nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
       };
       transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            console.log(err)
          else
            console.log(info);
       });
      res.send("A verification email has been sent!")
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
