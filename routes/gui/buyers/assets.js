
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}
const ltc_network = "LTC";
var allCoins = {
  ETH: "Ethereum",
  ETC: "Ethereum Classic",
  DOGE: "Dogecoin",
  BTC: "Bitcoin",
  XRP: "Ripple",
  LTC: "Litecoin",
}
sleep(1000).then(thing => {
    router.get("/", guiLimiter, async (req, res) => {
        if (!req.session.buser) return res.redirect("/signin-b")
        let mongo = await checkUser(mongoclient, req.session.buser);
        if (!mongo){ req.session = null; return res.redirect("/signin-b")}
        var publicx;
        var privatex;
        var type;
        var wallet = {};
        wallet.btc = {};
        let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum,ripple&vs_currencies=usd")
      prices = await prices.json()
      
      let btcPrice = Number(prices.bitcoin.usd)
      wallet.btc.price = btcPrice;
        if (mongo.generatedPrivate === "none" && mongo.userPrivate === "none"){
          publicx = "No wallet! Connect a wallet or create a cloud wallet first!";
          privatex = "No wallet";
          type = "No wallet set up!";
          wallet.amount = 0;
        }else if (mongo.userPrivate === "none"){
          publicx = mongo.generatedPublic;
          privatex = mongo.generatedPrivate;
          type = "Cloud wallet";
        }else if (mongo.generatedPrivate === "none"){
          publicx = mongo.userPublic;
          privatex = mongo.userPrivate;
          type = "Connected Wallet";
        }

        var everything = {};
        everything.ltc = {};
        everything.eth = {};
        
        everything.btc = {
          type: type,
          address: publicx,
          wallet: wallet
        };
        everything.btc.price = btcPrice;
// start of ltc stuff (garbage)
let ltcPrice = Number(prices.litecoin.usd);
everything.ltc.price = ltcPrice;
if (!mongo.ltc) await mongoclient.db("cointunnel").collection("userData").updateOne({name: req.session.buser}, {
  $set: {
    ltc: {
    address: "none",
    privatex: "none"
  }
}
})
if (!mongo.ltc || mongo.ltc.address === "none"){
  everything.ltc.type = "None"
  everything.ltc.address = "No cloud wallet setup! Create one first.";
  everything.ltc.amount = 0;
  everything.ltc.usd = "N/A"
}else{
  everything.ltc.type = "LTC (cloud)"
  everything.ltc.address = mongo.ltc.address;
}


// start ethereum garbage
let ethPrice = Number(prices.ethereum.usd);
if (!mongo.eth || mongo.eth.address === "none"){
  everything.eth.type = "No wallet created yet!"
  everything.eth.usd = "N/A";
  everything.eth.address = "No cloud wallet setup! Create one first.";
  everything.eth.amount = 0;
  if (!mongo.eth){
    await mongoclient.db("cointunnel").collection("userData").updateOne({name: req.session.buser}, {
      $set: {
        eth: {
          address: "none",
          privatex: "none"
        }
      }
    })
  }
}else{
  everything.eth.address = mongo.eth.address;
  everything.eth.type = "ETH (cloud)"
}
  everything.eth.price = ethPrice;


// start of XRP stuff
everything.xrp = {};
let xrpPrice = Number(prices.ripple.usd);
if (!mongo.xrp || mongo.xrp.address === "none"){
  everything.xrp.type = "No wallet created yet!"
  everything.xrp.usd = "N/A";
  everything.xrp.address = "No cloud wallet setup! Create one first.";
  everything.xrp.amount = 0;
}else{
  everything.xrp.address = mongo.xrp.address;
  everything.xrp.type = "XRP (cloud)";
}
everything.xrp.price = xrpPrice;

        everything = JSON.stringify(everything);

        res.render("assets/main.ejs", {user: req.session.buser || null, db: mongo || null, publicx: publicx, privatex: privatex, type: type, everything: everything})
    })
    router.get("/deposit", guiLimiter, async (req, res) => {
        if (!req.session.buser) return res.redirect("/signin-b")
        let mongo = await checkUser(mongoclient, req.session.buser);
        if (!mongo){ req.session = null; return res.redirect("/signin-b")}
        var publicx;
        var privatex;
        var type;
        var wallet = {};
        wallet.btc = {};
        let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum,ripple&vs_currencies=usd")
      prices = await prices.json()
      
      let btcPrice = Number(prices.bitcoin.usd)
      wallet.btc.price = btcPrice;
        if (mongo.generatedPrivate === "none" && mongo.userPrivate === "none"){
          publicx = "No wallet! Connect a wallet or create a cloud wallet first!";
          privatex = "No wallet";
          type = "No wallet set up!";
          wallet.amount = 0;
        }else if (mongo.userPrivate === "none"){
          publicx = mongo.generatedPublic;
          privatex = mongo.generatedPrivate;
          type = "Cloud wallet";
        }else if (mongo.generatedPrivate === "none"){
          publicx = mongo.userPublic;
          privatex = mongo.userPrivate;
          type = "Connected Wallet";
        }

        var everything = {};
        everything.ltc = {};
        everything.eth = {};
        
        everything.btc = {
          type: type,
          address: publicx,
          wallet: wallet
        };
        everything.btc.price = btcPrice;
// start of ltc stuff (garbage)
let ltcPrice = Number(prices.litecoin.usd);
everything.ltc.price = ltcPrice;
if (!mongo.ltc) await mongoclient.db("cointunnel").collection("userData").updateOne({name: req.session.buser}, {
  $set: {
    ltc: {
    address: "none",
    privatex: "none"
  }
}
})
if (!mongo.ltc || mongo.ltc.address === "none"){
  everything.ltc.type = "None"
  everything.ltc.address = "No cloud wallet setup! Create one first.";
  everything.ltc.amount = 0;
  everything.ltc.usd = "N/A"
}else{
  everything.ltc.type = "LTC (cloud)"
  everything.ltc.address = mongo.ltc.address;
}


// start ethereum garbage
let ethPrice = Number(prices.ethereum.usd);
if (!mongo.eth || mongo.eth.address === "none"){
  everything.eth.type = "No wallet created yet!"
  everything.eth.usd = "N/A";
  everything.eth.address = "No cloud wallet setup! Create one first.";
  everything.eth.amount = 0;
  if (!mongo.eth){
    await mongoclient.db("cointunnel").collection("userData").updateOne({name: req.session.buser}, {
      $set: {
        eth: {
          address: "none",
          privatex: "none"
        }
      }
    })
  }
}else{
  everything.eth.address = mongo.eth.address;
  everything.eth.type = "ETH (cloud)"
}
  everything.eth.price = ethPrice;


// start of XRP stuff
everything.xrp = {};
let xrpPrice = Number(prices.ripple.usd);
if (!mongo.xrp || mongo.xrp.address === "none"){
  everything.xrp.type = "No wallet created yet!"
  everything.xrp.usd = "N/A";
  everything.xrp.address = "No cloud wallet setup! Create one first.";
  everything.xrp.amount = 0;
}else{
  everything.xrp.address = mongo.xrp.address;
  everything.xrp.type = "XRP (cloud)";
}
everything.xrp.price = xrpPrice;

        everything = JSON.stringify(everything);

        res.render("assets/deposit.ejs", {user: req.session.buser || null, db: mongo || null, publicx: publicx, privatex: privatex, type: type, everything: everything, coin: "none"})
    })
    router.get("/deposit/:coin", guiLimiter, async (req, res) => {
      if (!allCoins[req.params.coin]) return res.render("404_error");
        if (!req.session.buser) return res.redirect("/signin-b")
        let mongo = await checkUser(mongoclient, req.session.buser);
        if (!mongo){ req.session = null; return res.redirect("/signin-b")}
        var publicx;
        var privatex;
        var type;
        var wallet = {};
        wallet.btc = {};
        let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum,ripple&vs_currencies=usd")
      prices = await prices.json()
      
      let btcPrice = Number(prices.bitcoin.usd)
      wallet.btc.price = btcPrice;
        if (mongo.generatedPrivate === "none" && mongo.userPrivate === "none"){
          publicx = "No wallet! Connect a wallet or create a cloud wallet first!";
          privatex = "No wallet";
          type = "No wallet set up!";
          wallet.amount = 0;
        }else if (mongo.userPrivate === "none"){
          publicx = mongo.generatedPublic;
          privatex = mongo.generatedPrivate;
          type = "Cloud wallet";
        }else if (mongo.generatedPrivate === "none"){
          publicx = mongo.userPublic;
          privatex = mongo.userPrivate;
          type = "Connected Wallet";
        }

        var everything = {};
        everything.ltc = {};
        everything.eth = {};
        
        everything.btc = {
          type: type,
          address: publicx,
          wallet: wallet
        };
        everything.btc.price = btcPrice;
// start of ltc stuff (garbage)
let ltcPrice = Number(prices.litecoin.usd);
everything.ltc.price = ltcPrice;
if (!mongo.ltc) await mongoclient.db("cointunnel").collection("userData").updateOne({name: req.session.buser}, {
  $set: {
    ltc: {
    address: "none",
    privatex: "none"
  }
}
})
if (!mongo.ltc || mongo.ltc.address === "none"){
  everything.ltc.type = "None"
  everything.ltc.address = "No cloud wallet setup! Create one first.";
  everything.ltc.amount = 0;
  everything.ltc.usd = "N/A"
}else{
  everything.ltc.type = "LTC (cloud)"
  everything.ltc.address = mongo.ltc.address;
}


// start ethereum garbage
let ethPrice = Number(prices.ethereum.usd);
if (!mongo.eth || mongo.eth.address === "none"){
  everything.eth.type = "No wallet created yet!"
  everything.eth.usd = "N/A";
  everything.eth.address = "No cloud wallet setup! Create one first.";
  everything.eth.amount = 0;
  if (!mongo.eth){
    await mongoclient.db("cointunnel").collection("userData").updateOne({name: req.session.buser}, {
      $set: {
        eth: {
          address: "none",
          privatex: "none"
        }
      }
    })
  }
}else{
  everything.eth.address = mongo.eth.address;
  everything.eth.type = "ETH (cloud)"
}
  everything.eth.price = ethPrice;


// start of XRP stuff
everything.xrp = {};
let xrpPrice = Number(prices.ripple.usd);
if (!mongo.xrp || mongo.xrp.address === "none"){
  everything.xrp.type = "No wallet created yet!"
  everything.xrp.usd = "N/A";
  everything.xrp.address = "No cloud wallet setup! Create one first.";
  everything.xrp.amount = 0;
}else{
  everything.xrp.address = mongo.xrp.address;
  everything.xrp.type = "XRP (cloud)";
}
everything.xrp.price = xrpPrice;

        everything = JSON.stringify(everything);

        res.render("assets/deposit.ejs", {user: req.session.buser || null, db: mongo || null, publicx: publicx, privatex: privatex, type: type, everything: everything, coin: req.params.coin})
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
