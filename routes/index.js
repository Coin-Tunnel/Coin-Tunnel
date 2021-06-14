
//CHECKLIST
const USERchecklist = {
  sign_up_oauth2_things:{
    discord: true,
    github: true,
    google: true,
    email: {
      discord: true,
      github: true,
      google: true
    },
    generate_my_id: true
  },
  sign_in_oauth2_things:{
    discord: true,
    github: true,
    google: true
  },
  dashboard:{
    form_to_change_option: true,
    connect_wallet:{
      form:{
        hashing: true,
        mongodb: true
      },
      deposit_qr:false,
      withdraw_function: true,
      email_person: true,
      confirmation_button: true,
      regenerateTunnelId: true
    },
    online_wallet:{
      deposit_qr: false,
      withdraw_function: false
    }
  }
}
const MERCHANTchecklist = {
  sign_up_oauth2_things:{
    discord: true,
    github: true,
    google: true,
    email: false,
    generate_merchant_id: true 
  },
  sign_in_oauth2_things:{
    discord: true,
    github: true,
    google: true
  },
  dashboard:{
    form:{
      merchants_own_address: true,
      mongodb: true,
      apikey: true
    },    
    merchant_id:{
    }
  }
}
const PAYMENTchecklist = {
  makeDocs: true,
  initiantPayment: true,
  sendEmail: true,
  validateEmailLInk: true,
  withdraw: true,
  everytimeUserPaysRegeneratePublicId: false
}
const Advancedchecklist = {
  getTxInfo: true,
  getAllTx: {
    succesful: true,
    failed: true,
    open: true,
    all: true
  }
}

const bitcore = require("bitcore-lib");
const bitcoin = require("bitcoinjs-lib");
const sochain_network = "BTC";
var BitcoinjsNetwork;

if (sochain_network === "BTCTEST") BitcoinjsNetwork = bitcoin.networks.testnet;
else if (sochain_network === "BTC") BitcoinjsNetwork = bitcoin.networks.bitcoin

var nodemailer = require('nodemailer');
const requestIp = require('request-ip');

const router = require('express').Router();
const { createHmac } = require("crypto");
const crypto = require("crypto")
const rateLimit = require("express-rate-limit");
const axios = require('axios')
var bodyParser = require("body-parser");
var secrets;
if (process.env.secrets){
  secrets = JSON.parse(process.env.secrets)
}else{
  secrets = require("../secret.json")
}
//console.log(secrets)
const fetch = require('node-fetch');
const FormData = require('form-data');
const {MongoClient} = require('mongodb')
const uri = secrets.mongodb;
const mongoclient = new MongoClient(uri, {poolSize: 10, bufferMaxEntries: 0, useNewUrlParser: true,useUnifiedTopology: true});
var request = require('request');
const {OAuth2Client} = require('google-auth-library');
const googleClient = new OAuth2Client(secrets.googleClient);

mongoclient.connect(async function(err, mongoclient){
const sendBitcoin = async (recieverAddress, amountToSend, privateKey, sourceAddress) => {
    //const privateKey = "92hH26AYd1SwwfQgQ19v5Q6QPUhmneim6QdjbACqt1s1G55AhPw";
    //const sourceAddress = "mwWLU1C3oRhFTyQzNKSYnQbhCRgJ35tJph";
    const satoshiToSend = amountToSend * 100000000;
    let fee = 0;
    let inputCount = 0;
    let outputCount = 2;
    var utxos = await axios.get(
      `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
    ).catch(err => {
        return "error: "+err.toString()
    })
    if (utxos.toString().includes("error: ")){
        utxos = utxos.slice(7)
        return utxos.toString()
    }
    const transaction = new bitcore.Transaction();
    let totalAmountAvailable = 0;
  
    let inputs = [];
    utxos.data.data.txs.forEach(async (element) => {
      let utxo = {};
      utxo.satoshis = Math.floor(Number(element.value) * 100000000);
      utxo.script = element.script_hex;
      utxo.address = utxos.data.data.address;
      utxo.txId = element.txid;
      utxo.outputIndex = element.output_no;
      totalAmountAvailable += utxo.satoshis;
      inputCount += 1;
      inputs.push(utxo);
    });
  
    transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
    // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte
  
    fee = transactionSize * 20
    if (totalAmountAvailable - satoshiToSend - fee  < 0) {
      throw new Error("Balance is too low for this transaction");
    }
  
    //Set transaction input
    transaction.from(inputs);
    // set the recieving address and the amount to send
    transaction.to(recieverAddress, satoshiToSend);
    // Set change address - Address to receive the left over funds after transfer
    transaction.change(sourceAddress);
    //manually set transaction fees: 20 satoshis per byte
    transaction.fee(fee);
    // Sign transaction with your private key
    transaction.sign(privateKey);
    // serialize Transactions
    const serializedTX = transaction.serialize()

    if (serializedTX.includes("error: :error://::")){
        return serializedTX.slice(19)
    }
    // Send transaction
    const result = await axios({
      method: "POST",
      url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
      data: {
        tx_hex: serializedTX,
      },
    });
    return result.data.data;
  };
const sendBitcoinIncludeFee = async (recieverAddress, amountToSend, privateKey, sourceAddress) => {
    //const privateKey = "92hH26AYd1SwwfQgQ19v5Q6QPUhmneim6QdjbACqt1s1G55AhPw";
    //const sourceAddress = "mwWLU1C3oRhFTyQzNKSYnQbhCRgJ35tJph";
    const satoshiToSend = amountToSend * 100000000;
    let fee = 0;
    let inputCount = 0;
    let outputCount = 2;
    var utxos = await axios.get(
      `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
    ).catch(err => {
        return "error: "+err.toString()
    })
    if (utxos.toString().includes("error: ")){
        utxos = utxos.slice(7)
        return utxos.toString()
    }
    const transaction = new bitcore.Transaction();
    let totalAmountAvailable = 0;
  
    let inputs = [];
    utxos.data.data.txs.forEach(async (element) => {
      let utxo = {};
      utxo.satoshis = Math.floor(Number(element.value) * 100000000);
      utxo.script = element.script_hex;
      utxo.address = utxos.data.data.address;
      utxo.txId = element.txid;
      utxo.outputIndex = element.output_no;
      totalAmountAvailable += utxo.satoshis;
      inputCount += 1;
      inputs.push(utxo);
    });
  
    transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
    // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte
  
    fee = transactionSize * 20
    if (totalAmountAvailable - satoshiToSend  < 0) {
      throw new Error("Balance is too low for this transaction");
    }
    console.log(satoshiToSend-fee-100)
    //Set transaction input
    transaction.from(inputs);
    // set the recieving address and the amount to send
    transaction.to(recieverAddress, satoshiToSend-fee-1000);
    // Set change address - Address to receive the left over funds after transfer
    transaction.change(sourceAddress);
    //manually set transaction fees: 20 satoshis per byte
    transaction.fee(fee);
    // Sign transaction with your private key
    transaction.sign(privateKey);
    // serialize Transactions
    const serializedTX = transaction.serialize()

    if (serializedTX.includes("error: :error://::")){
        return serializedTX.slice(19)
    }
    // Send transaction
    const result = await axios({
      method: "POST",
      url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
      data: {
        tx_hex: serializedTX,
      },
    });
    return result.data.data;
  };
const getTxFee = async (sourceAddress, amountToSend) => {
    const satoshiToSend = amountToSend * 100000000;
      let fee = 0;
      let inputCount = 0;
      let outputCount = 2;
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
      ).catch(err => {
          return "error: "+err.toString()
      })
      if (utxos.toString().includes("error: ")){
          utxos = utxos.slice(7)
          return utxos.toString()
      }
      const transaction = new bitcore.Transaction();
      let totalAmountAvailable = 0;
    
      let inputs = [];
      utxos.data.data.txs.forEach(async (element) => {
        let utxo = {};
        utxo.satoshis = Math.floor(Number(element.value) * 100000000);
        utxo.script = element.script_hex;
        utxo.address = utxos.data.data.address;
        utxo.txId = element.txid;
        utxo.outputIndex = element.output_no;
        totalAmountAvailable += utxo.satoshis;
        inputCount += 1;
        inputs.push(utxo);
      });
    
      transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
    
      fee = transactionSize * 20
      return (fee)*0.00000001
  }
const checkTxFee = async (sourceAddress, amountToSend) => {
  const satoshiToSend = amountToSend * 100000000;
    let fee = 0;
    let inputCount = 0;
    let outputCount = 2;
    var utxos = await axios.get(
      `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
    ).catch(err => {
        return "error: "+err.toString()
    })
    if (utxos.toString().includes("error: ")){
        utxos = utxos.slice(7)
        return utxos
    }
    const transaction = new bitcore.Transaction();
    let totalAmountAvailable = 0;
  
    let inputs = [];
    utxos.data.data.txs.forEach(async (element) => {
      let utxo = {};
      utxo.satoshis = Math.floor(Number(element.value) * 100000000);
      utxo.script = element.script_hex;
      utxo.address = utxos.data.data.address;
      utxo.txId = element.txid;
      utxo.outputIndex = element.output_no;
      totalAmountAvailable += utxo.satoshis;
      inputCount += 1;
      inputs.push(utxo);
    });
  
    transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
    // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte
     
    fee = transactionSize * 20
    if (totalAmountAvailable - (satoshiToSend + fee)  < satoshiToSend){
      return (false)
    }else return satoshiToSend+fee;
}
const generateKeyPairs = async () => {
  /*It can generate a random address [and support the retrieval of transactions for that address (via 3PBP)*/
    const keyPair = bitcoin.ECPair.makeRandom({ network: BitcoinjsNetwork });
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: BitcoinjsNetwork });
    const publicKey = keyPair.publicKey.toString("hex");
    const privateKey = keyPair.toWIF();
    return { address, privateKey, publicKey };
  }

const algorithm = 'aes-256-ctr';
const secretKey = secrets.secret;
const iv = crypto.randomBytes(16);
const encrypt = (text) => {

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};
const decrypt = (hash) => {

    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrpyted.toString();
};

router.use(bodyParser.json({ extended: true }));
router.use(requestIp.mw())

var urlencodedParser = bodyParser.urlencoded({ extended: false });
function makeid(length) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
const guiLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 2, // limit each IP to 10 requests per windowMs
  message: "Spam's not cool",
      handler: function(req, res /*, next*/) {
        res.status(429).send({status: "failed", type: "Too many requests per second! (Max is 2 requests per second)"})
      },
});
const longLimiter = rateLimit({
  windowMs: 2000, // 1 second
  max: 1, // limit each IP to 10 requests per windowMs
  message: "Spam's not cool",
      handler: function(req, res /*, next*/) {
        res.status(429).send({status: "failed", type: "Too many requests per second! (Max is 1 requests per 2 seconds)"})
      },

});
const apiLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 100, // limit each IP to 10 requests per windowMs
  message: "Spam's not cool",
      handler: function(req, res /*, next*/) {
        res.status(429).send({status: "failed", type: "Too many requests per second! (Max is 100 requests per second. If you need more, please contact us!)"})
      },
});
// homepage
router.get("/", (req, res) => {
  return res.render("partials/checksize.ejs", {command: "checksize"});
})
router.get('/s', guiLimiter, (req, res) => {
  res.render("index")
});
router.get('/n', (req, res) => {
  res.render("home")
})
router.get("/testdashboard", guiLimiter, async (req, res) => {
  req.session.buser = 77520157
  if (!req.session.buser) return res.redirect("/signin-b")
        let mongo = await checkUser(mongoclient, req.session.buser);
        if (!mongo){ req.session.destroy(); return res.redirect("/signin-b")}
        var publicx;
        var privatex;
        var type;
        var wallet = {};
        wallet.btc = {};
        let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum&vs_currencies=usd")
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

        everything = JSON.stringify(everything);

        res.render("dashboard.ejs", {user: req.session.buser || null, db: mongo || null, publicx: publicx, privatex: privatex, type: type, everything: everything})
})
router.get("/merchantdashboard", guiLimiter, async (req, res) => {
  req.session.muser  = "741793729509064704"
    var keys = {};
    var wallets = "No wallet connected";
    var ltcwallet = "No wallet connected";
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

    if (user.ltc_deposit !== "none"){
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_address_balance/LTC/${user.ltc_deposit}`
      ).catch(err => {
        return "failed";
      })
    if (utxos !== "failed"){
         ltcwallet = "Confirmed balance: "+ utxos.data.data.confirmed_balance+ " LTC; On the way: "+utxos.data.data.unconfirmed_balance+" LTC"
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
  
    let transactions = {};
    transactions.open = openTransac;
    transactions.closed = closedTransac;
    transactions.all = openTransac+closedTransac;
   user = JSON.stringify(user);
   //console.log(user);
   let merchant = user;
   let allSuccess = await mongoclient.db("cointunnel").collection("finished-transactions")
         .find({merchant: merchant.name})
       let successful = await allSuccess.toArray();
          for (var i = 0; i<successful.length; i++){
            delete successful[i]._id;
            delete successful[i].buyerId
          }
      let allFailed = await mongoclient.db("cointunnel").collection("err-transactions")
          .find({"data.merchant": merchant.name})
      let failed = await allFailed.toArray();
          for (var i = 0; i<failed.length; i++){
             delete failed[i]._id;
          }
      let allOpen = await mongoclient.db("cointunnel").collection("open-transactions")
          .find({merchant: merchant.name})
        let open = await allOpen.toArray();
           for (var i = 0; i<open.length; i++){
             delete open[i]._id;
             delete open[i].buyerId
           }
   let txlist = successful.concat(failed, open);
   console.log(txlist)
    res.render("dashboard-m", {db: user, key: keys, wallet: wallets, transac: transactions, ltc_wallet: ltcwallet, transactionList: txlist});

})
router.get("/privacy-policy", (req, res) => {
  res.render("privacypolicy")
})
router.get("/cookie-policy", (req, res) => {
  res.render("cookie")
})
router.get("/prices", async (req, res) => {
  res.render("prices")
})
    ///404 error handling stuff
router.use(function(req, res, next){
  res.status(404);
  res.render('404_error');
});
router.use(function(req, res) {
    res.render('404_error');
});

  async function checkUser(mongoclient, name){
    let result = await mongoclient.db("cointunnel").collection("userData")
    .findOne({name: name});
    if (result){
      return result;
    }else{
    }
  }
 
  async function updateDocumentSet(mongoclient, name, updatedlisting){
              let result = await mongoclient.db("cointunnel").collection("userData")
              .updateOne({ name: name}, {$set: updatedlisting});
  }
  async function createListing(mongoclient, newWord){

        let result = await mongoclient.db("cointunnel").collection("userData").insertOne(newWord);

      }
  
  function swap(json){
  var ret = {};
  for(var key in json){
    ret[json[key]] = key;
  }
  return ret;
}
  async function createUser(mongoclient, newWord){

        let result = await mongoclient.db("cointunnel").collection("userData").insertOne(newWord);

      }
  async function checkStuff(mongoclient, name){
    let result = await mongoclient.db("cointunnel").collection("userData")
    .findOne({name: name});
    if (result){
      return result;
    }else{
    }
  }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  async function updateDocumentSet(mongoclient, name, updatedlisting){
    let result = await mongoclient.db("cointunnel").collection("userData")
    .updateOne({ name: name}, {$set: updatedlisting});
}

})
module.exports = router;
