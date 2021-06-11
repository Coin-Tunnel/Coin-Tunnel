
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

sochain_network = "LTC";

String.prototype.replaceAll = function (find, replace){
  var regex = new RegExp(find,'g');
  return this.replace(regex, replace)
}

sleep(1000).then(thing => {
    router.post('/change-ltc', longLimiter, async (req, res) => {
        if (!req.session.buser) return res.send("Your session has expired! Login to continue.");
        // send email 
        let userinfo = await checkStuff(mongoclient, req.session.buser);
        if (!userinfo){ req.session.destroy(); req.session.save(); return res.send("That account doesn't exist!");}
        let expiry = Date.now()+600000;
              let randomid = await makeid(30);
              let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                name: randomid,
                type: "ltc-change",
                expiration: expiry,
                user: req.session.buser
              });
              console.log("created mongodb listing")
              var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: 'cointunnel.0x@gmail.com',
               pass: secrets.gmail_password
           }
       });
       let template = await fetch(`${secrets.domain}/html/wallettemplate.html`);
       template = await template.text();
       template = template.replaceAll("UserNameTemplate", userinfo.email);
       template = template.replaceAll("BuyerIdTemplate", userinfo.tunnelId);
       template = template.replaceAll("PutContentHereTemplate", `<h1 style="text-align: center;">Hello ${userinfo.email}!</h1><p style="text-align: center;">There was a recent attempt to change your LTC cloud account! This will cause the funds in the current wallet to be destroyed! If this was you, great! Click CONFIRM</p>`)
       template = template.replaceAll(`ConfirmationCodeTemplate`, `https://www.coin-tunnel.ml/validate/${randomid}`);
       const mailOptions = {
         from: 'cointunnel.0x@gmail.com', // sender address
         to: userinfo.email, // list of receivers
         subject: 'Coin Tunnel Confirmation', // Subject line
         html: template
       };
       transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            console.log(err)
          else
            console.log(info);
       });
              return res.send("good boi")
    })
    router.post('/change-eth', longLimiter, async (req, res) => {
      if (!req.session.buser) return res.send("Your session has expired! Login to continue.");
      // send email 
      let userinfo = await checkStuff(mongoclient, req.session.buser);
      if (!userinfo){ req.session.destroy(); req.session.save(); return res.send("That account doesn't exist!");}
      let expiry = Date.now()+600000;
            let randomid = await makeid(30);
            let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
              name: randomid,
              type: "eth-change",
              expiration: expiry,
              user: req.session.buser
            });
            console.log("created mongodb listing")
            var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
             user: 'cointunnel.0x@gmail.com',
             pass: secrets.gmail_password
         }
     });
     let template = await fetch(`${secrets.domain}/html/wallettemplate.html`);
       template = await template.text();
       template = template.replaceAll("UserNameTemplate", userinfo.email);
       template = template.replaceAll("BuyerIdTemplate", userinfo.tunnelId);
       template = template.replaceAll("PutContentHereTemplate", `<h1 style="text-align: center;">Hello ${userinfo.email}!</h1><p style="text-align: center;">There was a recent attempt to change your ETH cloud account! This will cause the funds in the current wallet to be destroyed! If this was you, great! Click CONFIRM</p>`)
       template = template.replaceAll(`ConfirmationCodeTemplate`, `https://www.coin-tunnel.ml/validate/${randomid}`);

     const mailOptions = {
       from: 'cointunnel.0x@gmail.com', // sender address
       to: userinfo.email, // list of receivers
       subject: 'Coin Tunnel Confirmation', // Subject line
       html: template
      };
     transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
     });
            return res.send("good boi")
    })
    router.post('/reveal-ltc', longLimiter, async (req, res) => {
      if (!req.session.buser) return res.send("login again! Your session has expired");
      let user = await checkStuff(mongoclient, req.session.buser);
      if (!user.ltc) return res.send("No LTC wallet setup!");
      if (user.ltc.address === "none") return res.send("No LTC wallet setup!");
      let privatekey = decrypt(user.ltc.privatex);
      return res.send(privatekey)
    })
    router.post('/reveal-btc', longLimiter, async (req, res) => {
      if (!req.session.buser) return res.send("login again! Your session has expired");
      let user = await checkStuff(mongoclient, req.session.buser);
      var privatekey;
      if (user.userPublic === "none" && user.generatedPublic === "none") return res.send("No BTC wallet setup!");
      else if (user.userPublic === "none") privatekey = await decrypt(user.generatedPrivate);
      else if (user.generatedPublic === "none") privatekey = await decrypt(user.userPublic);
      return res.send(privatekey)
    })
    router.post('/reveal-eth', longLimiter, async (req, res) => {
      if (!req.session.buser) return res.send("login again! Your session has expired");
      let user = await checkStuff(mongoclient, req.session.buser);
      if (!user.eth) return res.send("No ETH wallet setup!");
      if (user.eth.address === "none") return res.send("No ETH wallet setup!");
      let privatekey = decrypt(user.eth.privatex);
      return res.send(privatekey)
    })
    router.post('/change-ltc-m', longLimiter, async (req, res) => {
        if (!req.session.muser) return res.send("Your current session has expired! No changes have been made. Sign in again to continue.");
        // validate stupid ltc address
        if (!req.body.address) return res.send("You did not post a address! If you are trying to use this as an API service, that is against our ToS");
        let address_data = await fetch(`https://chain.so/api/v2/get_address_balance/LTC/${req.body.address}`);
        address_data = await address_data.json()
        console.log(address_data);
        if (address_data.status !== "success") return res.send("That LTC deposit address is invalid! Nothing has been changed.");
        // update dumb mongodb
        let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: req.session.muser})
        let expiry = Date.now()+600000;
              let randomid = await makeid(30);
              let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
                name: randomid,
                type: "merchant-change-litecoin",
                expiration: expiry,
                user: req.session.muser,
                options: {
                  address: req.body.address
                }
              });
      
        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: 'cointunnel.0x@gmail.com',
               pass: secrets.gmail_password
           }
       });
       let template = await fetch(`${secrets.domain}/html/wallettemplate.html`);
       template = await template.text();
       template = template.replaceAll("UserNameTemplate", user.email);
       template = template.replaceAll("BuyerIdTemplate", user.tunnelId);
       template = template.replaceAll("PutContentHereTemplate", `<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your Litecoin deposit address to the address: ${req.body.address} (This won't affect any balances in the existing wallet); <br> This will cause the funds in the current wallet to be destroyed! If this was you, great! Click CONFIRM</p>`)
       template = template.replaceAll(`ConfirmationCodeTemplate`, `https://www.coin-tunnel.ml/validate/${randomid}`);
       const mailOptions = {
         from: 'cointunnel.0x@gmail.com', // sender address
         to: user.email, // list of receivers
         subject: 'Coin Tunnel Confirmation', // Subject line
         html: template
        };
       transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            console.log(err)
          else
            console.log(info);
          
      })

        return res.send("Success! Check your email for a confirmation link.");
    })
    router.post('/change-eth-m', longLimiter, async (req, res) => {
      if (!req.session.muser) return res.send("You current session has expired! Reload the page.");
      if (!req.body.address) return res.send("You did not post a address! If you are trying to use this as an API service, that is against our ToS");
       
      let address_data = await fetch(`https://api.blockcypher.com/v1/eth/main/addrs/${req.body.address}/balance`);
      address_data = await address_data.json();
      if (address_data.error) return res.send("That ETH address is invalid! Nothing has been changed");
      // send stupid email
      let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: req.session.muser})
      let expiry = Date.now()+600000;
            let randomid = await makeid(30);
            let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
              name: randomid,
              type: "merchant-change-ethereum",
              expiration: expiry,
              user: req.session.muser,
              options: {
                address: req.body.address
              }
            });
    
      var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
             user: 'cointunnel.0x@gmail.com',
             pass: secrets.gmail_password
         }
     });
     let template = await fetch(`${secrets.domain}/html/wallettemplate.html`);
       template = await template.text();
       template = template.replaceAll("UserNameTemplate", user.email);
       template = template.replaceAll("BuyerIdTemplate", user.tunnelId);
       template = template.replaceAll("PutContentHereTemplate", `<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your ETHEREUM deposit address to the address: ${req.body.address} (This won't affect any balances in the existing wallet); <br> This will cause the funds in the current wallet to be destroyed! If this was you, great! Click CONFIRM</p>`)
       template = template.replaceAll(`ConfirmationCodeTemplate`, `https://www.coin-tunnel.ml/validate/${randomid}`);
     const mailOptions = {
       from: 'cointunnel.0x@gmail.com', // sender address
       to: user.email, // list of receivers
       subject: 'Coin Tunnel Confirmation', // Subject line
       html: template
      };
     transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
        
    })

      return res.send("Success! Check your email for a confirmation link.");
    })
    router.post('/reveal-xrp', longLimiter, async (req, res) => {
      if (!req.session.buser) return res.send("login again! Your session has expired");
      let user = await checkStuff(mongoclient, req.session.buser);
      if (!user.xrp) return res.send("No XRP wallet setup!");
      if (user.xrp.address === "none") return res.send("No XRP wallet setup!");
      let privatekey = decrypt(user.xrp.privatex);
      return res.send(privatekey)
    })
    router.post('/change-xrp', longLimiter, async (req, res) => {
      if (!req.session.buser) return res.send("Your session has expired! Login to continue.");
      // send email 
      let userinfo = await checkStuff(mongoclient, req.session.buser);
      if (!userinfo){ req.session.destroy(); req.session.save(); return res.send("That account doesn't exist!");}
      let expiry = Date.now()+600000;
            let randomid = await makeid(30);
            let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
              name: randomid,
              type: "xrp-change",
              expiration: expiry,
              user: req.session.buser
            });
            console.log("created mongodb listing")
            var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
             user: 'cointunnel.0x@gmail.com',
             pass: secrets.gmail_password
         }
     });
     let template = await fetch(`${secrets.domain}/html/wallettemplate.html`);
     template = await template.text();
     template = template.replaceAll("UserNameTemplate", userinfo.email);
     template = template.replaceAll("BuyerIdTemplate", userinfo.tunnelId);
     template = template.replaceAll("PutContentHereTemplate", `<h1 style="text-align: center;">Hello ${userinfo.email}!</h1><p style="text-align: center;">There was a recent attempt to change your XRP cloud account! This will cause the funds in the current wallet to be destroyed! If this was you, great! Click CONFIRM</p>`)
     template = template.replaceAll(`ConfirmationCodeTemplate`, `https://www.coin-tunnel.ml/validate/${randomid}`);
     const mailOptions = {
       from: 'cointunnel.0x@gmail.com', // sender address
       to: userinfo.email, // list of receivers
       subject: 'Coin Tunnel Confirmation', // Subject line
       html: template
      };
     transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
     });
            return res.send("good boi")
    })
    router.post('/change-xrp-m', longLimiter, async (req, res) => {
      if (!req.session.muser) return res.send("Your current session has expired! No changes have been made. Sign in again to continue.");
      // validate stupid ltc address
      if (!req.body.address) return res.send("You did not post a address! If you are trying to use this as an API service, or modified our client code, that is against our ToS");
      let address = await fetch(`https://www.coin-tunnel.ml/api/v2/explorer/xrp/address/${req.body.address}`);
      address = await address.json();
      if (address.status === "failed") return res.send("That was an invalid XRP address! Nothing has been changed");
      let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: req.session.muser})
      let expiry = Date.now()+600000;
            let randomid = await makeid(30);
            let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
              name: randomid,
              type: "merchant-change-ripple",
              expiration: expiry,
              user: req.session.muser,
              options: {
                address: req.body.address
              }
            });
    
      var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
             user: 'cointunnel.0x@gmail.com',
             pass: secrets.gmail_password
         }
     });
     let template = await fetch(`${secrets.domain}/html/wallettemplate.html`);
       template = await template.text();
       template = template.replaceAll("UserNameTemplate", user.email);
       template = template.replaceAll("BuyerIdTemplate", user.tunnelId);
       template = template.replaceAll("PutContentHereTemplate", `<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your RIPPLE (XRP) deposit address to the address: ${req.body.address} (This won't affect any balances in the existing wallet); <br> This will cause the funds in the current wallet to be destroyed! If this was you, great! Click CONFIRM</p>`)
       template = template.replaceAll(`ConfirmationCodeTemplate`, `https://www.coin-tunnel.ml/validate/${randomid}`);

     const mailOptions = {
       from: 'cointunnel.0x@gmail.com', // sender address
       to: user.email, // list of receivers
       subject: 'Coin Tunnel Confirmation', // Subject line
       html: template
      };
     transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
        
    })

      return res.send("Success! Check your email for a confirmation link.");
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
