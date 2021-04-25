
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
  validateEmailLInk: false,
  withdraw: false
}
const bitcore = require("bitcore-lib")
const sochain_network = "BTCTEST";
var nodemailer = require('nodemailer');
const requestIp = require('request-ip');

const router = require('express').Router();
const { createHmac } = require("crypto");
const crypto = require("crypto")
const rateLimit = require("express-rate-limit");
const axios = require('axios')
var bodyParser = require("body-parser");
const { clientId, clientSecret, scopes, redirectUri } = require('../config.json');
const secrets = require("../secret.json");
console.log(secrets)
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
    transaction.fee(fee * 20);
  
    // Sign transaction with your private key
    transaction.sign(privateKey);
  
    // serialize Transactions
    const serializedTX = transaction.serialize();
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
// homepage
router.get('/', (req, res) => {
    //console.log(req.clientIp)
    res.render("index.ejs", {pageTitle: "Url shortener"})
});
router.get("/signup-b", async (req, res) => {
  if (req.session.buser){
    return res.redirect("/dashboard-b")
  }
  res.render("signup-b")
})
router.get("/signup-m", async (req, res) => {
  if (req.session.muser){
    return res.redirect("/dashboard-m")
  }
  res.render("signup-m")
})
router.get("/signup-buyer-discord", async (req, res) => {

    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=832674762076455002&redirect_uri=https%3A%2F%2Fwww.coin-tunnel.ml%2Fdiscord-buyer-callback&response_type=code&scope=identify%20email`;
    res.redirect(authorizeUrl);
})
router.get("/signup-buyer-github-callback", async (req, res) =>{
   let todo = {
     "client_id":"c5781bcd6196007a6e16",
     "client_secret":secrets.github_buyer,
     "code":req.query.code
   }
  let github = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: JSON.stringify(todo),
    headers: { 'Content-Type': 'application/json' }
})
github = await github.text()
let position = github.indexOf("=");
let and = github.indexOf("&");
github = github.slice(position+1, and);
console.log(github)
let user = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', "Authorization":"token "+github }
})
user = await user.json();
console.log(user);
req.session.buser = user.id;
let emails = await fetch("https://api.github.com/user/emails", {
  method: 'GET',
    headers: { 'Content-Type': 'application/json', "Authorization":"token "+github }
})
emails = await emails.json();
if (!emails[0]) return res.redirect("/dashboard-b")
else console.log(emails[0].email)
const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("userData").find( {"name": user.id}).count();

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
            name: user.id,
            tunnelId:generateId,
            type:"github",
            userPrivate: "none",
            userPublic: "none",
            generatedPrivate: "none",
            generatedPublic:"none",
            email: emails[0].email
          })
          req.session.buser = user.id
          return res.redirect("/checkUser")
        }
        else {
          res.redirect("/dashboard-b")
        }
})
router.get('/discord-buyer-callback', async (req, res) => {
    
    const accessCode = req.query.code;
    if (!accessCode){
      res.redirect("/signup-b")
    req.session.destroy();
    }
    const data = new FormData();
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', "https://www.coin-tunnel.ml/discord-buyer-callback");
    data.append('scope', scopes.join(' '));
    data.append('code', accessCode);
    let x = await fetch('https://discordapp.com/api/oauth2/token', {
        method: 'POST',
        body: data
    })
    let response = await x.json()
    let y = await fetch('https://discordapp.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: `${response.token_type} ${response.access_token}`
            },
    })
    let userResponse = await y.json()
    console.log(userResponse)
            userResponse.tag = `${userResponse.username}#${userResponse.discriminator}`;
            req.session.buser = userResponse.id;
            console.log(req.session.buser);

    const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("userData").find( {"name": req.session.buser}).count();

        if (testresult === 0){
          var generateId = "none"
          for (var t = 0; t<10; t++){
            if (t === 8) res.status(500).send("Could not create an id that isn't taken after 8 tries!")
            generateId = await makeid(25)
            let testid = await db.collection("userData").find( {"tunnelId": generateId}).count();
            if (testid === 0) break
          }
          console.log(userResponse)
          await createUser(mongoclient,
          {
            name: req.session.buser,
            tunnelId: generateId,
            type:"discord",
            userPrivate: "none",
            userPublic: "none",
            generatedPrivate: "none",
            generatedPublic:"none",
            email: userResponse.email,
            discord: {
              tag: userResponse.tag
            }
          })
          res.redirect("/checkUser")
        }
        else {
          res.send("You already have an account! Sign in instead")
        }
});
router.get("/dashboard-b", async (req, res) => {
  if (!req.session.buser) return res.redirect("/signin-b")
  let mongo = await checkUser(mongoclient, req.session.buser);
  if (!mongo){ req.session.destroy(); return res.redirect("/signin-b")}
  var publicx;
  var privatex;
  var type;
  var wallet = {};
  wallet.btc = {};
  let prices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
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
    //
    let address_data = await fetch("https://sochain.com/api/v2/get_address_balance/"+sochain_network+"/"+publicx)
    address_data = await address_data.json()
    console.log(address_data)
    if (Number(address_data.data.unconfirmed_balance) !== 0){
      wallet.amount = "In wallet: "+address_data.confirmed_balance.toString()+", On the way: "+address_data.data.unconfirmed_balance.toString()
    }else {
      wallet.amount = "In wallet: "+address_data.data.confirmed_balance.toString()
    }
    wallet.btc.usd = btcPrice*Number(address_data.data.confirmed_balance)

    //
  }else if (mongo.generatedPrivate === "none"){
    publicx = mongo.userPublic;
    privatex = mongo.userPrivate;
    type = "Connected Wallet"
    //
    let address_data = await fetch("https://sochain.com/api/v2/get_address_balance/"+sochain_network+"/"+publicx)
    address_data = await address_data.json()
    console.log(address_data)
    if (Number(address_data.data.unconfirmed_balance) !== 0){
      wallet.amount = "In wallet: "+address_data.data.confirmed_balance.toString()+", On the way: "+address_data.data.unconfirmed_balance.toString()
    }else {
      wallet.amount = "In wallet: "+address_data.data.confirmed_balance.toString()
    }
    wallet.btc.usd = btcPrice*Number(address_data.data.confirmed_balance)
    //
  }
  res.render("dashboard.ejs", {user: req.session.buser || null, db: mongo || null, publicx: publicx, privatex: privatex, type: type, wallet: wallet})
})
router.post("/validateGoogle", async (req, res) => {
await sleep(1000)
//if (!req.session.google) return;
async function verify() {
  try{
  const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idtoken,
      audience: secrets.googleClient,
  });

  const payload = ticket.getPayload();
  const userid = payload['sub'];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  return userid
  }catch{
    console.log("error")
    return res.redirect("/")
  }
}
let results = await verify().catch(err => {res.redirect("/"); console.log("error1")});
if (results !== req.body.requested){
  req.session.destroy();
  console.log("Didn't match google")
  return;
}

//res.send("hello world")
console.log("goog: "+req.session.buser)

const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("userData").find( {"name": results}).count();
        console.log("testrueslts: "+testresult)
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
            email: req.body.email
          })
          res.send("success")
          req.session.buser = results;
          req.session.save()
        } else {
          return res.send("An account already exists with this account! Try signing in instead.")
        }

})
router.get("/openGoogleSignup", async (req, res) => {
  req.session.google = true;
  req.session.save()
})
router.get("/destroySession", async (req, res) => {
  delete req.session.buser
  delete req.session.muser
  req.session.save()
  res.redirect("/")
})
router.get("/welcome", async (req, res) => {
  if (!req.session.buser) return res.redirect("/signin-b");
  res.render("newuser")
})
router.get("/checkUser", async (req, res) => {
  if (!req.session.checkUser) req.session.checkUser = 0;
  req.session.checkUser = req.session.checkStuff+1;
  if (req.session.checkUser > 30) return res.send("Request timed out! Try to sign up again, but this time be a little bit faster.")
    await sleep(1000);
    await sleep(1000);
    if (!req.session.buser){
      return res.redirect("/checkUser")
    }
    if (req.session.buser === "none") return res.send("You already have an account! Try signing in instead!")

  const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("userData").find( {"name": req.session.buser}).count();
        if (testresult === 1){
          return res.redirect("/welcome")
        }else {
          return res.send("You already have an account! Try signing in instead.")
        }
})
router.get("/tos", async (req, res) => {
  res.render("tos")
})
router.get("/connect", async (req, res) => {
  if (!req.session.buser) return res.redirect("/signin-b");
  let user = await checkStuff(mongoclient, req.session.buser)
  console.log(user);
  console.log(req.session.buser)
  res.render("connect", {error: null, user: user})
})
router.post("/connect", async (req, res) => {
  console.log(req.body)
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
router.post("/withdraw", async (req, res) => {
  if (!req.session.buser) return res.send("bad boi")
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
            ammount: req.body.amount
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
router.post("/delete-b", async (req, res) => {
  if (!req.body.email) return res.send("No email present!")
  if (!req.session.buser) return res.send("You aren't signed in!");

  let user = await checkStuff(mongoclient, req.session.buser);
  if (!user) return res.send("An internal server error happened!");
  if (user.email !== req.body.email) return res.send("You entered your email incorrectly!");

  //send stupid email thingy
let expiry = Date.now()+600000;
        let randomid = await makeid(30);
        let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
          name: randomid,
          type: "delete-b",
          expiration: expiry,
          user: req.session.buser,
          options: {
            hello: "world"
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
   to: user.email, // list of receivers
   subject: 'Coin Tunnel Confirmation', // Subject line
   html:`<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to delete your account!!!&nbsp;<br />If this was you, great! Click the link below (When you delete an account, you loose all the money stored in cloud wallets). If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
 };
 transporter.sendMail(mailOptions, function (err, info) {
    if(err)
      console.log(err)
    else
      console.log(info);
    
  return res.send("good")
})
})
router.post("/regenerateID", async (req, res) => {
  if (!req.session.buser) return res.send("You aren't signed in!");
  let user = await checkStuff(mongoclient, req.session.buser)
  let expiry = Date.now()+600000;
        let randomid = await makeid(30);
        let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
          name: randomid,
          type: "regenerate-b",
          expiration: expiry,
          user: req.session.buser,
          options: {
            hello: "world"
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
   to: user.email, // list of receivers
   subject: 'Coin Tunnel Confirmation', // Subject line
   html:`<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your tunnelId! (This won't affect any balances) &nbsp;<br />If this was you, great! Click the link below (When you delete an account, you loose all the money stored in cloud wallets). If this wasn't you, your account may be compromised. Quickly withdraw all your money into a wallet, and delete your account. Because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
 };
 transporter.sendMail(mailOptions, function (err, info) {
    if(err)
      console.log(err)
    else
      console.log(info);
    
  return res.send("good")
})
})
//start of sign in stuff
router.get("/checkUsersignin", async (req, res) => {
  if (!req.session.checkUser) req.session.checkUser = 0;
  req.session.checkUser = req.session.checkStuff+1;
  if (req.session.checkUser > 30) return res.send("Request timed out! Try to sign up again, but this time be a little bit faster.")
    await sleep(1000);
    await sleep(1000);
    if (!req.session.buser){
      return res.redirect("/checkUser")
    }
    if (req.session.buser === "none") return res.send("You already have an account! Try signing in instead!")

  const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("userData").find( {"name": req.session.buser}).count();
        if (testresult === 1){
          return res.redirect("/welcome")
        }else {
          return res.send("You already have an account! Try signing in instead.")
        }
})
router.get("/signin-b", (req, res) => {
  if (req.session.buser) return res.redirect("/dashboard-b");
  res.render("signin-b")
})
router.post("/validateGoogleSignin", async (req, res) => {
async function verify() {
  try{
  const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idtoken,
      audience: secrets.googleClient,
  });

  const payload = ticket.getPayload();
  const userid = payload['sub'];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  return userid
  }catch{
    console.log("error")
    return res.redirect("/")
  }
}
let results = await verify().catch(err => {res.redirect("/"); console.log("error1")});
if (results !== req.body.requested){
  req.session.destroy();
  console.log("Didn't match google")
  return;
}
console.log(results)
console.log("goog: "+req.session.buser)

const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("userData").find( {"name": results}).count();
        console.log("testrueslts: "+testresult)
        if (testresult === 0){
          res.send("No account set up! Create an account here: https://www.coin-tunnel.ml/signup-b")
        } else {
          res.send("good")
          req.session.buser = results;
          req.session.save()
        }

})
router.get("/signin-buyer-discord", async (req, res) => {

    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=832674762076455002&redirect_uri=https%3A%2F%2Fwww.coin-tunnel.ml%2Fdiscord-buyer-callback-signin&response_type=code&scope=identify%20email`;

    res.redirect(authorizeUrl);
})
router.get('/discord-buyer-callback-signin', async (req, res) => {
    
    const accessCode = req.query.code;
    if (!accessCode){
      res.redirect("/signin-b")
    req.session.destroy();
    }
    const data = new FormData();
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', "https://www.coin-tunnel.ml/discord-buyer-callback-signin");
    data.append('scope', scopes.join(' '));
    data.append('code', accessCode);
    let x = await fetch('https://discordapp.com/api/oauth2/token', {
        method: 'POST',
        body: data
    })
    let response = await x.json()
    console.log(response)
    let y = await fetch('https://discordapp.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: `${response.token_type} ${response.access_token}`
            },
    })
    let userResponse = await y.json()
    console.log(userResponse)
    userResponse.tag = `${userResponse.username}#${userResponse.discriminator}`;
    req.session.buser = userResponse.id;
    console.log(req.session.buser);

    const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("userData").find( {"name": userResponse.id}).count();

        if (testresult === 0){
          res.send("No account yet! Try signing up instead!")
          console.log(userResponse)
        }
        else {
          res.redirect("/dashboard-b")
          req.session.buser = userResponse.id
        }
});
//start of email verifiactaion garbage
// need to do verification string (verifac string)
router.get("/validate/:id", async (req, res) => {
  let list = await mongoclient.db("cointunnel").collection("emails")
    .findOne({name: req.params.id});
  if (!list) return res.send("Invalid link!")
  if (Date.now() > list.expiration){
      res.send("Link has expired!");
      mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id } )
      return;
    }
  console.log(list)
  if (list.type === "change_wallet_type"){
    if (Date.now() > list.expiration){
      res.send("Link has expired!");
      mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id } )
      return;
    }
    await updateDocumentSet(mongoclient, list.user, {
          userPrivate: list.options.secret,
          userPublic: list.options.publicKey
        })
        mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id } )
        return res.send("Success!")
  }else if (list.type === "withdraw"){
    let user = await checkStuff(mongoclient, list.user);
    var privateWallet;
    var publicWallet;
    if (user.userPrivate === "none" && generatedPublic === "none"){
      return res.send("You don't have any connected wallets!")
    }else if (user.userPrivate === "none"){
      privateWallet = user.generatePrivate
      publicWallet = user.generatedPublic
    }else if (user.generatedPrivate === "none"){
      privateWallet = user.userPrivate;
      publicWallet = user.userPublic;
    }
    privateWallet = await decrypt(privateWallet);
    list.options.ammount = Number(list.options.ammount);
    let status = await sendBitcoin(list.options.withdrawto, list.options.ammount, privateWallet, publicWallet).catch(err=>{
      return res.send(err.toString())
    })
    mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id } )
    console.log(status)
    return res.send("Success!")
  }else if (list.type === "delete-b"){
       mongoclient.db("cointunnel").collection("userData").deleteOne({"name":list.user});
       mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id })
       delete req.session.buser
       delete req.session.muser
       req.session.destroy()
       return res.send("Success!")
  }else if (list.type === "regenerate-b"){
    let user = await checkStuff(mongoclient, list.user);
  if (!user) return res.send("An internal server error occured!");
  var newId;
  for (var x = 0; x<10; x++){
    if (x === 8) return res.send("An internal server error occured! Could not generate unique Id after 8 tries")
  newId = await makeid(25);
  let checkId = await mongoclient.db("cointunnel").collection("userData")
  .findOne({"tunnelId":newId});
  if (!checkId) break;
  else continue;
  }
  await updateDocumentSet(mongoclient, req.session.buser, {
    tunnelId:newId
  })
  mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id } )
  return res.send("Success!")
  }else if (list.type === "merchant-change-address"){
    let user = await mongoclient.db("cointunnel").collection("merchantData")
        .findOne({name: list.user});
    if (!user) return res.send("That user doesn't exist! You probably deleted that account");
    await mongoclient.db("cointunnel").collection("merchantData")
              .updateOne({ name: list.user}, {$set: {
                deposit: list.options.address
              }});
    mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id } )
    return res.send("Success!")
  }else if (list.type === "pay"){
    mongoclient.db("cointunnel").collection("emails").deleteOne( { name: req.params.id } )
    let txid = list.options.transactionId;
    let tx = await mongoclient.db("cointunnel").collection("open-transactions")
        .findOne({txid: txid});
    if (!tx) return res.send("An error has happened!");
    let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: tx.merchant});
    let verifac = await decrypt(merchant.verifac)
    let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({tunnelId: tx.buyerId})
    // transfer the stupid money
    var depositadr;
    var privateadr;
    mongoclient.db("cointunnel").collection("open-transactions").deleteOne({txid: tx.txid});

    if (buyer.userPublic === "none" && buyer.generatedPublic === "none"){ 
  //send dumb thing to callback saying that user is stupid
let todo = {
        status: "failed",
        reason: "User has no wallet set up!",
        timeStamp: Date.now()
      };

    let returnedResults = await fetch(tx.callback, {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json', 'verifac': verifac}
    }).catch(err => {
      return "error: "+err.toString()
    })
    if (returnedResults && returnedResults.toString().includes("error: ")){
      await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
        status: "failed",
        reason: "User has no wallet set up!",
        reason2: "Failed to contact callback server!",
        archived: true,
        directLogs: transfer,
        timeStamp: Date.now()
      });
    }else{
       await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
        status: "failed",
        reason: "User has no wallet set up!",
        archived: true,
        directLogs: transfer,
        timeStamp: Date.now()
      });
    }

  return res.send("No wallet set up!")
    }
    if (buyer.userPublic !== "none"){
      depositadr = buyer.userPublic;
      privateadr = await decrypt(buyer.userPrivate)
    }else if (buyer.generatedPublic !== "none"){
      depositadr = buyer.generatedPublic;
      privateadr = await dcrypt(buyer.generatedPrivate)
    }
   console.log(tx)
   tx.price_in_btc = tx.price_in_btc.toString().slice(0, 8)
   tx.price_in_btc = Number(tx.price_in_btc)
   console.log(tx.price_in_btc)
   let transfer = await sendBitcoin(merchant.deposit, tx.price_in_btc, privateadr, depositadr)
      .catch(err => {
        return "error: "+err;
      })
    if (transfer.toString().includes("error")){
     //delete the stupid thingy
      // uh oh that's not good send info to callback
      let todo = {
        status: "failed",
        reason: "Failed to transfer BTC from said user: ",
        directLogs: transfer,
        timeStamp: Date.now()
      };

    let returnedResults = await fetch(tx.callback, {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json' }
    }).catch(err => {
      return "error: "+err.toString()
    })
    if (returnedResults && returnedResults.toString().includes("error: ")){
      await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
        status: "failed",
        reason: "Failed to transfer BTC from said user",
        reason2: "Failed to contact callback server!",
        archived: true,
        directLogs: transfer,
        timeStamp: Date.now()
      });
    }else{
       await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
        status: "failed",
        reason: "Failed to transfer BTC from said user",
        archived: true,
        directLogs: transfer,
        timeStamp: Date.now()
      });
    }
      
      return res.send(transfer)
    } //done

    let todo = {
        status: "Success!",
        directLogs: transfer,
        txid:tx.txid,
        note: tx.note,
        buyerId: tx.buyerId,
        creation: tx.creation,
        expiry: tx.expiry,
        price_in_btc: tx.price_in_btc,
        price_in_usd: tx.price_in_usd,
        timeStamp: Date.now(),
        archived: true
      };

    fetch(tx.callback, {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json', "verifac":  verifac }
    }).catch(err => {
      return "error: "+err.toString()
    })
    
    await mongoclient.db("cointunnel").collection("finished-transactions").insertOne({
      status: "Success!",
      merchant: tx.merchant,
      directLogs: transfer,
      txid: tx.txid,
      note: tx.note,
      buyerId: tx.buyerId,
      creation: tx.creation,
      expiry: tx.expiry,
      price_in_btc: tx.price_in_btc,
      price_in_usd: tx.price_in_usd,
      archived: true,
      timeStamp: Date.now()
    })
    return res.send("Success!")
  }
})
////end of the freaking buyer stuff and time to start building the seller section (I still need to do the dumb create cloud wallet thing but that's a thing for future me to deal with lol)
router.get("/welcome-m", async (req, res) => {
  res.render("welcome-m")
})
router.post("/validateGoogleM", async (req, res) => {
await sleep(1000)
//if (!req.session.google) return;
async function verify() {
  try{
  const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idtoken,
      audience: secrets.googleClient,
  });

  const payload = ticket.getPayload();
  const userid = payload['sub'];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  return userid
  }catch{
    console.log("error")
    return res.redirect("/")
  }
}
let results = await verify().catch(err => {res.redirect("/"); console.log("error1")});
if (results !== req.body.requested){
  req.session.destroy();
  console.log("Didn't match google")
  return;
}

//res.send("hello world")

const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("merchantData").find( {"name": results}).count();
        console.log("testrueslts: "+testresult)
        if (testresult === 0){
          var generateId = "none"
          for (var y = 0; y<10; y++){
            if (y === 8) res.status(500).send("Could not create an id that isn't taken after 8 tries!")
            generateId = await makeid(25)
            let testid = await db.collection("merchantData").find( {"tunnelId": generateId}).count();
            if (testid === 0) break
          }
          await mongoclient.db("cointunnel").collection("merchantData").insertOne(
          {
            name: results,
            tunnelId: generateId,
            type:"google",
            deposit: "none",
            key: "none",
            email: req.body.email
          })
          res.send("success")
          req.session.muser = results;
          req.session.save()
        } else {
          return res.send("An account already exists with this account! Try signing in instead.")
        }

})
router.get("/signup-merchant-github-callback", async (req, res) =>{
   let todo = {
     "client_id":"884f2305aaed970e40ff",
     "client_secret":secrets.github_merchant,
     "code":req.query.code
   }
  let github = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: JSON.stringify(todo),
    headers: { 'Content-Type': 'application/json' }
})
github = await github.text()
let position = github.indexOf("=");
let and = github.indexOf("&");
github = github.slice(position+1, and);
console.log(github)
let user = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', "Authorization":"token "+github }
})
user = await user.json();
console.log(user);
req.session.muser = user.id;
let emails = await fetch("https://api.github.com/user/emails", {
  method: 'GET',
    headers: { 'Content-Type': 'application/json', "Authorization":"token "+github }
})
emails = await emails.json();
if (!emails[0]) return res.redirect("/dashboard-m")
else console.log(emails[0].email)
const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("merchantData").find( {"name": user.id}).count();

        if (testresult === 0){
          var generateId = "none"
          for (var y = 0; y<10; y++){
            if (y === 8) res.status(500).send("Could not create an id that isn't taken after 8 tries!")
            generateId = await makeid(25)
            let testid = await db.collection("merchantData").find( {"tunnelId": generateId}).count();
            if (testid === 0) break
          }
          await await mongoclient.db("cointunnel").collection("merchantData").insertOne(
          {
            name: user.id,
            tunnelId:generateId,
            type:"github",
            deposit: "none",
            key: "none",
            email: emails[0].email
          })
          req.session.muser = user.id
          return res.redirect("/checkUserM")
        }
        else {
          res.redirect("/dashboard-m")
        }
})
router.get("/checkUserM", async (req, res) => {
  if (!req.session.checkUser) req.session.checkUser = 0;
  req.session.checkUser = req.session.checkStuff+1;
  if (req.session.checkUser > 30) return res.send("Request timed out! Try to sign up again, but this time be a little bit faster.")
    await sleep(1000);
    await sleep(1000);
    if (!req.session.muser){
      return res.redirect("/checkUserM")
    }
    if (req.session.muser === "none") return res.send("You already have an account! Try signing in instead!")

  const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("merchantData").find( {"name": req.session.muser}).count();
        if (testresult === 1){
          return res.redirect("/welcome-m")
        }else {
          return res.send("You already have an account! Try signing in instead.")
        }
})
router.get("/signup-seller-discord", async (req, res) => {

    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=832674762076455002&redirect_uri=https%3A%2F%2Fwww.coin-tunnel.ml%2Fdiscord-seller-callback&response_type=code&scope=identify%20email`;
    res.redirect(authorizeUrl);
})
router.get('/discord-seller-callback', async (req, res) => {
    
    const accessCode = req.query.code;
    if (!accessCode){
      res.redirect("/signup-m");
    req.session.destroy();
    }
    const data = new FormData();
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', "https://www.coin-tunnel.ml/discord-seller-callback");
    data.append('scope', scopes.join(' '));
    data.append('code', accessCode);
    let x = await fetch('https://discordapp.com/api/oauth2/token', {
        method: 'POST',
        body: data
    })
    let response = await x.json()
    let y = await fetch('https://discordapp.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: `${response.token_type} ${response.access_token}`
            },
    })
    let userResponse = await y.json()
    console.log(userResponse)
            userResponse.tag = `${userResponse.username}#${userResponse.discriminator}`;
            req.session.muser = userResponse.id;
            console.log(req.session.muser);

    const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("merchantData").find( {"name": req.session.muser}).count();

        if (testresult === 0){
          var generateId = "none"
          for (var t = 0; t<10; t++){
            if (t === 8) res.status(500).send("Could not create an id that isn't taken after 8 tries!")
            generateId = await makeid(25)
            let testid = await db.collection("merchantData").find( {"tunnelId": generateId}).count();
            if (testid === 0) break
          }
          console.log(userResponse)
          await mongoclient.db("cointunnel").collection("merchantData").insertOne(
          {
            name: req.session.muser,
            tunnelId: generateId,
            type:"discord",
            deposit: "none",
            key: "none",
            email: userResponse.email,
            discord: {
              tag: userResponse.tag
            }
          })
          res.redirect("/checkUserM")
        }
        else {
          console.log("a;lskdfja;lskdfj;alskdjf;alksdfj already has an account1")
          res.send("You already have an account! Sign in instead")
        }
});
router.post("/validateGoogleseller", async (req, res) => {
async function verify() {
  try{
  const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idtoken,
      audience: secrets.googleClient,
  });

  const payload = ticket.getPayload();
  const userid = payload['sub'];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  return userid
  }catch{
    console.log("error")
    return res.redirect("/")
  }
}
let results = await verify().catch(err => {res.redirect("/"); console.log("error1")});
if (results !== req.body.requested){
  req.session.destroy();
  console.log("Didn't match google")
  return;
}
console.log(results)
console.log("goog: "+req.session.muser)

const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("merchantData").find( {"name": results}).count();
        console.log("testrueslts: "+testresult)
        if (testresult === 0){
          res.send("No account set up! Create an account here: https://www.coin-tunnel.ml/signup-m")
        } else {
          res.send("good")
          req.session.muser = results;
          req.session.save()
        }

})
router.get("/signin-m", (req, res) => {
  if (req.session.muser) return res.redirect("/dashboard-m")
  res.render("signin-m")
})
router.get("/signin-seller-discord", async (req, res) => {

    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=832674762076455002&redirect_uri=https%3A%2F%2Fwww.coin-tunnel.ml%2Fdiscord-seller-callback-signin&response_type=code&scope=identify%20email`;
    res.redirect(authorizeUrl);
})
router.get('/discord-seller-callback-signin', async (req, res) => {
    
    const accessCode = req.query.code;
    if (!accessCode){
      res.redirect("/signin-m")
    req.session.destroy();
    }
    const data = new FormData();
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', "https://www.coin-tunnel.ml/discord-seller-callback-signin");
    data.append('scope', scopes.join(' '));
    data.append('code', accessCode);
    let x = await fetch('https://discordapp.com/api/oauth2/token', {
        method: 'POST',
        body: data
    })
    let response = await x.json()
    let y = await fetch('https://discordapp.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: `${response.token_type} ${response.access_token}`
            },
    })
    let userResponse = await y.json()
    console.log(userResponse)
            userResponse.tag = `${userResponse.username}#${userResponse.discriminator}`;
            req.session.muser = userResponse.id;
            console.log(req.session.muser);

    const db = mongoclient.db("cointunnel");
        let testresult = await db.collection("merchantData").find( {"name": req.session.muser}).count();

        if (testresult === 0){
          delete req.session.muser
          res.send("You don't have an account yet! Sign in instead")
        }
        else {
          res.redirect("/dashboard-m")
        }
});
router.get("/dashboard-m", async (req, res) => {
  var keys = {};
  var wallets = "No wallet connected"
  if (!req.session.muser) return res.redirect("/signin-m");
  let user = await mongoclient.db("cointunnel").collection("merchantData")
    .findOne({name: req.session.muser});
  if (!user) return res.send("Internal server error!");
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

  let transactions = {};
  transactions.open = openTransac;
  transactions.closed = closedTransac;
  transactions.all = openTransac+closedTransac;

  res.render("dashboard-m", {db: user, key: keys, wallet: wallets, transac: transactions})
})
router.post("/regenerate", async (req, res) => {
  if (!req.session.muser) return res.send("You have to be logged in as a merchant in order for this to work!");
  let newKey = await makeid(40);
  let newPrefix = await makeid(10);
  let previousKey = await mongoclient.db("cointunnel").collection("keys")
  .findOne({userId: req.session.muser});
  
  const hmac = createHmac('sha512', newKey);
  hmac.update(JSON.stringify(newPrefix));
  const signature = hmac.digest('hex');

  if (!previousKey){
    // create new without replacing
    await mongoclient.db("cointunnel").collection("keys")
        .insertOne({
          prefix: newPrefix,
          hash: signature,
          userId: req.session.muser,
          uses: 0,
          ip: []
        });
  }else{
    await mongoclient.db("cointunnel").collection("keys")
        .updateOne({ userId: req.session.muser }, {$set: {
            prefix: newPrefix,
            hash: signature,
            userId: req.session.muser,
            uses: 0,
            ip: []
        }});
  }
  await mongoclient.db("cointunnel").collection("merchantData")
    .updateOne({ name: req.session.muser}, {$set: {
      key: "true"
    }});
    
  let full = newPrefix+newKey;
  console.log(full)
  res.send({
    key: full
  })
})
router.get("/changeAddress", async (req, res) => {
  res.render("merchantdep")
})
router.post("/changeMerchantAddress", async (req, res) => {
  if (!req.session.muser) return res.send("You have to be signed in to your merchant account!")
  //validate stupid bitcoin address (done)
  var utxos = await axios.get(
      `https://sochain.com/api/v2/get_address_balance/${sochain_network}/${req.body.bitcoin}`
    ).catch(err => {
      res.send("That wasn't a valid bitcoin address");
      return "failed";
    })
  if (utxos === "failed") return;
  if (utxos.status === "fail"){
    return res.send("That wasn't a valid bitcoin address")
  }
  //send stupid email and update mongodb listing (Done)
  let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({name: req.session.muser})
  let expiry = Date.now()+600000;
        let randomid = await makeid(30);
        let result = await mongoclient.db("cointunnel").collection("emails").insertOne({
          name: randomid,
          type: "merchant-change-address",
          expiration: expiry,
          user: req.session.muser,
          options: {
            address: req.body.bitcoin
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
   html:`<h1 style="text-align: center;">Hello ${user.email}!</h1><p style="text-align: center;">There was a recent attempt to change your deposit address to the address: ${req.body.bitcoin} (This won't affect any balances) &nbsp;<br />If this was you, great! Click the link below. If this wasn't you, your account may be compromised, because we only support oauth2, this might mean that they have access to other apps connected to your Oauth2 account too!&nbsp;</p><p style="text-align: center;"><span style="color: #ff6600;">(Coin-tunnel doesn't store any passwords, we leave it to google, github, or discord)</span></p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
 };
 transporter.sendMail(mailOptions, function (err, info) {
    if(err)
      console.log(err)
    else
      console.log(info);
    
  return res.send("good")
})
})
router.post("/changeKey", async (req, res) => {
  if (!req.session.muser) return res.send("You must be signed in as a merchant!")
  if (!req.body.key) return res.send("Key must be greater than 10 characters in length");
  if (req.body.key.length < 10) return res.send("Key must be greater than 10 characters in length");
  let encrypted = await encrypt(req.body.key);
  await mongoclient.db("cointunnel").collection("merchantData").updateOne({name: req.session.muser}, {$set: {
    verifac: encrypted
  }})
  return res.send({
    key: req.body.key
  })
})
//DONE WITH STUPID STUFF TIME FOR THE ACTUAL Transaction
router.post("/api/v1/create", async (req, res) => {
  //hash the stupid header authorization
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
  if (!req.body.usd) return res.status(400).send({status: "failed", reason: "no USD ammount found in body!", timeStamp: Date.now()})

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
let fee = await fetch("https://bitcoinfees.earn.com/api/v1/fees/recommended");
fee = await fee.json();
fee = fee.halfHourFee*250*0.00000001
if (amountOfBtc < fee+0.0001) return res.status(400).send({
  "status":"failed",
  "reason":"Amount too low! The bitcoin network currently has a fee of "+fee+" BTC!",
  "timeStamp": Date.now()
})
amountOfBtc = amountOfBtc+ 0.0001+fee

//start of buyer wallet verifiactaion
var buyerPublic;
if (buyer.userPublic !== "none") buyerPublic = buyer.userPublic;
else if (buyer.generatedPublic !== "none") buyerPublic = buyer.generatedPublic;
else return res.status(400).send({
  status: "failed",
  reason: "target user does not have sufficient funds!",
  timeStamp: Date.now()
})

console.log(buyerPublic)

let buyerWallet = await fetch(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${buyerPublic}`);
buyerWallet = await buyerWallet.json()
console.log(buyerWallet)
console.log(buyerWallet.data.confirmed_balance);
console.log(amountOfBtc)
if (buyerWallet.data.confirmed_balance < amountOfBtc) return res.status(400).send({
  status: "failed",
  reason: "target user does not have sufficient funds",
  timeStamp: Date.now()
})
if (test === true){
  // make stupid testing function
}

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
   html:`<h1 style="text-align: center;">Hello ${buyer.email}!</h1><p style="text-align: center;"> This is a confirmation to pay: ${amountOfBtc} (The equivalent of ${usd} usd) &nbsp;<br />If this was you, great! Click the link below to pay! If this wasn't you, no need to panic. All this means, is that someone has your PUBLIC Coin-Tunnel address. (That's why we have these confirmation emails) If you keep getting this email, feel free to regenerate your public key in your dashboard</p><p style="text-align: center;"><a href="https://www.coin-tunnel.ml/validate/${randomid}">https://www.coin-tunnel.ml/validate/${randomid}</a></p>`
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
    "total": amountOfBtc,
    "fee": fee
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

    ///404 error handling stuff
router.use(function(req, res, next){
  res.status(404);
  res.render('404_error');
});
router.use(function(req, res) {
    res.render('404_error');
});
//module.exports = router;

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
async function updateUser(mongoclient, name, updatedlisting){
              let result = await mongoclient.db("cointunnel").collection("userData")
              .updateOne({ name: name}, {$set: updatedlisting});
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
