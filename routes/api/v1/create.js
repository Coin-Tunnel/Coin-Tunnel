
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
    router.post("/", apiLimiter, async (req, res) => {
        //hash the stupid header authorization
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
              if (user.deposit === "none") return res.send({
                status: "failed",
                reason: "no bitcoin deposit address setup in the merchant dashboard!",
                timeStamp: Date.now()
              })
              var test = false;
              var expiry = Date.now()+1800000;
              var callback = req.body.callback;
              var usd = req.body.usd;
              var note = req.body.note;
              var buyerId = req.body.buyerId;
              var amountOfBtc;
              var txid = await makeid(35)
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
              if (!req.body.buyerId) return res.status(400).send({status: "failed", reason: "No buyer id!", timeStamp: Date.now()})
              if (!req.body.callback) return res.status(400).send({status: "failed", reason: "No callback url found in body", timeStamp: Date.now()});
              if (!req.body.usd) return res.status(400).send({status: "failed", reason: "no USD amount found in body!", timeStamp: Date.now()})
            
            let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({tunnelId: req.body.buyerId})
            if (!buyer) return res.status(400).send({
              status: "failed",
              reason: "Invalid buyer ID!",
              timeStamp: Date.now()
            })
            
            let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
            prices = await prices.json()
            let btcPrice = Number(prices.bitcoin.usd)
            amountOfBtc = usd/btcPrice;
            
            
            //start of buyer wallet verifiactaion
            var buyerPublic;
            if (buyer.userPublic !== "none") buyerPublic = buyer.userPublic;
            else if (buyer.generatedPublic !== "none") buyerPublic = buyer.generatedPublic;
            else return res.status(400).send({
              status: "failed",
              reason: "target user does not have sufficient funds",
              timeStamp: Date.now()
            })
            let feeToPay = await checkTxFee(buyerPublic, amountOfBtc)
            if (feeToPay === false) return res.status(400).send({
              "status":"failed",
              "reason":"User's account balance is too low to cover the bitcoin fees!",
              "timeStamp": Date.now()
            })
            feeToPay = feeToPay*0.00000001
            console.log(buyerPublic)
            let buyerWallet = await fetch(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${buyerPublic}`);
            buyerWallet = await buyerWallet.json()
            console.log(buyerWallet)
            console.log(buyerWallet.data.confirmed_balance);
            console.log(amountOfBtc)
            console.log(feeToPay)
            amountOfBtc = feeToPay
            if (buyerWallet.data.unconfirmed_balance > 0) buyerWallet.data.unconfirmed_balance = 0; // gets the worst case senario and uses it (sometimes unconfirmed balance can be negative (withdrawls))
            if (buyerWallet.data.confirmed_balance < amountOfBtc) return res.status(400).send({
              status: "failed",
              reason: "target user does not have sufficient funds",
              timeStamp: Date.now()
            })// probably can delete this
            
              await mongoclient.db("cointunnel").collection("open-transactions").insertOne({
                merchant: dbKey.userId,
                price_in_usd: usd,
                price_in_btc: amountOfBtc,
                creation: Date.now(),
                expiry: expiry,
                callback: callback,
                note: note,
                buyerId: buyerId,
                txid: txid
              });
              // send stupid email to user (Done)
                    let randomid = await makeid(30);
                    let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                      name: randomid,
                      type: "pay",
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
               html:`<h1 style="text-align: center;">Hello ${buyer.email}!</h1><p style="text-align: center;"> This is a confirmation to pay: ${amountOfBtc} (This includes the current bitcoin network fees. Without the fees, your order would be ${usd} usd) &nbsp;<br />If this was you, great! Click the link below to pay! If this wasn't you, no need to panic. All this means, is that someone has your PUBLIC Coin-Tunnel address. (That's why we have these confirmation emails) If you keep getting this email, feel free to regenerate your public key in your dashboard</p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
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
              "price_in_BTC": {
                "total_including_fee": amountOfBtc
              },
              "price_in_USD": usd,
              "expiry": expiry,
              "address": user.deposit,
              "test": test,
              "timestamp": Date.now(),
              "transactionId": txid,
              "note": note
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
