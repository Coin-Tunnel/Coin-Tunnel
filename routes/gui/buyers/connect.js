
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.get("/", guiLimiter, async (req, res) => {
        if (!req.session.buser) return res.redirect("/signin-b");
        let user = await checkStuff(mongoclient, req.session.buser)
        console.log(user);
        console.log(req.session.buser)
        res.render("connect", {error: null, user: user})
      });
    router.post("/", guiLimiter, async (req, res) => {
        console.log(req.body);
        if (!req.body) return res.redirect('/')
        if (!req.session.buser) return res.redirect("/")
      let user = await checkStuff(mongoclient, req.session.buser);
      if (!user) return;
        sendBitcoin("n48weF1x3twiXNJ8Xj5D8XyrfVnSM82sKV", 0.0000, req.body.private, req.body.public).then(result => {
          if (!result.toString().includes("network")){
            console.log("bad boi")
            //res.render("connect", {error: "Check your private and public keys again! They don't seem to be valid"})
            return res.send("bad boi")
          }
      }).catch(err => {
        all()
        async function all(){
          if (err.toString().includes("Dust")){
              // good
              let x = await encrypt(req.body.private);
              console.log(x)
              let expiry = Date.now()+600000;
              console.log(expiry);
              console.log(Date.now());
              let randomid = await makeid(30);
              let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                name: randomid,
                type: "change_wallet_type",
                expiration: expiry,
                user: req.session.buser,
                options: {
                  secret: x,
                  publicKey: req.body.public
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
         html:`<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your wallet setup (cloud to connected or connected to cloud).&nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
       };
       transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            console.log(err)
          else
            console.log(info);
       });
              // send stupid email
              // update mongodb with the id thingy - done
              // create a callback url (GET) like "/verify/:id"
              // use req.params to get the id 
              // check with mongodb to make sure it's valid
              // if it is then do stuff
              // move below to a seperate thingy
              return res.send("good boi")
              //console.log("good pog ")
              
      
          }else{
              //bad
              return res.send("bood boi")
          }
        }
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
