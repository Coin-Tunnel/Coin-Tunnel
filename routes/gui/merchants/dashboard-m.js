
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.get("/", guiLimiter, async (req, res) => {
        var keys = {};
        var wallets = "No wallet connected";
        if (!req.session.muser) return res.redirect("/signin-m");
        let user = await mongoclient.db("cointunnel").collection("merchantData")
          .findOne({name: req.session.muser});
        if (!user) return res.render("error", {error: "An internal server error occured!"})
        if (user.deposit === "none"){ 
          user.deposit = "No deposit address set up!";
          }
        else{
         var utxos = await axios.get(
            `https://sochain.com/api/v2/get_address_balance/${sochain_network}/${user.deposit}`
          ).catch(err => {
            return "failed";
          })
        if (utxos !== "failed"){
             wallets = "Confirmed balance: "+ utxos.data.data.confirmed_balance+ " BTC; On the way: "+utxos.data.data.unconfirmed_balance+" BTC"
        }
         
        
        }

        if (user.key === "none"){
          keys.prefix = "no key set up";
          keys.uses = "no key set up";
          keys.ip = ["no key set up"];
        }
        else{
          keys = await mongoclient.db("cointunnel").collection("keys")
          .findOne({userId: req.session.muser})
        }
        let openTransac = await mongoclient.db("cointunnel").collection("open-transactions").find({merchant: req.session.muser}).count()
        let closedTransac = await mongoclient.db("cointunnel").collection("finished-transactions").find({merchant: req.session.muser}).count();
        let errorTransac = await mongoclient.db("cointunnel").collection("err-transactions").find({"data.merchant": req.session.muser}).count()
        let transactions = {};
        transactions.open = openTransac;
        transactions.closed = closedTransac;
        transactions.all = errorTransac;

       user = JSON.stringify(user);
       //console.log(user);
       let merchant = user;
       let allSuccess = await mongoclient.db("cointunnel").collection("finished-transactions")
             .find({merchant: req.session.muser})
           let successful = await allSuccess.toArray();

          let allFailed = await mongoclient.db("cointunnel").collection("err-transactions")
              .find({"data.merchant": req.session.muser})
          let failed = await allFailed.toArray();

          let allFailedx = await mongoclient.db("cointunnel").collection("err-transactions")
              .find({"merchant": req.session.muser})
          let failedx = await allFailedx.toArray();

          let allOpen = await mongoclient.db("cointunnel").collection("open-transactions")
              .find({merchant: req.session.muser})
            let open = await allOpen.toArray();
          
       let txlist = successful.concat(failed, open, failedx);
       console.log(txlist)
       txlist = txlist.sort(function (a, b) {
         if (a.data && b.data) {
           return a.data.creation - b.data.creation;
         }else if (a.data && !b.data){
           return a.data.creation - b.creation;
         }else if (!a.data && b.data){
           return a.creation - b.data.creation;
         }else if (a.status === "failed"){
           return 1-3;
         }else if (b.status === "failed"){
           return 3-1;
         }
        return a.creation - b.creation;
      });
      txlist = txlist.reverse();
        res.render("dashboard-m", {db: user, key: keys, wallet: wallets, transac: transactions, transactionList: txlist});
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
