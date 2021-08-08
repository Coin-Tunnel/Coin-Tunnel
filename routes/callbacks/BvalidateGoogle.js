
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv, googleClient;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
  router.post("/", guiLimiter, async (req, res) => {
    let email = req.body.email;
    await sleep(1000)
    //if (!req.session.google) return;
    async function verify() {
      try{
      const ticket = await googleClient.verifyIdToken({
          idToken: req.body.idtoken,
          audience: secrets.googleClient,
      });
      req.body.email = ticket.email;
      const payload = ticket.getPayload();
      const userid = payload['sub'];
      // If request specified a G Suite domain:
      // const domain = payload['hd'];
      return userid;
      }catch{
        console.log("error")
        return res.redirect("/")
      }
    }
    let results = await verify().catch(err => {res.redirect("/"); console.log("error1")});
    if (results !== req.body.requested){
      req.session = null;
      console.log("Didn't match google")
      return;
    }
        
    const db = mongoclient.db("cointunnel");
            let testresult = await db.collection("userData").find( {"name": results}).count();
            if (testresult === 0){
              var generateId = "none"
              for (var y = 0; y<10; y++){
                if (y === 8) res.status(500).send("Could not create an id that isn't taken after 8 tries!")
                generateId = await makeid(25)
                let testid = await db.collection("userData").find( {"tunnelId": generateId}).count();
                if (testid === 0) break
              }
              await createUser(mongoclient,
              {
                name: results,
                tunnelId: generateId,
                type:"google",
                userPrivate: "none",
                userPublic: "none",
                generatedPrivate: "none",
                generatedPublic:"none",
                email: email
              })
              req.session.buser = results;
              req.session.save();
              res.send("success");
            } else {
              return res.send("An account already exists with this account! Try signing in instead.")
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
  
    googleClient = var1.googleClient;
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
