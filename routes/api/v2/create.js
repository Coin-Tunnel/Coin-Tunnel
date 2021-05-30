
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}


sleep(1000).then(thing => {
    router.post('/', (req, res) => {
        return res.status(400).send({status: "failed", reason: "no coin selected! use path /api/v2/:cointicker"})
    })
    router.post('/btc', async (req, res) => {
        return res.status(400).send({status: "failed", reason: "api v2 does not support bitcoin! Use api v1"});
    })
    router.post('/ltc', async (req, res) => {
      req.body.buyerId = req.body.buyerId.replace(/\s/g, '');
        if (!req.headers.authorization) return res.status(401).send({
            status: "failed",
            reason: "no apparent authorization header",
            timeStamp: Date.now()
          })
          let prefix = req.headers.authorization.slice(0, 10);
          let key = req.headers.authorization.slice(10);
        
          const hmac = createHmac('sha512', key);
          hmac.update(JSON.stringify(prefix));
          const signature = hmac.digest('hex');
        
          let dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({hash: signature})
          if (!dbKey) return res.status(401).send({
            status: "failed",
            reason: "Incorrect API key",
            timeStamp: Date.now()
          })
          await mongoclient.db("cointunnel").collection("keys")
             .updateOne({hash: signature}, { $inc: {"uses":1}})
          let currentIp = req.connection.remoteAddress;
          if (!dbKey.ip.includes(currentIp)){
            await mongoclient.db("cointunnel").collection("keys")
              .updateOne({hash: signature}, {$push: {ip: currentIp}})
          }
          let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: dbKey.userId});
          if (!user) return res.status(401).send({
            status: "failed",
            reason: "Merchant account is gone",
            timeStamp: Date.now()
          })
          if (user.ltc_deposit === undefined || user.ltc_deposit === "none") return res.send({
            status: "failed",
            reason: "No LTC depost setup in merchant dashboard",
            timeStamp: Date.now()
          });
          
          var test = false;
          var expiry = Date.now()+1800000;
          var callback = req.body.callback;
          var usd = req.body.usd;
          var note = req.body.note;
          var buyerId = req.body.buyerId;
          var amountOfLtc;
          var txid = await makeid(35);
          txid = "D"+txid;
          var coin = "ltc";
          var version = "v2";
        // make sure to log the stupid ip too
          if (req.body.expiry){
            req.body.expiry = Number(req.body.expiry)
            if (Number(req.body.expiry).toString().toLowerCase().includes("nan")) return res.status(400).send({
              status: "failed",
              reason: "invalid expiry date (Must be in milliseconds)",
              timeStamp: Date.now()
            })
          }
          if (req.body.test) test = req.body.test;
          if (req.body.expiry) expiry = req.body.expiry+Date.now();
          if (!req.body.buyerId) return res.status(400).send({status: "failed", reason: "No buyerId found!", timeStamp: Date.now()})
          if (!req.body.callback) return res.status(400).send({status: "failed", reason: "No callback url found in body", timeStamp: Date.now()});
          if (!req.body.usd) return res.status(400).send({status: "failed", reason: "no USD amount found in body!", timeStamp: Date.now()})
        
        let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({tunnelId: req.body.buyerId})
        if (!buyer) return res.status(400).send({
          status: "failed",
          reason: "Invalid buyer ID!",
          timeStamp: Date.now()
        })
        
        let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd")
        prices = await prices.json()
        let ltcPrice = Number(prices.litecoin.usd)
        amountOfLtc = usd/ltcPrice;
        
        
        //start of buyer wallet verifiactaion
        var buyerPublic;
        if (buyer.ltc.address === "none") return res.status(400).send({
          status: "failed",
          reason: "target user does not have sufficient funds",
          timeStamp: Date.now()
        })
        else buyerPublic = buyer.ltc.address;

        console.log(buyerPublic)
        let buyerWallet = await fetch(`https://sochain.com/api/v2/get_address_balance/LTC/${buyerPublic}`);
        buyerWallet = await buyerWallet.json()
        console.log(buyerWallet)
        console.log(amountOfLtc)
        if (amountOfLtc < 0.0033) return res.status(400).send({
          status: "failed",
          reason: `ltc equivalant (${amountOfLtc}ltc) was below the minimum amount of 0.0033`
        })
        if (buyerWallet.data.unconfirmed_balance > 0) buyerWallet.data.unconfirmed_balance = 0; // gets the worst case senario and uses it (sometimes unconfirmed balance can be negative (withdrawls))
        console.log(Number(buyerWallet.data.confirmed_balance)+Number(buyerWallet.data.unconfirmed_balance))
        if (Number(buyerWallet.data.confirmed_balance)+Number(buyerWallet.data.unconfirmed_balance) < amountOfLtc+0.00023) return res.status(400).send({
          status: "failed",
          reason: "target user does not have sufficient funds",
          timeStamp: Date.now()
        })// probably can delete this
        
          await mongoclient.db("cointunnel").collection("open-transactions").insertOne({
            merchant: dbKey.userId,
            price_in_usd: usd,
            price_in_crypto: amountOfLtc,
            creation: Date.now(),
            expiry: expiry,
            callback: callback,
            note: note,
            buyerId: buyerId,
            txid: txid,
            coin: "ltc",
            version: "v2"
          });
                let randomid = await makeid(30);
                await mongoclient.db("cointunnel").collection("emails").insertOne({
                  name: randomid,
                  type: "pay-ltc",
                  expiration: expiry,
                  options: {
                    transactionId: txid
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
           to: buyer.email, // list of receivers
           subject: 'Coin Tunnel Confirmation', // Subject line
           html:`<h1 style="text-align: center;">Hello ${buyer.email}!</h1><p style="text-align: center;"> This is a confirmation to pay: ${amountOfLtc} litecoin. (This includes the current litecoin network fees. Without the fees, your order would be ${usd} USD) &nbsp;<br />If this was you, great! Click the link below to pay! If this wasn't you, no need to panic. All this means, is that someone has your PUBLIC Coin-Tunnel address. (That's why we have these confirmation emails) If you keep getting this email, feel free to regenerate your public key in your dashboard</p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
         };
         transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              console.log(err)
            else
              console.log(info);
            })
        
          return res.status(200).send({
            "status":"ok",
          "created": true,
          "callback":callback,
          "price_in_crypto": {
            "total_including_fee": amountOfLtc
          },
          "price_in_USD": usd,
          "expiry": expiry,
          "address": user.ltc_deposit,
          "test": test,
          "timestamp": Date.now(),
          "transactionId": txid,
          "note": note,
          "coin": "ltc"
          })
        // make sure there is all that callback money userid good stuff
    })
    router.post('/eth', async (req, res) => {
      req.body.buyerId = req.body.buyerId.replace(/\s/g, '');
      if (!req.headers.authorization) return res.status(401).send({
        status: "failed",
        reason: "no apparent authorization header",
        timeStamp: Date.now()
      })
      let prefix = req.headers.authorization.slice(0, 10);
      let key = req.headers.authorization.slice(10);
    
      const hmac = createHmac('sha512', key);
      hmac.update(JSON.stringify(prefix));
      const signature = hmac.digest('hex');
    
      let dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({hash: signature})
      if (!dbKey) return res.status(401).send({
        status: "failed",
        reason: "Incorrect API key",
        timeStamp: Date.now()
      })
      await mongoclient.db("cointunnel").collection("keys")
         .updateOne({hash: signature}, { $inc: {"uses":1}})
      let currentIp = req.connection.remoteAddress;
      if (!dbKey.ip.includes(currentIp)){
        await mongoclient.db("cointunnel").collection("keys")
          .updateOne({hash: signature}, {$push: {ip: currentIp}})
      }
      let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: dbKey.userId});
      if (!user) return res.status(401).send({
        status: "failed",
        reason: "Merchant account is gone",
        timeStamp: Date.now()
      })
      if (user.eth_deposit === undefined || user.ethdeposit === "none") return res.send({
        status: "failed",
        reason: "No ETH depost setup in merchant dashboard",
        timeStamp: Date.now()
      });
      var test = false;
      var expiry = Date.now()+1800000;
      var callback = req.body.callback;
      var usd = req.body.usd;
      var note = req.body.note;
      var buyerId = req.body.buyerId;
      var amountOfEth;
      var txid = await makeid(35);
      txid = "D"+txid;
      var coin = "eth";
      var version = "v2";
    // make sure to log the stupid ip too
      if (req.body.expiry){
        req.body.expiry = Number(req.body.expiry)
        if (Number(req.body.expiry).toString().toLowerCase().includes("nan")) return res.status(400).send({
          status: "failed",
          reason: "invalid expiry date (Must be in milliseconds)",
          timeStamp: Date.now()
        })
      }
      if (req.body.test) test = req.body.test;
      if (req.body.expiry) expiry = req.body.expiry+Date.now();
      if (!req.body.buyerId) return res.status(400).send({status: "failed", reason: "No buyerId found!", timeStamp: Date.now()})
      if (!req.body.callback) return res.status(400).send({status: "failed", reason: "No callback url found in body", timeStamp: Date.now()});
      if (!req.body.usd) return res.status(400).send({status: "failed", reason: "no USD amount found in body!", timeStamp: Date.now()})
    let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({tunnelId: req.body.buyerId})
    if (!buyer) return res.status(400).send({
      status: "failed",
      reason: "Invalid buyer ID!",
      timeStamp: Date.now()
    })
    
    let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
    prices = await prices.json()
    let ethPrice = Number(prices.ethereum.usd)
    amountOfEth = usd/ethPrice;
    
    
    //start of buyer wallet verifiactaion
    var buyerPublic;
    if (buyer.eth.address === "none") return res.status(400).send({
      status: "failed",
      reason: "target user does not have sufficient funds",
      timeStamp: Date.now()
    })
    else buyerPublic = buyer.eth.address;

    console.log(buyerPublic)
    let buyerWallet = await fetch(`https://api.blockcypher.com/v1/eth/main/addrs/${buyerPublic}/balance`);
    buyerWallet = await buyerWallet.json()
    console.log(buyerWallet)
    console.log(amountOfEth)
    if (amountOfEth < 0.00037) return res.status(400).send({
      status: "failed",
      reason: `ltc equivalant (${amountOfEth}eth) was below the minimum amount of 0.00037`
    })
    if (buyerWallet.unconfirmed_balance > 0) buyerWallet.unconfirmed_balance = 0; // gets the worst case senario and uses it (sometimes unconfirmed balance can be negative (withdrawls))
    console.log(Number(buyerWallet.balance)+Number(buyerWallet.unconfirmed_balance))
    if (Number(buyerWallet.balance)+Number(buyerWallet.unconfirmed_balance) < amountOfEth+0.00023) return res.status(400).send({
      status: "failed",
      reason: "target user does not have sufficient funds",
      timeStamp: Date.now()
    })// probably can delete this
    
      await mongoclient.db("cointunnel").collection("open-transactions").insertOne({
        merchant: dbKey.userId,
        price_in_usd: usd,
        price_in_crypto: amountOfEth,
        creation: Date.now(),
        expiry: expiry,
        callback: callback,
        note: note,
        buyerId: buyerId,
        txid: txid,
        coin: "eth",
        version: "v2"
      });
            let randomid = await makeid(30);
            await mongoclient.db("cointunnel").collection("emails").insertOne({
              name: randomid,
              type: "pay-eth",
              expiration: expiry,
              options: {
                transactionId: txid
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
       to: buyer.email, // list of receivers
       subject: 'Coin Tunnel Confirmation', // Subject line
       html:`<h1 style="text-align: center;">Hello ${buyer.email}!</h1><p style="text-align: center;"> This is a confirmation to pay: ${amountOfEth} ethereum (${usd} USD). (This does NOT include the ethereum GAS fees. These can range from 0.0005 ETH to 0.005) &nbsp;<br />If this was you, great! Click the link below to pay! If this wasn't you, no need to panic. All this means, is that someone has your PUBLIC Coin-Tunnel address. (That's why we have these confirmation emails) If you keep getting this email, feel free to regenerate your public key in your dashboard</p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
     };
     transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
        })
    
      return res.status(200).send({
        "status":"ok",
      "created": true,
      "callback":callback,
      "price_in_crypto": {
        "total_including_fee": amountOfEth
      },
      "price_in_USD": usd,
      "expiry": expiry,
      "address": user.eth_deposit,
      "test": test,
      "timestamp": Date.now(),
      "transactionId": txid,
      "note": note,
      "coin": "eth"
      })
    // make sure there is all that callback money userid good stuff

    })
})


module.exports = function(var1){

    secrets = var1.secrets;
    bitcore = var1.bitcore;
    bitcoin = var1.bitcoin;
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
  
   return router;
}
