
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var CoinKey = require('coinkey')    //1.0.0
var coinInfo = require('coininfo')  //0.1.0
var subscribed = {};
const RippleAPI = require('ripple-lib').RippleAPI;
const api = new RippleAPI({
  server: 'wss://s1.ripple.com'
});

const ltc_network = "LTC";
var allCoins = {
  ETH: "Ethereum",
  ETC: "Ethereum Classic",
  DOGE: "Dogecoin",
  BTC: "Bitcoin",
  XRP: "Ripple",
  LTC: "Litecoin",
  TRX: "Tron"
}
sleep(1000).then(thing => {
  router.get("/", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.redirect("/signin-b")
    let mongo = await checkUser(mongoclient, req.session.buser);
    if (!mongo) { req.session = null; return res.redirect("/signin-b") }

    let results = await getInfo(mongo, req);
    var everything = results[0];
    let refresh = results[1];

    if (refresh === true) {
      await sleep(1000);
      return res.redirect("/assets")
    }
    res.render("assets/main.ejs", { user: req.session.buser || null, db: mongo || null, everything: everything })
  })
  router.get("/deposit", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.redirect("/signin-b")
    let everything = {
      btc: { address: "", price: "" },
      eth: { address: "", price: "" },
      xrp: { address: "", price: "" },
      ltc: { address: "", price: "" },
      etc: { address: "", price: "" },
      doge: { address: "", price: "" }
    }
    everything = JSON.stringify(everything);

    res.render("assets/deposit.ejs", { user: req.session.buser || null, everything: everything, coin: "none" })
  })
  router.get("/deposit/:coin", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.redirect("/signin-b");
    if (req.params.coin === "none") return res.redirect("/assets/deposit")
    if (!allCoins[req.params.coin]) return res.render("404_error");
    let mongo = await checkUser(mongoclient, req.session.buser);
    if (!mongo) { req.session = null; return res.redirect("/signin-b") }
    
    let results = await getInfo(mongo, req);
    var everything = results[0];
    let refresh = results[1];

    if (refresh === true) {
      await sleep(1000);
      return res.redirect("/assets")
    }
    res.render("assets/deposit.ejs", { user: req.session.buser || null, db: mongo || null, everything: everything, coin: req.params.coin })
  })
  router.get("/withdraw", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.redirect("/signin-b");
    let everything = {
      btc: { address: "", price: "" },
      eth: { address: "", price: "" },
      xrp: { address: "", price: "" },
      ltc: { address: "", price: "" },
      etc: { address: "", price: "" },
      doge: { address: "", price: "" }
    }
    everything = JSON.stringify(everything);

    res.render("assets/withdraw.ejs", { user: req.session.buser || null, everything: everything, coin: "none" })
  })
  router.get("/withdraw/:coin", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.redirect("/signin-b");
    if (req.params.coin === "none") return res.redirect("/assets/withdraw")
    if (!allCoins[req.params.coin]) return res.render("404_error");
    let mongo = await checkUser(mongoclient, req.session.buser);
    if (!mongo) { req.session = null; return res.redirect("/signin-b") }
    let results = await getInfo(mongo, req);
    var everything = results[0];
    let refresh = results[1];

    if (refresh === true) {
      await sleep(1000);
      return res.redirect("/assets")
    }

    res.render("assets/withdraw.ejs", { user: req.session.buser || null, db: mongo || null, everything: everything, coin: req.params.coin })
  })
})


module.exports = function (var1) {
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
  createHmac = var1.createHmac;
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

async function createEthWallet(user) {
  const { ethers } = require("ethers");
  const randomMnemonic = ethers.Wallet.createRandom().mnemonic;
  const wallet = ethers.Wallet.fromMnemonic(randomMnemonic.phrase);
  let signingkey = wallet._signingKey();
  let encryptedkey = await encrypt(signingkey.privateKey);
  await mongoclient.db("cointunnel").collection("userData").updateOne({ name: user }, {
    $set: {
      eth: {
        "address": wallet.address,
        "privatex": encryptedkey
      }
    }
  });
  return null;
}
async function createLtcWallet(user) {
  var liteInfo = coinInfo('LTC').versions;
  var ck = new CoinKey.createRandom(liteInfo);

  let secret = await encrypt(ck.privateWif);
  let address = ck.publicAddress;
  await mongoclient.db('cointunnel').collection("userData").updateOne({ name: user }, {
    $set: {
      ltc: {
        "address": address,
        "privatex": secret
      }
    }
  });
  return null;
}
async function createXrpWallet(user) {
  const address = api.generateAddress();
  let encrypted = await encrypt(address.secret);
  let xrpaddress = address.address;
  await mongoclient.db('cointunnel').collection("userData").updateOne({ name: user }, {
    $set: {
      xrp: {
        "address": xrpaddress,
        "privatex": encrypted
      }
    }
  })
  return null;
}
async function createBtcWallet(user){
  const keyPair = bitcoin.ECPair.makeRandom({ network: BitcoinjsNetwork });
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: BitcoinjsNetwork });
  const privateKey = keyPair.toWIF();
  await mongoclient.db("cointunnel").collection("userData").updateOne({name: user}, {$set: {
        userPublic: "none",
        userPrivate: "none",
        generatedPublic: address,
        generatedPrivate: encrypt(privateKey)
  }})
  return null;
}
async function createTrxWallet(user) {

  const { generateAccount } = require('tron-create-address')

  const { address, privateKey } = generateAccount()
  console.log(`Tron address is ${address}`)
  console.log(`Tron private key is ${privateKey}`)

  let encrypted = await encrypt(privateKey);
  await mongoclient.db('cointunnel').collection("userData").updateOne({ name: user }, {
    $set: {
      trx: {
        "address": address,
        "privatex": encrypted
      }
    }
  })
  return null;
}
async function getInfo(mongo, req) {
  var publicx;
  var privatex;
  var type;
  var wallet = {};
  wallet.btc = {};
  let prices = global.livePrices;
  var refresh = false;

  let btcPrice = Number(prices.btc.a)
  wallet.btc.price = btcPrice;
  if (mongo.generatedPrivate === "none" && mongo.userPrivate === "none") {
    createBtcWallet(req.session.buser);
    refresh = true;
    publicx = "No wallet! Connect a wallet or create a cloud wallet first!";
    privatex = "No wallet";
    type = "No wallet set up!";
    wallet.amount = 0;
  } else if (mongo.userPrivate === "none") {
    publicx = mongo.generatedPublic;
    privatex = mongo.generatedPrivate;
    type = "Cloud wallet";
  } else if (mongo.generatedPrivate === "none") {
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

  let ltcPrice = Number(prices.ltc.a);
  everything.ltc.price = ltcPrice;

  if (!mongo.ltc || mongo.ltc.address === "none") {
    createLtcWallet(req.session.buser);
    refresh = true;
  } else {
    everything.ltc.type = "LTC (cloud)"
    everything.ltc.address = mongo.ltc.address;
  }


  // start ethereum garbage
  let ethPrice = Number(prices.eth.a);
  if (!mongo.eth || mongo.eth.address === "none") {
    createEthWallet(req.session.buser);
    refresh = true;
  } else {
    everything.eth.address = mongo.eth.address;
    everything.eth.type = "ETH (cloud)"
  }
  everything.eth.price = ethPrice;


  // start of XRP stuff
  everything.xrp = {};
  let xrpPrice = Number(prices.xrp.a);
  if (!mongo.xrp || mongo.xrp.address === "none") {
    createXrpWallet(req.session.buser);
    refresh = true;
  } else {
    everything.xrp.address = mongo.xrp.address;
    everything.xrp.type = "XRP (cloud)";
  }
  everything.xrp.price = xrpPrice;

   // start of TRX stuff
   everything.trx = {};
   let trxPrice = Number(prices.trx.a);
   if (!mongo.trx || mongo.trx.address === "none") {
     createTrxWallet(req.session.buser);
     refresh = true;
   } else {
     everything.trx.address = mongo.trx.address;
     everything.trx.type = "TRX (cloud)";
   }
   everything.trx.price = trxPrice;
 

  everything = JSON.stringify(everything);
  return [everything, refresh];
}