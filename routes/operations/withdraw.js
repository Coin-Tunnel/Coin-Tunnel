
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sleep(1000).then(thing => {
  router.post("/ltc", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.send("You must be logged in!");
    if (Number(req.body.amount).toString().toLowerCase() === "nan") return res.send("That wasn't a valid amount!")
        console.log(req.body)
        var secret;
        var publicadr
        let userinfo = await checkStuff(mongoclient, req.session.buser);
        if (userinfo.ltc.address === "none"){
          return res.send("No wallet connected!");
        }
          secret = userinfo.ltc.privatex;
          publicadr = userinfo.ltc.address;

          let secretkeys = await decrypt(secret);
        console.log(secretkeys)
        console.log(publicadr)
        let sochain_response = await fetch(`https://sochain.com/api/v2/get_tx_unspent/LTC/${req.body.address}`);
        sochain_response = await sochain_response.json();
        console.log(sochain_response)
        if (sochain_response.status !== "success"){
          return res.send("That ltc address is not valid!")
        }
        let sochain_balance = await fetch(`https://sochain.com/api/v2/get_address_balance/LTC/${userinfo.ltc.address}`);
        sochain_balance = await sochain_balance.json();
       if (Number(sochain_balance.data.unconfirmed_balance) < 0) sochain_balance.data.confirmed_balance = Number(sochain_balance.data.confirmed_balance)+Number(sochain_balance.data.unconfirmed_balance)

        if (Number(sochain_balance.data.confirmed_balance) < Number(req.body.amount)+0.00021 || Number(req.body.amount) === 0) return res.send("You don't have enough funds to do this! Remember that the LTC network has a 0.00021 network FEE!")
        //sendBitcoin(req.body.address, 0.0000, secretkeys, publicadr, "DOGE").then(result => {
          all()
          async function all(){
                // good
                let expiry = Date.now()+600000;
                let randomid = await makeid(30);
                let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                  name: randomid,
                  type: "withdraw-ltc",
                  expiration: expiry,
                  user: req.session.buser,
                  options: {
                    withdrawto: req.body.address,
                    amount: req.body.amount
                  }
                });
                console.log("created mongodb listing")
                var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
                 user: 'cointunnel.0x@gmail.com',
                 pass: secrets.gmail_password
             }
         });
         const mailOptions = {
           from: 'cointunnel.0x@gmail.com', // sender address
           to: userinfo.email, // list of receivers
           subject: 'Coin Tunnel Confirmation', // Subject line
           html:`<h1 style="text-align: center;">Hello ${userinfo.email}!</h1><p style="text-align: center;">There was a recent attempt to withdraw ${req.body.amount} LTC from your account!&nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
         };
         transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              console.log(err)
            else
              console.log(info);
         });
                return res.send("good boi")
            
          }
  })
  router.post("/btc", guiLimiter, async (req, res) => {
        if (!req.session.buser) return res.send("You must be logged in!")
        console.log(req.body)
        var secret;
        var publicadr
        let userinfo = await checkStuff(mongoclient, req.session.buser);
        if (userinfo.generatedPrivate === "none" && userinfo.userPrivate === "none"){
          return res.send("no wallet");
        }else if (userinfo.userPrivate === "none"){
          secret = userinfo.generatedPrivate;
          publicadr = userinfo.generatedPublic;
        }else if (userinfo.generatedPrivate === "none"){
          secret = userinfo.userPrivate;
          publicadr = userinfo.userPublic
        }
        console.log("1")
        let secretkeys = await decrypt(secret);
        console.log(secretkeys)
        console.log(publicadr)
        sendBitcoin(req.body.address, 0.0000, secretkeys, publicadr).then(result => {
          if (!result.toString().includes("network")){
            console.log("bad boi")
            //res.render("connect", {error: "Check your private and public keys again! They don't seem to be valid"})
            return res.send("bad boi")
          }
      }).catch(err => {
        if (!err.toString().includes("Dust") || err.toString().includes("checksum")) return res.send("That bitcoin address is not valid!")
        all()
        async function all(){
          if (err.toString().includes("Dust")){
              // good
              let expiry = Date.now()+600000;
              let randomid = await makeid(30);
              let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                name: randomid,
                type: "withdraw",
                expiration: expiry,
                user: req.session.buser,
                options: {
                  withdrawto: req.body.address,
                  amount: req.body.amount
                }
              });
              console.log("created mongodb listing")
              var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: 'cointunnel.0x@gmail.com',
               pass: secrets.gmail_password
           }
       });
       const mailOptions = {
         from: 'cointunnel.0x@gmail.com', // sender address
         to: userinfo.email, // list of receivers
         subject: 'Coin Tunnel Confirmation', // Subject line
         html:`<h1 style="text-align: center;">Hello ${userinfo.email}!</h1><p style="text-align: center;">There was a recent attempt to withdraw ${req.body.amount}BTC from your account!&nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
       };
       transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            console.log(err)
          else
            console.log(info);
       });
              return res.send("good boi")
          }else{
              //bad
              return res.send("Invalid bitcoin address!")
          }
        }
      })
  })
  router.post("/eth", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.send("You must be logged in!");
    if (Number(req.body.amount).toString().toLowerCase() === "nan") return res.send("That wasn't a valid amount!")
        console.log(req.body)
        var secret;
        var publicadr
        let userinfo = await checkStuff(mongoclient, req.session.buser);
        if (!userinfo.eth) return res.send("No ETH wallet connected!")
        if (userinfo.eth.address === "none"){
          return res.send("No wallet connected!");
        }
          secret = userinfo.eth.privatex;
          publicadr = userinfo.eth.address;

          let secretkeys = await decrypt(secret);
        if (req.body.address.length !== 42) return res.send("That wasn't a valid ETH deposit address!")
        let etherscan_response = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${req.body.address}&tag=latest&apikey=${secrets.etherScan}`);
        etherscan_response = await etherscan_response.json();
        console.log("etherescan_ response 168")
        console.log(etherscan_response)
        if (etherscan_response.status !== "1"){
          return res.send("That ETH address is not valid!")
        }
        let balance = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${userinfo.eth.address}&tag=latest&apikey=${secrets.etherScan}`);
        balance = await balance.json();
        let currentGas = await fetch("https://www.coin-tunnel.ml/api/v2/explorer/eth/gasPrice");
        currentGas = await currentGas.json();
        currentGas = Number(currentGas)*0.000000000000000001;
        console.log(Number(req.body.amount)+(0.00022*currentGas));
        if (Number(balance.result)*0.000000000000000001 < Number(req.body.amount)+(0.00022*currentGas) || Number(req.body.amount) === 0) return res.send("You don't have enough funds to do this! Remember that the ETH network has network fees!")
          all()
          async function all(){
                // good
                let expiry = Date.now()+600000;
                let randomid = await makeid(30);
                let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                  name: randomid,
                  type: "withdraw-eth",
                  expiration: expiry,
                  user: req.session.buser,
                  options: {
                    withdrawto: req.body.address,
                    amount: req.body.amount
                  }
                });
                console.log("created mongodb listing")
                var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
                 user: 'cointunnel.0x@gmail.com',
                 pass: secrets.gmail_password
             }
         });
         const mailOptions = {
           from: 'cointunnel.0x@gmail.com', // sender address
           to: userinfo.email, // list of receivers
           subject: 'Coin Tunnel Confirmation', // Subject line
           html:`<h1 style="text-align: center;">Hello ${userinfo.email}!</h1><p style="text-align: center;">There was a recent attempt to withdraw ${req.body.amount} ETH from your account!&nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
         };
         transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              console.log(err)
            else
              console.log(info);
         });
                return res.send("good boi")
            
          }
  })
  router.post("/xrp", guiLimiter, async (req, res) => {
    if (!req.session.buser) return res.send("You must be logged in!");
    let user = await mongoclient.db("cointunnel").collection("userData").findOne({name: req.session.buser});
    let userinfo = user;
    if (!user.xrp || user.xrp.address === "none") return res.send("You don't have an XRP address setup!");
    if (Number(req.body.amount).toString().toLowerCase() === "nan") return res.send("That wasn't a valid amount!")
    console.log(req.body)
    if (req.body.address === "") return res.send("That was an invalid XRP address!")
    let address = await fetch(`https://www.coin-tunnel.ml/api/v2/explorer/xrp/address/${req.body.address}`);
    address = await address.json();
    if (address.status === "failed" && address.reason.toString().toLowerCase().includes("account not found")){
      
    }else if (address.status === "ok"){
      
    }else return res.send("That wasn't a valid XRP deposit address!");
    // do stuff here
    if (req.body.tag !== ""){
      if (Number(req.body.tag).toString().toLowerCase() === "nan") return res.send("The deposit TAG must be a number!")
    }
    if (Number(req.body.amount).toString().toLowerCase() === "nan" || req.body.amount === "") return res.send("The amount must be a number")
    let originalAdr = await fetch(`https://www.coin-tunnel.ml/api/v2/explorer/xrp/address/${user.xrp.address}`);
    originalAdr = await originalAdr.json();
    if (originalAdr.status === "failed" || Number(originalAdr.data.xrpBalance) < Number(req.body.amount)) return res.send("You do not have enough XRP to fund this transaction!");
    // create mongodb document email thingy and send email;
    let expiry = Date.now()+600000;
                let randomid = await makeid(30);
                let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                  name: randomid,
                  type: "withdraw-xrp",
                  expiration: expiry,
                  user: req.session.buser,
                  options: {
                    withdrawto: req.body.address,
                    amount: req.body.amount,
                    tag: req.body.tag
                  }
                });
                console.log("created mongodb listing")
                var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
                 user: 'cointunnel.0x@gmail.com',
                 pass: secrets.gmail_password
             }
         });
         const mailOptions = {
           from: 'cointunnel.0x@gmail.com', // sender address
           to: userinfo.email, // list of receivers
           subject: 'Coin Tunnel Confirmation', // Subject line
           html:`<h1 style="text-align: center;">Hello ${userinfo.email}!</h1><p style="text-align: center;">There was a recent attempt to withdraw ${req.body.amount} XRP from your account to deposit tag ${req.body.tag}!&nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
         };
         transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              console.log(err)
            else
              console.log(info);
         });
         return res.send("good boi")
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
