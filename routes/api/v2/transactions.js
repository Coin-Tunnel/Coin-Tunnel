
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
var CoinKey = require('coinkey')    //1.0.0
var coinInfo = require('coininfo')  //0.1.0
var subscribed = {};
const RippleAPI = require('ripple-lib').RippleAPI;
const api = new RippleAPI({
  server: 'wss://s1.ripple.com'
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const request = require('request')
const litecore = require('litecore-lib')

sleep(1000).then(thing => {
  router.get("/", longLimiter, (req, res) => {
    return res.render("error", { error: "invalid code!" });
  })
  router.get("/sse/:apikey", async (req, res) => {
    // validate api key 
    let prefix = req.params.apikey.slice(0, 10);
    let key = req.params.apikey.slice(10);

    const hmac = createHmac('sha512', key);
    hmac.update(JSON.stringify(prefix));
    const signature = hmac.digest('hex');

    let dbKey = await mongoclient.db("cointunnel").collection("keys").findOne({ hash: signature })
    if (!dbKey) return res.status(401).send({
      status: "failed",
      reason: "Incorrect API key",
      timeStamp: Date.now()
    })
    await mongoclient.db("cointunnel").collection("keys")
      .updateOne({ hash: signature }, { $inc: { "uses": 1 } })
    let currentIp = req.connection.remoteAddress;
    if (!dbKey.ip.includes(currentIp)) {
      await mongoclient.db("cointunnel").collection("keys")
        .updateOne({ hash: signature }, { $push: { ip: currentIp } })
    }
    let user = await mongoclient.db("cointunnel").collection("merchantData").findOne({ name: dbKey.userId });
    if (!user) return res.status(401).send({
      status: "failed",
      reason: "Merchant account is gone",
      timeStamp: Date.now()
    })
    subscribed[signature] = res;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    // compose the message
    let data1 = {
      key: req.params.apikey
    }
    data1 = JSON.stringify(data1)
    res.write(`data: ${data1}\n\n`);
    let data = {
      status: "ok",
      reason: "you are now subscribed! You will get alerted when a user pays and closes a transaction."
    }
    data = JSON.stringify(data)
    res.write("data: " + data + '\n\n');

  })
  router.get("/validate/:id", longLimiter, async (req, res) => {
    let list = await mongoclient.db("cointunnel").collection("emails")
      .findOne({ name: req.params.id });
    if (!list) return res.send("Invalid link!")
    if (Date.now() > list.expiration) {
      res.render("error", { error: "Link has expired" })
      mongoclient.db("cointunnel").collection("emails").deleteMany({ expiration: { $lt: Date.now() } })
      return;
    }
    //console.log(list)
    if (list.type === "change_wallet_type") {
      if (Date.now() > list.expiration) {
        res.render("error", { error: "Link has expired!" })
        mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
        return;
      }
      await updateDocumentSet(mongoclient, list.user, {
        userPrivate: list.options.secret,
        userPublic: list.options.publicKey
      })
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      return res.send("Success!")
    } else if (list.type === "withdraw") {
      let user = await checkStuff(mongoclient, list.user);
      var privateWallet;
      var publicWallet;
      if (user.userPrivate === "none" && generatedPublic === "none") {
        return res.render("error", { error: "You don't have any connected wallets" })
      } else if (user.userPrivate === "none") {
        privateWallet = user.generatePrivate
        publicWallet = user.generatedPublic
      } else if (user.generatedPrivate === "none") {
        privateWallet = user.userPrivate;
        publicWallet = user.userPublic;
      }
      privateWallet = await decrypt(privateWallet);
      list.options.amount = Number(list.options.amount);
      let status = await sendBitcoin(list.options.withdrawto, list.options.amount, privateWallet, publicWallet).catch(err => {
        return res.render("error", { error: err.toString() })
      })
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      console.log(status)
      return res.send("Success!")
    } else if (list.type === "delete-b") {
      mongoclient.db("cointunnel").collection("userData").deleteOne({ "name": list.user });
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      delete req.session.buser
      delete req.session.muser
      req.session = null;
      return res.send("Success!")
    } else if (list.type === "regenerate-b") {
      let user = await checkStuff(mongoclient, list.user);
      if (!user) return res.render("error", { error: "An internal server error occured!" })
      var newId;
      for (var x = 0; x < 10; x++) {
        if (x === 8) return res.render("error", { error: "An internal server error occured! Could not generate unique Id after 8 tries" })
        newId = await makeid(25);
        let checkId = await mongoclient.db("cointunnel").collection("userData")
          .findOne({ "tunnelId": newId });
        if (!checkId) break;
        else continue;
      }
      await updateDocumentSet(mongoclient, list.user, {
        tunnelId: newId
      })
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      return res.send("Success!")
    } else if (list.type === "merchant-change-address") {
      let user = await mongoclient.db("cointunnel").collection("merchantData")
        .findOne({ name: list.user });
      if (!user) return res.render("error", { error: "That user doesn't exist! You probably deleted that account!" })
      await mongoclient.db("cointunnel").collection("merchantData")
        .updateOne({ name: list.user }, {
          $set: {
            deposit: list.options.address
          }
        });
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      return res.send("Success!")
    } else if (list.type === "pay") {
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      let txid = list.options.transactionId;
      let tx = await mongoclient.db("cointunnel").collection("open-transactions")
        .findOne({ txid: txid });
      if (!tx) return res.render("error", { error: "An error occured" })
      let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({ name: tx.merchant });
      var verifac;
      if (!merchant.verifac) verifac = "No verification string set up! This is very dangerous as this allows people to 'steal' your products and pretend to be Coin-Tunnel"
      else veriac = await decyrpt(merchant.verifac);
      let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({ tunnelId: tx.buyerId })

      var newId;
      for (var x = 0; x < 10; x++) {
        if (x === 8) return res.render("error", { error: "An internal server error occured! Could not generate unique Id after 8 tries" })
        newId = await makeid(25);
        let checkId = await mongoclient.db("cointunnel").collection("userData")
          .findOne({ "tunnelId": newId });
        if (!checkId) break;
        else continue;
      }
      await updateDocumentSet(mongoclient, buyer.name, {
        tunnelId: newId
      })

      // transfer the stupid money
      var depositadr;
      var privateadr;
      mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: tx.txid });
      if (!buyer) {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          timeStamp: Date.now()
        };

        let returnedResults = await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (returnedResults && returnedResults.toString().includes("error: ")) {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            reason2: "Failed to contact callback server!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        } else {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        }

        return res.render("error", { error: "No wallet set up!" })
      }
      if (buyer.userPublic === "none" && buyer.generatedPublic === "none") {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          timeStamp: Date.now()
        };

        let returnedResults = await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (returnedResults && returnedResults.toString().includes("error: ")) {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            reason2: "Failed to contact callback server!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        } else {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        }

        return res.render("error", { error: "No wallet set up!" })
      }
      if (buyer.userPublic !== "none") {
        depositadr = buyer.userPublic;
        privateadr = await decrypt(buyer.userPrivate)
      } else if (buyer.generatedPublic !== "none") {
        depositadr = buyer.generatedPublic;
        privateadr = await decrypt(buyer.generatedPrivate)
      }
      console.log(tx)
      tx.price_in_btc = tx.price_in_btc.toString().slice(0, 8)
      tx.price_in_btc = Number(tx.price_in_btc)
      console.log(tx.price_in_btc);
      let transfer = await sendBitcoin(merchant.deposit, tx.price_in_btc, privateadr, depositadr)
        .catch(err => {
          return "error: " + err;
        })
      if (transfer.toString().includes("error")) {
        //delete the stupid thingy
        // uh oh that's not good send info to callback
        let todo = {
          status: "failed",
          reason: "Failed to transfer BTC from said user: ",
          txid: txid,
          directLogs: transfer,
          timeStamp: Date.now()
        };

        let returnedResults = await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (returnedResults && returnedResults.toString().includes("error: ")) {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "Failed to transfer BTC from said user",
            reason2: "Failed to contact callback server!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        } else {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "Failed to transfer BTC from said user",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        }

        return res.render("error", { error: transfer })
      } //done
      //
      let todo = {
        status: "paid",
        directLogs: transfer,
        txid: tx.txid,
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
        headers: { 'Content-Type': 'application/json', "verifac": verifac }
      }).catch(err => {
        return "error: " + err.toString()
      })

      await mongoclient.db("cointunnel").collection("finished-transactions").insertOne({
        status: "paid",
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
      return res.send("Success! You have succesfully paid! The seller has been alerted of your payment, and you should recieve your product shortly.")
    } else if (list.type === "change_to_cloud_wallet") {
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      let user = await checkStuff(mongoclient, list.user);
      if (!user) return res.render("error", { error: "that user doesn't exist anymore!" });
      if (user.generatedPublic !== "none") return res.render("error", { error: "You already have a cloud wallet!" })
      await updateDocumentSet(mongoclient, list.user, {
        userPublic: "none",
        userPrivate: "none",
        generatedPublic: list.options.publicKey,
        generatedPrivate: list.options.secret
      })
      return res.send("Success!")
    } else if (list.type === "ltc-change") {
      var liteInfo = coinInfo('LTC').versions;
      var ck = new CoinKey.createRandom(liteInfo);

      //console.log("Private Key (Wallet Import Format): " + ck.privateWif)
      console.log("Address: " + ck.publicAddress)
      // encrypt private
      let secret = await encrypt(ck.privateWif);
      let address = ck.publicAddress;
      await mongoclient.db('cointunnel').collection("emails").deleteOne({ name: req.params.id });
      await mongoclient.db('cointunnel').collection("userData").updateOne({ name: list.user }, {
        $set: {
          "ltc.address": address,
          "ltc.privatex": secret
        }
      })
      // update mongo
      return res.send("success!")
    } else if (list.type === "withdraw-ltc") {
      //await mongoclient.db("cointunnel").collection("emails").deleteOne({name: req.params.id})
      let user = await checkStuff(mongoclient, list.user);
      if (!user) return res.render("error", { error: "The target user is not valid!" });
      if (!user.ltc) return res.render("error", { error: "You have no LTC wallet set up!" });
      if (user.ltc.address === "none") res.render("error", { error: "You have no LTC wallet set up!" });
      let secretkeys = await decrypt(user.ltc.privatex);
      console.log(secretkeys)
      let publicadr = user.ltc.address;
      console.log("secretKeys" + secretkeys)
      let result = await sendLtc(list.options.withdrawto, list.options.amount, secretkeys, publicadr).then(result => {
        console.log("result: ")
        console.log(result)
        return result;
        //return res.send(result); 
      }).catch(err => {
        console.log("err: ")
        console.log(err)
        return "Error: Funds too low to cover the transaction fees!"
      })
      if (result.toString().includes("Error:")) return res.send(result)
      return res.send("Success! Full logs: " + JSON.stringify(result))
    } else if (list.type === "pay-ltc") {
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      let txid = list.options.transactionId;
      let tx = await mongoclient.db("cointunnel").collection("open-transactions")
        .findOne({ txid: txid });
      if (!tx) return res.render("error", { error: "An error occured" })
      let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({ name: tx.merchant });
      var verifac = "No verification string set up! This is very dangerous as this allows people to 'steal' your products and pretend to be Coin-Tunnel";
      if (merchant.verifac) veriac = await decrypt(merchant.verifac);
      let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({ tunnelId: tx.buyerId })

      var newId;
      for (var x = 0; x < 10; x++) {
        if (x === 8) return res.render("error", { error: "An internal server error occured! Could not generate unique Id after 8 tries" })
        newId = await makeid(25);
        let checkId = await mongoclient.db("cointunnel").collection("userData")
          .findOne({ "tunnelId": newId });
        if (!checkId) break;
        else continue;
      }
      await updateDocumentSet(mongoclient, buyer.name, {
        tunnelId: newId
      })

      // transfer the stupid money
      var depositadr;
      var privateadr;
      mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: tx.txid });
      if (!buyer) {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          timeStamp: Date.now()
        };
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        let returnedResults = await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (returnedResults && returnedResults.toString().includes("error: ")) {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            reason2: "Failed to contact callback server!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        } else {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        }

        return res.render("error", { error: "No wallet set up!" })
      }
      if (buyer.ltc.address === "none") {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          txid: txid,
          coin: "ltc",
          version: "v2",
          timeStamp: Date.now()
        };
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        let returnedResults = await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (returnedResults && returnedResults.toString().includes("error: ")) {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            reason2: "Failed to contact callback server!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        } else {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        }

        return res.render("error", { error: "No wallet set up!" })
      } else {
        depositadr = buyer.ltc.address;
        privateadr = await decrypt(buyer.ltc.privatex)
      }
      console.log(tx)
      tx.price_in_crypto = tx.price_in_crypto.toString().slice(0, 8)
      tx.price_in_crypto = Number(tx.price_in_crypto)
      console.log(tx.price_in_crypto);
      // send the stupid ltc
      let transfer = await sendLtc(merchant.ltc_deposit, tx.price_in_crypto, privateadr, depositadr).catch(err => {
        console.log("err: ")
        console.log(err)
        return "error: " + err.toString();
      });
      await sleep(5000)
      console.log(transfer)
      if (transfer.toString().includes("error")) {
        let todo = {
          status: "failed",
          reason: "Buyer did not have enough funds, probably withdrew after transaction was created, full logs start here: " + transfer.toString(),
          txid: tx.txid,
          note: tx.note,
          buyerId: tx.buyerId,
          creation: tx.creation,
          expiry: tx.expiry,
          price_in_crypto: tx.price_in_crypto,
          price_in_usd: tx.price_in_usd,
          coin: "ltc",
          version: "v2",
          crypto_network_txid: null,
          timeStamp: Date.now(),
          archived: false
        };
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', "verifac": verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        return res.render("error", { error: "You probably do not have enough funds to cover this transaction! Nothing has been changed. Full logs: " + JSON.stringify(transfer) })
      }
      let todo = {
        status: "paid",
        //directLogs: transfer,
        txid: tx.txid,
        note: tx.note,
        buyerId: tx.buyerId,
        creation: tx.creation,
        expiry: tx.expiry,
        price_in_crypto: tx.price_in_crypto,
        price_in_usd: tx.price_in_usd,
        coin: "ltc",
        version: "v2",
        crypto_network_txid: transfer.data.txid,
        timeStamp: Date.now(),
        archived: true
      };

      fetch(tx.callback, {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json', "verifac": verifac }
      }).catch(err => {
        return "error: " + err.toString()
      })
      // nice sse time
      let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
      if (apikey) {
        let sseRes = subscribed[apikey.hash];
        if (sseRes) {
          console.log(sseRes)
          let data = todo;
          data = JSON.stringify(data);
          sseRes.write("data: " + data + '\n\n');
        }
      }
      // end of sse garbage
      await mongoclient.db("cointunnel").collection("finished-transactions").insertOne({
        status: "paid",
        merchant: tx.merchant,
        //directLogs: transfer,
        txid: tx.txid,
        note: tx.note,
        buyerId: tx.buyerId,
        creation: tx.creation,
        expiry: tx.expiry,
        price_in_crypto: tx.price_in_crypto,
        price_in_usd: tx.price_in_usd,
        crypto_network_txid: transfer.data.txid,
        coin: "ltc",
        archived: true,
        timeStamp: Date.now()
      })
      return res.send("Success! You have succesfully paid! The seller has been alerted of your payment, and you should recieve your product shortly.")
    } else if (list.type === "merchant-change-litecoin") {
      await mongoclient.db("cointunnel").collection("merchantData").updateOne({ name: list.user }, {
        $set: {
          ltc_deposit: list.options.address
        }
      });
      await mongoclient.db("cointunnel").collection("email").deleteOne({ name: req.params.id });
      return res.send("Success!");
    } else if (list.type === "eth-change") {
      const { ethers } = require("ethers");
      const randomMnemonic = ethers.Wallet.createRandom().mnemonic;
      const wallet = ethers.Wallet.fromMnemonic(randomMnemonic.phrase);
      let signingkey = wallet._signingKey();
      let encryptedkey = await encrypt(signingkey.privateKey);
      await mongoclient.db("cointunnel").collection("userData").updateOne({ name: list.user }, {
        $set: {
          "eth.address": wallet.address,
          "eth.privatex": encryptedkey
        }
      });
      return res.send("Success!")
    } else if (list.type === "withdraw-eth") {
      let user = await mongoclient.db("cointunnel").collection("userData").findOne({ name: list.user });
      if (!user.eth) return res.send("You don't have an ETH wallet setup!");
      if (user.eth.address === "none") return res.send("You don't have an ETH wallet setup!");
      let secret = await decrypt(user.eth.privatex);
      let results = await sendEth(list.options.withdrawto, secret, user.eth.address, list.options.amount);
      if (results.error) {
        if (results.error.code === -32000) return res.send("ERROR! " + results.error.message);
        else return res.send("Error: " + results.error.message)
      } else {
        return res.send("Success! ETH TXID: " + results.result)
      }
    } else if (list.type === "merchant-change-ethereum") {
      await mongoclient.db("cointunnel").collection("merchantData").updateOne({ name: list.user }, {
        $set: {
          eth_deposit: list.options.address
        }
      })
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id });
      return res.send("Success!");
    } else if (list.type === "pay-eth") {
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      let txid = list.options.transactionId;
      let tx = await mongoclient.db("cointunnel").collection("open-transactions")
        .findOne({ txid: txid });
      if (!tx) return res.render("error", { error: "An error occured" })
      let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({ name: tx.merchant });
      var verifac = "No verification string set up! This is very dangerous as this allows people to 'steal' your products and pretend to be Coin-Tunnel";
      if (merchant.verifac) veriac = await decrypt(merchant.verifac);
      let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({ tunnelId: tx.buyerId })

      var newId;
      for (var x = 0; x < 10; x++) {
        if (x === 8) return res.render("error", { error: "An internal server error occured! Could not generate unique Id after 8 tries (No transactions have been made)" })
        newId = await makeid(25);
        let checkId = await mongoclient.db("cointunnel").collection("userData")
          .findOne({ "tunnelId": newId });
        if (!checkId) break;
        else continue;
      }
      await updateDocumentSet(mongoclient, buyer.name, {
        tunnelId: newId
      })

      // transfer the stupid money
      var depositadr;
      var privateadr;
      mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: tx.txid });
      if (!buyer) {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          timeStamp: Date.now()
        };

        await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
          status: "failed",
          merchant: tx.merchant,
          reason: "User has no wallet set up!",
          txid: txid,
          archived: true,
          directLogs: transfer,
          timeStamp: Date.now()
        });

        return res.render("error", { error: "No wallet set up!" })
      }
      if (buyer.eth.address === "none") {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          txid: txid,
          coin: "eth",
          version: "v2",
          timeStamp: Date.now()
        };
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
          status: "failed",
          merchant: tx.merchant,
          reason: "User has no wallet set up!",
          txid: txid,
          archived: true,
          directLogs: transfer,
          timeStamp: Date.now()
        });

        return res.render("error", { error: "No wallet set up!" })
      } else {
        depositadr = buyer.eth.address;
        privateadr = await decrypt(buyer.eth.privatex)
      }
      console.log(tx)
      tx.price_in_crypto = tx.price_in_crypto.toString().slice(0, 8)
      tx.price_in_crypto = Number(tx.price_in_crypto)
      console.log(tx.price_in_crypto);
      // send the stupid ltc
      let transfer = await sendEth(merchant.eth_deposit, privateadr, depositadr, tx.price_in_crypto).catch(err => {
        console.log("err: ")
        console.log(err)
        return "error: " + err.toString();
      });
      await sleep(5000)
      console.log(transfer)
      if (JSON.stringify(transfer).includes("error")) {
        let todo = {
          status: "failed",
          reason: "Buyer did not have enough funds, probably withdrew after transaction was created, full logs start here: " + transfer.toString(),
          txid: tx.txid,
          note: tx.note,
          buyerId: tx.buyerId,
          creation: tx.creation,
          expiry: tx.expiry,
          price_in_crypto: tx.price_in_crypto,
          price_in_usd: tx.price_in_usd,
          coin: "eth",
          version: "v2",
          crypto_network_txid: null,
          timeStamp: Date.now(),
          archived: false
        };

        fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', "verifac": verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        if (JSON.stringify(transfer).toLowerCase().includes("underpriced")) return res.render("error", { error: "Your address still has a transaction in progress! Please wait until that is done before submitting another transaction. Full logs: " + JSON.stringify(transfer) })
        return res.render("error", { error: "You probably do not have enough funds to cover this transaction! Nothing has been changed. Full logs: " + JSON.stringify(transfer) })
      }
      let todo = {
        status: "paid",
        //directLogs: transfer,
        txid: tx.txid,
        note: tx.note,
        buyerId: tx.buyerId,
        creation: tx.creation,
        expiry: tx.expiry,
        price_in_crypto: tx.price_in_crypto,
        price_in_usd: tx.price_in_usd,
        coin: "eth",
        version: "v2",
        crypto_network_txid: transfer.result,
        timeStamp: Date.now(),
        archived: true
      };

      fetch(tx.callback, {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json', "verifac": verifac }
      }).catch(err => {
        return "error: " + err.toString()
      })
      // nice sse time
      let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
      if (apikey) {
        let sseRes = subscribed[apikey.hash];
        if (sseRes) {
          console.log(sseRes)
          let data = todo;
          data = JSON.stringify(data);
          sseRes.write("data: " + data + '\n\n');
        }
      }
      // end of sse garbage
      await mongoclient.db("cointunnel").collection("finished-transactions").insertOne({
        status: "paid",
        merchant: tx.merchant,
        //directLogs: transfer,
        txid: tx.txid,
        note: tx.note,
        buyerId: tx.buyerId,
        creation: tx.creation,
        expiry: tx.expiry,
        price_in_crypto: tx.price_in_crypto,
        price_in_usd: tx.price_in_usd,
        crypto_network_txid: transfer.result,
        coin: "eth",
        archived: true,
        timeStamp: Date.now()
      })
      return res.send("Success! You have succesfully paid! The seller has been alerted of your payment, and you should recieve your product shortly. The ETH TXID is " + transfer.result)
    } else if (list.type === "xrp-change") {
      const address = api.generateAddress();
      let encrypted = await encrypt(address.secret);
      let xrpaddress = address.address;
      await mongoclient.db('cointunnel').collection("emails").deleteOne({ name: req.params.id });
      await mongoclient.db('cointunnel').collection("userData").updateOne({ name: list.user }, {
        $set: {
          "xrp.address": xrpaddress,
          "xrp.privatex": encrypted
        }
      })
      // update mongo
      return res.send("success!")
      // generate new xrp wallet and encrypt it and add it to mongodb
    } else if (list.type === "withdraw-xrp") {
      let user = await mongoclient.db("cointunnel").collection("userData").findOne({ name: list.user });
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: list.name })
      if (!user.xrp || user.xrp.address === "none") return res.send("You don't seem to have an XRP wallet setup!");
      var tag;
      if (!list.options.tag) tag = "none";
      else tag = list.options.tag;

      let secret = await decrypt(user.xrp.privatex);
      console.log(list.options.withdrawto, user.xrp.address, secret, list.options.amount, tag, false)
      let result = await sendXRP(list.options.withdrawto, user.xrp.address, secret, list.options.amount, tag, false).catch(err => { console.log(err); return "Error: " + err.toString() });
      if (result.resultCode === "tecUNFUNDED_PAYMENT") return res.send("Error: The blockchain rejected your transaction! Try lowering the amount of XRP!");
      if (result.resultCode === "tecDST_TAG_NEEDED") return res.send("The destination wallet has indicated that you must input a destination tag!")
      return res.send("Success! TX HASH: " + JSON.stringify(result.tx_json.hash));
    } else if (list.type === "merchant-change-ripple") {
      await mongoclient.db("cointunnel").collection("merchantData").updateOne({ name: list.user }, {
        $set: {
          xrp_deposit: list.options.address,
          xrp_tag: list.options.tag
        }
      })
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id });
      return res.send("Success!");
    } else if (list.type === "pay-xrp") {
      mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id })
      let txid = list.options.transactionId;
      let tx = await mongoclient.db("cointunnel").collection("open-transactions")
        .findOne({ txid: txid });
      if (!tx) return res.render("error", { error: "An error occured" })
      let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({ name: tx.merchant });
      var verifac = "No verification string set up! This is very dangerous as this allows people to 'steal' your products and pretend to be Coin-Tunnel";
      if (merchant.verifac) veriac = await decrypt(merchant.verifac);
      let buyer = await mongoclient.db("cointunnel").collection("userData").findOne({ tunnelId: tx.buyerId })

      var newId;
      for (var x = 0; x < 10; x++) {
        if (x === 8) return res.render("error", { error: "An internal server error occured! Could not generate unique Id after 8 tries" })
        newId = await makeid(25);
        let checkId = await mongoclient.db("cointunnel").collection("userData")
          .findOne({ "tunnelId": newId });
        if (!checkId) break;
        else continue;
      }
      //await updateDocumentSet(mongoclient, buyer.name, {
      //  tunnelId:newId
      //})

      // transfer the stupid money
      var depositadr;
      var privateadr;
      mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: tx.txid });
      if (!buyer) {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          timeStamp: Date.now()
        };
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        let returnedResults = await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (returnedResults && returnedResults.toString().includes("error: ")) {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            reason2: "Failed to contact callback server!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        } else {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        }

        return res.render("error", { error: "No wallet set up!" })
      }
      if (buyer.xrp.address === "none") {
        //send dumb thing to callback saying that user is stupid
        let todo = {
          status: "failed",
          reason: "User has no wallet set up!",
          txid: txid,
          coin: "xrp",
          version: "v2",
          timeStamp: Date.now()
        };
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        let returnedResults = await fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifac': verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        if (returnedResults && returnedResults.toString().includes("error: ")) {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            reason2: "Failed to contact callback server!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        } else {
          await mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "failed",
            merchant: tx.merchant,
            reason: "User has no wallet set up!",
            txid: txid,
            archived: true,
            directLogs: transfer,
            timeStamp: Date.now()
          });
        }

        return res.render("error", { error: "No wallet set up!" })
      } else {
        depositadr = buyer.xrp.address;
        privateadr = await decrypt(buyer.xrp.privatex)
      }
      console.log(tx)
      tx.price_in_crypto = tx.price_in_crypto.toString().slice(0, 8)
      tx.price_in_crypto = Number(tx.price_in_crypto)
      console.log(tx.price_in_crypto);
      // send the stupid xrp
      if (!merchant.xrp_tag || merchant.xrp_tag === "") merchant.xrp_tag = "none";
      console.log(merchant.xrp_deposit, depositadr, privateadr, tx.price_in_crypto.toString(), merchant.xrp_tag)
      let transfer = await sendXRP(merchant.xrp_deposit, depositadr, privateadr, tx.price_in_crypto.toString(), merchant.xrp_tag).catch(err => { console.log(err); return "error: " + err.toString() })
      await sleep(5000)
      console.log(transfer)
      if (transfer.toString().includes("error")) {
        let todo = {
          status: "failed",
          reason: "Buyer did not have enough funds, probably withdrew after transaction was created, full logs start here: " + transfer.toString(),
          txid: tx.txid,
          note: tx.note,
          buyerId: tx.buyerId,
          creation: tx.creation,
          expiry: tx.expiry,
          price_in_crypto: tx.price_in_crypto,
          price_in_usd: tx.price_in_usd,
          coin: "xrp",
          version: "v2",
          crypto_network_txid: null,
          timeStamp: Date.now(),
          archived: false
        };

        fetch(tx.callback, {
          method: 'POST',
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', "verifac": verifac }
        }).catch(err => {
          return "error: " + err.toString()
        })
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        return res.render("error", { error: "You probably do not have enough funds to cover this transaction! Nothing has been changed. Full logs: " + JSON.stringify(transfer) })
      }
      let todo = {
        status: "paid",
        //directLogs: transfer,
        txid: tx.txid,
        note: tx.note,
        buyerId: tx.buyerId,
        creation: tx.creation,
        expiry: tx.expiry,
        price_in_crypto: tx.price_in_crypto,
        price_in_usd: tx.price_in_usd,
        coin: "xrp",
        version: "v2",
        crypto_network_txid: transfer.data.txid,
        timeStamp: Date.now(),
        archived: true
      };

      fetch(tx.callback, {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json', "verifac": verifac }
      }).catch(err => {
        return "error: " + err.toString()
      })
      // nice sse time
      let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: merchant.name });
      if (apikey) {
        let sseRes = subscribed[apikey.hash];
        if (sseRes) {
          console.log(sseRes)
          let data = todo;
          data = JSON.stringify(data);
          sseRes.write("data: " + data + '\n\n');
        }
      }
      // end of sse garbage
      await mongoclient.db("cointunnel").collection("finished-transactions").insertOne({
        status: "paid",
        merchant: tx.merchant,
        //directLogs: transfer,
        txid: tx.txid,
        note: tx.note,
        buyerId: tx.buyerId,
        creation: tx.creation,
        expiry: tx.expiry,
        price_in_crypto: tx.price_in_crypto,
        price_in_usd: tx.price_in_usd,
        crypto_network_txid: transfer.data.txid,
        coin: "xrp",
        archived: true,
        timeStamp: Date.now()
      })
      return res.send("Success! You have succesfully paid! The seller has been alerted of your payment, and you should recieve your product shortly.")
    } else if (list.type === "withdraw-trx") {
      let user = await mongoclient.db("cointunnel").collection("userData").findOne({ name: list.user });
      if (!user.trx) return res.send("You don't have an TRX wallet setup!");
      if (user.trx.address === "none") return res.send("You don't have an TRX wallet setup!");
      let secret = await decrypt(user.trx.privatex);
      let results = await sendTrx(list.options.withdrawto, user.trx.address, secret, list.options.amount);
      if (results.code === "CONTRACT_VALIDATE_ERROR"){
        return res.send(Buffer(results.message, 'hex').toString())
      }
      return res.send("Success! TRX TXID: " + results.txid)
    }
  })
  router.delete('/delete/:id', longLimiter, async (req, res) => {
    if (!req.params.id) return res.send("Successfully disabled that link!");
    await mongoclient.db("cointunnel").collection("emails").deleteOne({ name: req.params.id });
    return res.send("Successully disabled that link!")
  })
  router.post('/sendcallback', async (req, res) => {
    console.log("Got a request")
    console.log(req.body);
    if (!req.body.verification) return;
    if (req.body.verification !== secrets.reqsession) return;
    // here is clean stuff
    await mongoclient.db("cointunnel").collection("watched-wallets").deleteOne({ txid: req.body.data.txid })
    if (req.body.type === "LTC nouser paid") {
      // send LTC 
      console.log("SENDING LTC")
      let verifac = await decrypt(req.body.privateData.verifac);
      req.body.privateData.secret = await decrypt(req.body.privateData.secret);
      //req.body.privateData.secret = Math.floor(req.body.privateData.secret)
      let x = await sendLtc(req.body.data.sendTo, 0.003, req.body.privateData.secret, req.body.privateData.address, true).catch(err => { console.log(err); return "error: " + err.toString() })
      console.log("Incoming X 2398")
      console.log(x)
      if (x.json) console.log(await x.json());
      if (x.toString().includes("error: ")) {
        let todo = {
          status: "failed",
          reason: "failed to transfer crypto from user",
          txid: req.body.data.txid,
          creation: req.body.data.creation,
          merchant: req.body.data.merchant,
          archived: true,
          directLogs: x.toString(),
          previous_data: req.body.data
        }
        await fetch(req.body.data.callback, {
          method: "POST",
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifiac': verifac }
        })
        mongoclient.db('cointunnel').collection("err-transactions").insertOne(todo)
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: req.body.data.merchant });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        return;
      }
      let todo = req.body.data;
      await fetch(req.body.data.callback, {
        method: "POST",
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json', 'verifiac': verifac }
      })
      let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: req.body.data.merchant });
      if (apikey) {
        let sseRes = subscribed[apikey.hash];
        if (sseRes) {
          console.log(sseRes)
          let data = todo;
          data = JSON.stringify(data);
          sseRes.write("data: " + data + '\n\n');
        }
      }
      await mongoclient.db('cointunnel').collection("finished-transactions").insertOne(todo);
      //done with LTC
    } else if (req.body.type === "ETH nouser paid") {
      // send ETH 
      let verifac = await decrypt(req.body.privateData.verifac);
      req.body.privateData.secret = await decrypt(req.body.privateData.secret);
      //let maxGas = gasPrice.low * 1000000000 * 22000;
      // max amount of gas to spend in wei
      //maxGas = maxGas * 0.000000000000000001;
      let x = await sendEth(req.body.data.sendTo, req.body.privateData.secret, req.body.privateData.address, 1, true).catch(err => { return "error: " + err.toString() })
      if (x.toString().includes("error: ")) {
        console.log(x)
        let todo = {
          status: "failed",
          reason: "failed to transfer crypto from user",
          txid: req.body.data.txid,
          creation: req.body.data.creation,
          merchant: req.body.data.merchant,
          archived: true,
          directLogs: x.toString(),
          previous_data: req.body.data
        }
        await fetch(req.body.data.callback, {
          method: "POST",
          body: JSON.stringify(todo),
          headers: { 'Content-Type': 'application/json', 'verifiac': verifac }
        })
        mongoclient.db('cointunnel').collection("err-transactions").insertOne(todo)
        let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: req.body.data.merchant });
        if (apikey) {
          let sseRes = subscribed[apikey.hash];
          if (sseRes) {
            console.log(sseRes)
            let data = todo;
            data = JSON.stringify(data);
            sseRes.write("data: " + data + '\n\n');
          }
        }
        return;
      }
      let todo = req.body.data;
      await fetch(req.body.data.callback, {
        method: "POST",
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json', 'verifiac': verifac }
      })
      let apikey = await mongoclient.db("cointunnel").collection("keys").findOne({ userId: req.body.data.merchant });
      if (apikey) {
        let sseRes = subscribed[apikey.hash];
        if (sseRes) {
          console.log(sseRes)
          let data = todo;
          data = JSON.stringify(data);
          sseRes.write("data: " + data + '\n\n');
        }
      }
      await mongoclient.db('cointunnel').collection("finished-transactions").insertOne(todo);
    }
  })
  sseHeartbeat();
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
async function sendLtc(recieverAddress, amountToSend, privateKey, sourceAddress, sweepin) {
  var sweep = false;
  if (!sweepin) sweep = false;
  else sweep = sweepin;
  console.log(sweep)
  //var privateKey = privateKey;
  var address = sourceAddress;
  console.log("USING LTC transfer")
  let results = await getUTXOsBETA(address)
    .then(async (utxos) => {
      console.log("utxos: ")
      //utxos[0].outputIndex = utxos[0].output_no;
      //utxos[0].script = utxos[0].script_hex;
      utxos[0].satoshis = amountToSend * 100000000;
      //utxos[0].amount = Number((amountToSend+0.00001500).toString().slice(0, 7));
      console.log(utxos)
      let balance = 0;
      for (var i = 0; i < utxos.length; i++) {
        balance += utxos[i]['satoshis'];
      } //add up the balance in satoshi format from all utxos
      // var fee = 0.00021; //fee for the tx
      var fee = 21000;
      console.log(amountToSend * 100000000 - fee)

      var tx = new litecore.Transaction() //use litecore-lib to create a transaction
      tx.from(utxos)
      tx.to(recieverAddress, amountToSend * 100000000 - fee)
      tx.fee(fee)
      if (sweep === false) tx.change(sourceAddress);
      else tx.change(recieverAddress);
      console.log(privateKey)
      tx.sign(privateKey)
      tx = tx.serialize();
      console.log("tx here 364")
      //tx = await tx.text();
      console.log(tx)
      return broadcastTX(tx) //broadcast the serialized tx
    })
    .then((result) => {
      console.log("router result: ");
      console.log(result); // txid
      return result;
    })
    .catch((error) => {
      throw error;
    })
  return results;
  //return result.data.data;
}

function broadcastTXBETA(rawtx) {
  return new Promise((resolve, reject) => {
    request({
      uri: 'https://insight.litecore.io/api/tx/send',
      method: 'POST',
      json: {
        rawtx
      }
    },
      (error, response, body) => {
        if (error) reject(error);
        console.log(body);
        resolve(body.txid)
      }
    )
  })
}
function getUTXOsBETA(address) {
  return new Promise((resolve, reject) => {
    request({
      uri: 'https://insight.litecore.io/api/addr/' + address + '/utxo',
      json: true
    },
      (error, response, body) => {
        if (error) reject(error);
        resolve(body)
      }
    )
  })
}
function broadcastTX(rawtx) {
  let todo = {
    tx_hex: rawtx
  }
  return new Promise((resolve, reject) => {
    fetch('https://chain.so/api/v2/send_tx/LTC', {
      method: 'POST',
      body: JSON.stringify(todo),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
      .then(json => resolve(json));
  })
}
async function sendEth(recieverAddress, sourcePrivateAddress, sourcePublicAddress, amountToSend, sweepin) {
  const Web3 = require("web3");
  const EthereumTx = require('ethereumjs-tx').Transaction;

  const ethNetwork = `https://mainnet.infura.io/v3/${secrets.infura}`;
  const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));
  var Accounts = require('web3-eth-accounts');
  var accounts = new Accounts();
  var sweep = false;
  if (!sweepin) sweep = false;
  else sweep = sweepin;
  console.log(sweep)
  if (sweep === false) {
    let nonce = await web3.eth.getTransactionCount(sourcePublicAddress);
    console.log(nonce)
    //let amountToSend = 0.1;
    let weitoSend = amountToSend * 1000000000000000000;


    var queryGasPrice = await getCurrentGasPrices();
    // Passing in the eth or web3 package is necessary to allow retrieving chainId, gasPrice and nonce automatically
    // for accounts.signTransaction().
    // var accounts = new Accounts('ws://localhost:8546');
    var accounts = new Accounts();
    // if nonce, chainId, gas and gasPrice is given it returns synchronous
    var gasPrice = {};
    gasPrice.medium = queryGasPrice;
    console.log(gasPrice.medium)
    gasPrice.medium = Math.trunc(gasPrice.medium)
    weitoSend = Math.trunc(weitoSend)
    let results = await accounts.signTransaction({
      to: recieverAddress,
      value: weitoSend,
      gas: 22000,
      gasPrice: gasPrice.medium,
      nonce: nonce,
      chainId: 1,
      change: sourcePublicAddress
    }, sourcePrivateAddress);

    console.log(results)
    web3.eth.sendSignedTransaction(results.rawTransaction)
    let txresults = await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=${results.rawTransaction}&apikey=${secrets.etherScan}`);
    console.log(txresults.data)
    return txresults.data;
  } else if (sweep === true) {
    var balance = await web3.eth.getBalance(sourcePublicAddress);
    var gas = 21000;
    let gasPrice = Number(await web3.eth.getGasPrice())
    console.log(gasPrice);
    var balanceMinusFee = balance - (gas * gasPrice);
    if (balanceMinusFee < 0) {
      throw "Balance does not cover ethereum transaction fees!";
    } else {
      let nonce = await web3.eth.getTransactionCount(sourcePublicAddress);
      console.log(`sending ethereum from ${sourcePublicAddress} that has ${balance} ETH to ${recieverAddress} with a transaction value of ${balanceMinusFee}. Address nonce: ${nonce}`);
      let results = await accounts.signTransaction({
        to: recieverAddress,
        value: balanceMinusFee,
        gas: 21000,
        gasPrice: gasPrice,
        nonce: nonce,
        chainId: 1,
      }, sourcePrivateAddress);
      web3.eth.sendSignedTransaction(results.rawTransaction)
      let txresults = await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=${results.rawTransaction}&apikey=${secrets.etherScan}`);
      console.log(txresults.data)
      return txresults.data;
    }
  }

}
async function getCurrentGasPrices() {
  let response = await axios.get('https://www.coin-tunnel.ml/api/v2/explorer/eth/gasPrice');
  let prices = Number(response.data);
  return prices;
}
async function sendXRP(recieverAddress, sourcePublicAddress, sourcePrivateAddress, amountToSend, tagx, sweepin) {
  var tag;
  if (tagx === "none") tag = undefined
  else tag = Number(tagx);
  console.log(tag)
  var sweep = false;
  if (!sweepin) sweep = false;
  else sweep = sweepin;
  // TESTNET ADDRESS 1
  const ADDRESS_1 = sourcePublicAddress
  const SECRET_1 = sourcePrivateAddress
  // TESTNET ADDRESS 2
  const ADDRESS_2 = recieverAddress
  const instructions = { maxLedgerVersionOffset: 5 }
  const currency = 'XRP'
  const amount = amountToSend
  const payment = {
    source: {
      address: ADDRESS_1,
      maxAmount: {
        value: amount,
        currency: currency
      }
    },
    destination: {
      tag: tag,
      address: ADDRESS_2,
      amount: {
        value: amount,
        currency: currency
      }
    }
  }
  await api.connect();
  let prepared = await api.preparePayment(ADDRESS_1, payment, instructions);
  const { signedTransaction, id } = api.sign(prepared.txJSON, SECRET_1)
  console.log(id)
  let result = await api.submit(signedTransaction);
  console.log(JSON.parse(JSON.stringify(result, null, 2)))
  api.disconnect()
  returnedResult = JSON.stringify(result, null, 2);
  return JSON.parse(JSON.stringify(result, null, 2))


  //return returnedResult;

}
async function sseHeartbeat() {
  while (true) {
    Object.keys(subscribed).forEach(function (key) {
      let sseRes = subscribed[key];
      let data = {
        heartbeat: {
          timeStamp: Date.now(),
          next_hearbeat: 1,
        }
      }
      data = JSON.stringify(data)
      sseRes.write("data: " + data + '\n\n');
    })
    await sleep(1000)
  }
}

async function sendTrx(recieverAddress, sourcePublicAddress, sourcePrivateAddress, amountToSend, tagx, sweepin) {
  const TronWeb = require("tronweb");
  const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": secrets.tronApiKey },
})
  const privateKey = sourcePrivateAddress;
  var fromAddress = sourcePublicAddress; //address _from
  var toAddress = recieverAddress; //address _to
  var amount = amountToSend*1000000; //amount
  //Creates an unsigned TRX transfer transaction
  tradeobj = await tronWeb.transactionBuilder.sendTrx(
    toAddress,
    amount,
    fromAddress
  );
  const signedtxn = await tronWeb.trx.sign(
    tradeobj,
    privateKey
  );
  const receipt = await tronWeb.trx.sendRawTransaction(
    signedtxn
  );
  console.log('- Output:', receipt, '\n');
  return receipt;
}