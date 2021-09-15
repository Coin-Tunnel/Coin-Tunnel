module.exports = (app) => {
  // '/'
  const enableWs = require('express-ws')
  enableWs(app)
  const session = require('cookie-session');
  var secrets;
  if (process.env.secrets) {
    secrets = JSON.parse(process.env.secrets)
  } else {
    secrets = require("./secret.json")
  }
  const bitcore = require("bitcore-lib");
  const bitcoin = require("bitcoinjs-lib");
  const sochain_network = "BTC";
  var BitcoinjsNetwork;
  const request = require('request')
  if (sochain_network === "BTCTEST") BitcoinjsNetwork = bitcoin.networks.testnet;
  else if (sochain_network === "BTC") BitcoinjsNetwork = bitcoin.networks.bitcoin

  var nodemailer = require('nodemailer');
  const requestIp = require('request-ip');
  var fs = require('file-system');

  const router = require('express').Router();
  const { createHmac } = require("crypto");
  const crypto = require("crypto")
  const rateLimit = require("express-rate-limit");
  const axios = require('axios');
  const fetch = require('node-fetch');
  const FormData = require('form-data');
  var bodyParser = require("body-parser");
  var clientId, clientSecret, scopes, redirectUri;
  if (process.env.config) {
    let temp = JSON.parse(process.env.config);
    clientId = temp.clientId;
    clientSecret = temp.clientSecret;
    scopes = temp.scopes;
    redirectUri = temp.redirectUri;
  } else {
    let temp = require('./config.json');
    clientId = temp.clientId;
    clientSecret = temp.clientSecret;
    scopes = temp.scopes;
    redirectUri = temp.redirectUri;
  }
  const { MongoClient } = require('mongodb')
  const uri = secrets.mongodb;
  const mongoclient = new MongoClient(uri, { poolSize: 10, bufferMaxEntries: 0, useNewUrlParser: true, useUnifiedTopology: true });
  mongoclient.connect(async function (err, mongoclient) {
    var functions = {}
    functions.mongoclient = mongoclient;
    const algorithm = 'aes-256-ctr';
    const secretKey = secrets.secret;
    const iv = crypto.randomBytes(16);
    const { OAuth2Client } = require('google-auth-library');
    const googleClient = new OAuth2Client(secrets.googleClient);
    const litecore = require('litecore-lib')
    console.log(secrets);
    global.project_root = __dirname
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
    function makeid(length) {
      var result = '';
      var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    };
    const guiLimiter = rateLimit({
      windowMs: 1000, // 1 second
      max: 2, // limit each IP to 10 requests per windowMs
      message: "Spam's not cool",
      handler: function (req, res /*, next*/) {
        res.status(429).send({ status: "failed", type: "Too many requests per second! (Max is 2 requests per second)" })
      },
    });
    const longLimiter = rateLimit({
      windowMs: 2000, // 1 second
      max: 1, // limit each IP to 10 requests per windowMs
      message: "Spam's not cool",
      handler: function (req, res /*, next*/) {
        res.status(429).send({ status: "failed", type: "Too many requests per second! (Max is 1 requests per 2 seconds)" })
      },
    });
    const apiLimiter = rateLimit({
      windowMs: 1000, // 1 second
      max: 100, // limit each IP to 10 requests per windowMs
      message: "Spam's not cool",
      handler: function (req, res /*, next*/) {
        res.status(429).send({ status: "failed", type: "Too many requests per second! (Max is 100 requests per second. If you need more, please contact us!)" })
      },
    });
    async function sendBitcoinIncludeFee(recieverAddress, amountToSend, privateKey, sourceAddress) {
      //const privateKey = "92hH26AYd1SwwfQgQ19v5Q6QPUhmneim6QdjbACqt1s1G55AhPw";
      //const sourceAddress = "mwWLU1C3oRhFTyQzNKSYnQbhCRgJ35tJph";
      const satoshiToSend = amountToSend * 100000000;
      let fee = 0;
      let inputCount = 0;
      let outputCount = 2;
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
      ).catch(err => {
        return "error: " + err.toString()
      })
      if (utxos.toString().includes("error: ")) {
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

      let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
      // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

      fee = transactionSize * 20
      if (totalAmountAvailable - satoshiToSend < 0) {
        throw new Error("Balance is too low for this transaction");
      }
      console.log(satoshiToSend - fee - 100)
      //Set transaction input
      transaction.from(inputs);
      // set the recieving address and the amount to send
      transaction.to(recieverAddress, satoshiToSend - fee - 1000);
      // Set change address - Address to receive the left over funds after transfer
      transaction.change(sourceAddress);
      //manually set transaction fees: 20 satoshis per byte
      transaction.fee(fee);
      // Sign transaction with your private key
      transaction.sign(privateKey);
      // serialize Transactions
      const serializedTX = transaction.serialize()

      if (serializedTX.includes("error: :error://::")) {
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
    async function getTxFee(sourceAddress, amountToSend) {
      const satoshiToSend = amountToSend * 100000000;
      let fee = 0;
      let inputCount = 0;
      let outputCount = 2;
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
      ).catch(err => {
        return "error: " + err.toString()
      })
      if (utxos.toString().includes("error: ")) {
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

      let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;

      fee = transactionSize * 20
      return (fee) * 0.00000001
    }
    async function checkTxFee(sourceAddress, amountToSend) {
      const satoshiToSend = amountToSend * 100000000;
      let fee = 0;
      let inputCount = 0;
      let outputCount = 2;
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
      ).catch(err => {
        return "error: " + err.toString()
      })
      if (utxos.toString().includes("error: ")) {
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

      let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
      // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

      fee = transactionSize * 20
      if (totalAmountAvailable - (satoshiToSend + fee) < satoshiToSend) {
        return (false)
      } else return satoshiToSend + fee;
    }
    functions.checkUser = async function checkUser(mongoclient, name) {
      let result = await mongoclient.db("cointunnel").collection("userData")
        .findOne({ name: name });
      if (result) {
        return result;
      } else {
      }
    }
    functions.updateDocumentSet = async function updateDocumentSet(mongoclient, name, updatedlisting) {
      let result = await mongoclient.db("cointunnel").collection("userData")
        .updateOne({ name: name }, { $set: updatedlisting });
    }
    functions.createListing = async function createListing(mongoclient, newWord) {

      let result = await mongoclient.db("cointunnel").collection("userData").insertOne(newWord);

    }
    functions.swap = function swap(json) {
      var ret = {};
      for (var key in json) {
        ret[json[key]] = key;
      }
      return ret;
    }
    functions.updateUser = async function updateUser(mongoclient, name, updatedlisting) {
      let result = await mongoclient.db("cointunnel").collection("userData")
        .updateOne({ name: name }, { $set: updatedlisting });
    }
    functions.createUser = async function createUser(mongoclient, newWord) {

      let result = await mongoclient.db("cointunnel").collection("userData").insertOne(newWord);

    }
    functions.checkStuff = async function checkStuff(mongoclient, name) {
      let result = await mongoclient.db("cointunnel").collection("userData")
        .findOne({ name: name });
      if (result) {
        return result;
      } else {
      }
    }
    functions.sleep = function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    functions.sendBitcoin = async function sendBitcoin(recieverAddress, amountToSend, privateKey, sourceAddress, coin) {
      //const privateKey = "92hH26AYd1SwwfQgQ19v5Q6QPUhmneim6QdjbACqt1s1G55AhPw";
      //const sourceAddress = "mwWLU1C3oRhFTyQzNKSYnQbhCRgJ35tJph";
      if (!coin) {
        const satoshiToSend = amountToSend * 100000000;
        let fee = 0;
        let inputCount = 0;
        let outputCount = 2;
        var utxos = await axios.get(
          `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
        ).catch(err => {
          return "error: " + err.toString()
        })
        if (utxos.toString().includes("error: ")) {
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

        let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
        // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

        fee = transactionSize * 20
        if (totalAmountAvailable - satoshiToSend - fee < 0) {
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

        if (serializedTX.includes("error: :error://::")) {
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
      } else if (coin === "LTC") {
        var privateKey = privateKey;
        var address = sourceAddress;
        console.log("USING LTC transfer")
        let results = await getUTXOsBETA(address)
          .then((utxos) => {
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
              .from(utxos)
              .to(recieverAddress, amountToSend * 100000000 - fee)
              .fee(fee)
              .change(sourceAddress)
              .sign(privateKey)
              .serialize();
            console.log("tx here 364")
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
    };
    function getDirectories(path) {
      return fs.readdirSync(path).filter(function (file) {
        return fs.statSync(path + '/' + file).isDirectory();
      });
    }
    var deleteFolderRecursive = function (path) {
      if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
          var curPath = path + "/" + file;
          if (fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }
    };
    //manually hit an insight api to retrieve utxos of address
    function getUTXOs(address) {
      return new Promise((resolve, reject) => {
        request({
          uri: `https://sochain.com/api/v2/get_tx_unspent/LTC/${address}`,
          json: true
        },
          (error, response, body) => {
            if (error) reject(error);
            resolve(body.data.txs)
          }
        )
      })
    }

    //manually hit an insight api to broadcast your tx
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
    function broadcastTXBETA(rawtx) {
      return new Promise((resolve, reject) => {
        request({
          uri: 'https://insight.litecore.io/tx/send',
          method: 'POST',
          json: {
            rawtx
          }
        },
          (error, response, body) => {
            if (error) reject(error);
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

    //your private key and address here


    functions.sendBitcoinIncludeFee = async function sendBitcoinIncludeFee(recieverAddress, amountToSend, privateKey, sourceAddress) {
      //const privateKey = "92hH26AYd1SwwfQgQ19v5Q6QPUhmneim6QdjbACqt1s1G55AhPw";
      //const sourceAddress = "mwWLU1C3oRhFTyQzNKSYnQbhCRgJ35tJph";
      const satoshiToSend = amountToSend * 100000000;
      let fee = 0;
      let inputCount = 0;
      let outputCount = 2;
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
      ).catch(err => {
        return "error: " + err.toString()
      })
      if (utxos.toString().includes("error: ")) {
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

      let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
      // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

      fee = transactionSize * 20
      if (totalAmountAvailable - satoshiToSend < 0) {
        throw new Error("Balance is too low for this transaction");
      }
      console.log(satoshiToSend - fee - 100)
      //Set transaction input
      transaction.from(inputs);
      // set the recieving address and the amount to send
      transaction.to(recieverAddress, satoshiToSend - fee - 1000);
      // Set change address - Address to receive the left over funds after transfer
      transaction.change(sourceAddress);
      //manually set transaction fees: 20 satoshis per byte
      transaction.fee(fee);
      // Sign transaction with your private key
      transaction.sign(privateKey);
      // serialize Transactions
      const serializedTX = transaction.serialize()

      if (serializedTX.includes("error: :error://::")) {
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
    functions.getTxFee = async function getTxFee(sourceAddress, amountToSend) {
      const satoshiToSend = amountToSend * 100000000;
      let fee = 0;
      let inputCount = 0;
      let outputCount = 2;
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
      ).catch(err => {
        return "error: " + err.toString()
      })
      if (utxos.toString().includes("error: ")) {
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

      let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;

      fee = transactionSize * 20
      return (fee) * 0.00000001
    }
    functions.checkTxFee = async function checkTxFee(sourceAddress, amountToSend) {
      const satoshiToSend = amountToSend * 100000000;
      let fee = 0;
      let inputCount = 0;
      let outputCount = 2;
      var utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
      ).catch(err => {
        return "error: " + err.toString()
      })
      if (utxos.toString().includes("error: ")) {
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

      let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
      // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

      fee = transactionSize * 20
      if (totalAmountAvailable - (satoshiToSend + fee) < satoshiToSend) {
        return (false)
      } else return satoshiToSend + fee;
    }
    functions.generateKeyPairs = async function generateKeyPairs() {
      /*It can generate a random address [and support the retrieval of transactions for that address (via 3PBP)*/
      const keyPair = bitcoin.ECPair.makeRandom({ network: BitcoinjsNetwork });
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: BitcoinjsNetwork });
      const publicKey = keyPair.publicKey.toString("hex");
      const privateKey = keyPair.toWIF();
      return { address, privateKey, publicKey };
    }
    functions.encrypt = function encrypt(text) {

      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

      const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

      return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
      };
    };
    functions.decrypt = function decrypt(hash) {

      const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));

      const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

      return decrpyted.toString();
    };
    functions.makeid = function makeid(length) {
      var result = '';
      var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    };

    functions.secrets = secrets;
    functions.bitcore = bitcore;
    functions.bitcoin = bitcoin;
    functions.sochain_network = sochain_network;
    functions.BitcoinjsNetwork = BitcoinjsNetwork;
    functions.nodemailer = nodemailer;
    functions.requestIp = requestIp;
    functions.createHmac = createHmac;
    functions.crypto = crypto;
    functions.rateLimit = rateLimit;
    functions.axios = axios;
    functions.fetch = fetch;
    functions.FormData = FormData;
    functions.bodyParser = bodyParser;
    functions.clientId = clientId;
    functions.clientSecret = clientSecret;
    functions.scopes = scopes;
    functions.redirectUri = redirectUri;
    functions.googleClient = googleClient;
    let secret = secrets.reqsession;
    functions.cookieParser = session({
      secret: secret,
      resave: false,
      saveUninitialized: false,
      expires: 604800000,
    })
    functions.apiLimiter = apiLimiter;
    functions.guiLimiter = guiLimiter;
    functions.longLimiter = guiLimiter;
    var checkUser = functions.checkUser;
    var updateDocumentSet = functions.updateDocumentSet;
    var createListing = functions.createListing;
    var swap = functions.swap;
    var updateUser = functions.updateUser;
    var createUser = functions.createUser;
    var checkStuff = functions.checkStuff;
    var sleep = functions.sleep;

    let dbCollections = await mongoclient.db("cointunnel").listCollections();
    dbCollections = await dbCollections.toArray();
    if (dbCollections.length !== 8) {
      var updateCollections = []
      let emailCollection = await (dbCollections.find(e => e.name === 'emails'));
      if (emailCollection === undefined) updateCollections.push("emails");
      let errtransactions = await dbCollections.find(e => e.name === 'err-transactions');
      if (errtransactions === undefined) updateCollections.push("err-transactions");
      let finishedCollection = await dbCollections.find(e => e.name === "finished-transactions");
      if (finishedCollection === undefined) updateCollections.push("finished-transactions");
      let keyCollection = await dbCollections.find(e => e.name === "keys");
      if (keyCollection === undefined) updateCollections.push("keys");
      let merchantCollection = await dbCollections.find(e => e.name === "merchantData");
      if (merchantCollection === undefined) updateCollections.push("merchantData");
      let openCollection = await dbCollections.find(e => e.name === "open-transactions");
      if (openCollection === undefined) updateCollections.push("open-transactions");
      let userCollection = await dbCollections.find(e => e.name === "userData");
      if (userCollection === undefined) updateCollections.push("userData");
      let watchedCollection = await dbCollections.find(e => e.name === "watched-wallets");
      if (watchedCollection === undefined) updateCollections.push("watched-wallets");
      console.log("DB collection count is not corret, adding collections", updateCollections)
      for (var x = 0; x < updateCollections.length; x++) {
        await mongoclient.db("cointunnel").createCollection(updateCollections[x])
      }
      console.log("Done!")
      // check each collection and create accordingly
    }
    global.functions = functions;

    app.use('/api/v1/create', require('./routes/api/v1/create')(functions));
    app.use('/api/v1/createNoUser', require('./routes/api/v1/createNoUser')(functions));
    app.use('/api/v1/txinfo', require('./routes/api/v1/txinfo')(functions));
    app.use('/api/v1/get', require('./routes/api/v1/get')(functions));
    app.use('/api/v1/txsearch', require('./routes/api/v1/txsearch')(functions));

    app.use('/api/v2/create', require('./routes/api/v2/create')(functions));
    app.use('/api/v2/sse', require('./routes/api/v2/sse')(functions));
    app.use('/api/v2/transactions', require('./routes/api/v2/transactions')(functions));
    app.use('/api/v2/get', require('./routes/api/v2/get')(functions));
    app.use('/api/v2/txsearch', require('./routes/api/v2/txsearch')(functions));
    app.use('/api/v2/createNoUser', require('./routes/api/v2/createNoUser')(functions));
    app.use('/api/v2/explorer/eth', require('./routes/api/v2/ethexplorer')(functions));
    app.use('/api/v2/explorer/xrp', require('./routes/api/v2/xrpexplorer')(functions));

    app.use('/api/trading/v1/ws', require('./routes/api/trading/v1/websocket')(functions));
    app.use('/api/trading/v1/query', require('./routes/api/trading/v1/websocket')(functions));

    app.use('/signup-b', require('./routes/gui/buyers/signup-b')(functions));
    app.use('/signup-m', require('./routes/gui/merchants/signup-m')(functions));
    app.use('/signup-buyer-github-callback', require('./routes/callbacks/Bsignupgithub')(functions));
    app.use('/discord-buyer-callback', require('./routes/callbacks/Bsignupdiscord')(functions));
    app.use('/validateGoogle', require('./routes/callbacks/BvalidateGoogle')(functions));
    app.use('/openGoogleSignup', require('./routes/callbacks/Bopengooglesignup')(functions));
    app.use('/destroySession', require('./routes/callbacks/destroySession')(functions));
    app.use('/checkUsersignin', require('./routes/callbacks/checkUsersignin')(functions));
    app.use('/changeMerchantAddress', require('./routes/callbacks/changeMerchantAddress')(functions));
    app.use('/regenerate', require('./routes/callbacks/regenerate')(functions));
    app.use('/checkUser', require('./routes/callbacks/checkUser')(functions));
    app.use('/createOnlineWallet', require('./routes/callbacks/createOnlineWallet')(functions))

    app.use('/status', require('./routes/gui/merchants/status')(functions));
    app.use('/connect', require('./routes/gui/buyers/connect')(functions));
    app.use('/dashboard-m', require('./routes/gui/merchants/dashboard-m')(functions))
    app.use('/changeAddress', require('./routes/gui/merchants/changeAddress')(functions));
    app.use('/changeKey', require('./routes/callbacks/changeKey')(functions));
    app.use('/validate', require('./routes/gui/buyers/confirm')(functions));
    app.use('/dashboard-b', require('./routes/gui/buyers/dashboard-b')(functions));
    app.use('/tos', require('./routes/gui/merchants/tos')(functions));
    app.use('/signin-b', require('./routes/gui/buyers/signin-b')(functions));
    app.use('/welcome-m', require('./routes/gui/merchants/welcome-m')(functions));
    app.use('/signin-m', require('./routes/gui/merchants/signin-m')(functions));
    app.use('/welcome', require('./routes/gui/buyers/welcome')(functions));
    app.use('/assets', require('./routes/gui/buyers/assets')(functions))
    app.use('/trading', require('./routes/gui/buyers/trading')(functions));

    app.use('/operations', require('./routes/operations/index')(functions));
    app.use('/discord-seller-callback-signin', require('./routes/callbacks/discord-seller-callback-signin')(functions))
    app.use('/signin-seller-discord', require('./routes/gui/merchants/signin-seller-discord')(functions));
    app.use('/validateGoogleseller', require('./routes/operations/validateGoogleseller')(functions));
    app.use('/discord-seller-callback', require('./routes/callbacks/discord-seller-callback')(functions));
    app.use('/signup-seller-discord', require('./routes/operations/signup-seller-discord')(functions));
    app.use('/signin-buyer-discord', require('./routes/callbacks/signin-buyer-discord')(functions));
    app.use('/discord-buyer-callback-signin', require('./routes/callbacks/discord-buyer-callbacks-signin')(functions));
    app.use('/signup-merchant-github-callback', require('./routes/callbacks/signup-merchant-github-callback')(functions));
    app.use('/validateGoogleSignin', require('./routes/operations/validateGoogleSignin')(functions));
    app.use('/validateGoogleM', require('./routes/operations/validateGoogleM')(functions));
    app.use('/checkUserM', require('./routes/operations/checkUserM')(functions))
    app.use('/withdraw', require('./routes/operations/withdraw')(functions));
    app.use('/delete-b', require('./routes/operations/delete-b')(functions));
    app.use('/regenerateID', require('./routes/operations/regenerateID')(functions));

    app.use('/sse', require('./routes/sse')(functions));

    app.use('/', require('./routes/index'));

    app.use(function (req, res) {
      res.render('404_error');
    });
    garbageCollection();
    async function garbageCollection() {
      while (true) {
        await mongoclient.db("cointunnel").collection('open-transactions').find({ expiry: { $lt: Date.now() } }).forEach(results => {
          console.log(results)
          mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: results.txid });
          if (results.txid.startsWith("T")) mongoclient.db('cointunnel').collection("watched-wallets").deleteOne({ txid: results.txid })
          else mongoclient.db("cointunnel").collection("err-transactions").insertOne({
            status: "Expired",
            deletion_time: Date.now() + 2073600000, //that's 15 days,
            creation_timeStamp: Date.now(),
            txid: results.txid,
            merchant: results.merchant,
            data: {
              price_in_usd: results.price_in_usd,
              price_in_btc: results.price_in_btc,
              price_in_crypto: results.price_in_crypto,
              creation: results.creation,
              callback: results.callback,
              note: results.note,
            }
          })
        });
        await mongoclient.db("cointunnel").collection("emails").deleteMany({ expiry: { $lt: Date.now() } });
        await mongoclient.db("cointunnel").collection('err-transactions').deleteMany({ deletion_time: { $lt: Date.now() } });
        await mongoclient.db("cointunnel").collection('closed-transactions').deleteMany({ timeStamp: { $lt: Date.now() + 2073600000 } });

        let excelFiles = await getDirectories(global.project_root + "/static/cdn")
        for (let i = 0; i < excelFiles.length; i++) {
          let path = global.project_root + "/static/cdn/" + excelFiles[i] + "/meta.json";
          let json = require(path);
          if (json.creation + 60000 < Date.now()) {
            // delete stuff
            let todo = { "hi": "hi" }
            fetch(`${secrets.domain}/operations/deleteCDN/${excelFiles[i]}`, {
              method: 'POST',
              body: JSON.stringify(todo),
              headers: { 'Content-Type': 'application/json' }
            })
          }
        }

        await sleep(10000)
      }
    }
    watchWallets();
    async function watchWallets() {
      await sleep(1100) // start up time
      while (true) {
        let wallets = await mongoclient.db("cointunnel").collection("watched-wallets").find();
        wallets = await wallets.toArray();
        for (var x = 0; x < wallets.length; x++) {
          let element = wallets[x]
          if (element.expiry < Date.now()) {
            // delete it and then continue
            await mongoclient.db("cointunnel").collection("watched-wallets").deleteOne({ txid: element.txid })
            continue;
          } else if (!element.coin) {
            let bitcoinwallet = await fetch(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${element.wallet}`);
            bitcoinwallet = await bitcoinwallet.json()
            console.log(bitcoinwallet)
            if (bitcoinwallet.status === "fail") {
              mongoclient.db("cointunnel").collection("watched-wallets").deleteOne({ txid: element.txid });
              mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: element.txid })
              continue;
            } else {
              let total_balance = Number(bitcoinwallet.data.confirmed_balance)
              let acceptable_balance = 0.01 * Number(element.accuracy) * Number(element.price_in_btc);
              if (total_balance < acceptable_balance) {
                console.log("wallet not enough funds to withdraw")
                continue
              } else {
                let merchant = await mongoclient.db("cointunnel").collection("merchantData").findOne({ name: element.merchant });
                let tx = await mongoclient.db("cointunnel").collection("open-transactions").findOne({ txid: element.txid });
                let secretKey1 = await decrypt(element.secret)
                console.log(total_balance)
                let amountoffee = await getTxFee(merchant.deposit, total_balance);
                console.log(amountoffee)
                let sent = await sendBitcoinIncludeFee(merchant.deposit, total_balance, secretKey1, element.wallet).catch(err => {
                  return "error: " + err.toString()
                })
                if (sent.toString().includes("error: ")) {
                  console.log(sent)
                  // send something bad to merchant 
                  let todo = {
                    status: "error",
                    directLogs: sent.toString(),
                    txid: tx.txid,
                    note: tx.note,
                    creation: tx.creation,
                    expiry: element.expiry,
                    price_in_btc: tx.price_in_btc,
                    price_in_usd: tx.price_in_usd,
                    timeStamp: Date.now(),
                    archived: false
                  };
                  var verifac = "You currently do not have a verification string set up! This is dangerous as this lets anyone send things to your server.";
                  if (merchant.verifac) verifac = await decrypt(merchant.verifac);
                  fetch(tx.callback, {
                    method: 'POST',
                    body: JSON.stringify(todo),
                    headers: { 'Content-Type': 'application/json', "verifac": verifac }
                  }).catch(err => {
                    return "error: " + err.toString()
                  })
                  continue;
                }
                // good make payment
                let todo = {
                  status: "paid",
                  directLogs: sent.toString(),
                  txid: tx.txid,
                  note: tx.note,
                  creation: tx.creation,
                  expiry: element.expiry,
                  price_in_btc: tx.price_in_btc,
                  price_in_usd: tx.price_in_usd,
                  timeStamp: Date.now(),
                  archived: false
                };
                var verifac = "You currently do not have a verification string set up! This is dangerous as this lets anyone send requests to your server.";
                if (merchant.verifac) verifac = await decrypt(merchant.verifac);
                fetch(tx.callback, {
                  method: 'POST',
                  body: JSON.stringify(todo),
                  headers: { 'Content-Type': 'application/json', "verifac": verifac }
                }).catch(err => {
                  return "error: " + err.toString()
                })
                mongoclient.db("cointunnel").collection("watched-wallets").deleteOne({ txid: element.txid })
                mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: element.txid })
                continue;
              }
            }
          } else if (element.coin === "LTC") {
            // get amount in wallet
            let wallet = await fetch(`https://sochain.com/api/v2/get_address_balance/LTC/${element.wallet}`);
            wallet = await wallet.json();
            if (wallet.status === "fail") {
              // delete the request
              await mongoclient.db("cointunnel").collection("open-transactions").deleteOne({ txid: element.txid });
              await mongoclient.db('cointunnel').collection("watched-wallets").deleteOne({ txid: element.txid });
              continue;
            }
            if (Number(wallet.data.confirmed_balance) > 0) {
              // increase expiry because stuff is on the way
              await mongoclient.db("cointunnel").collection("open-transactions").updateOne({ txid: element.txid }, {
                $set: {
                  expiry: Date.now() + 7200000
                }
              })
              await mongoclient.db("cointunnel").collection("watched-wallets").updateOne({ txid: element.txid }, {
                $set: {
                  expiry: Date.now() + 7200000
                }
              })
            }
            let total_balance = Number(wallet.data.confirmed_balance)
            let acceptable_balance = 0.01 * Number(element.accuracy) * Number(element.price_in_crypto);

            if (acceptable_balance < total_balance) {
              //await sleep(1000)
              // send all the balance to merchant
              // it's good and do things
              console.log(element.txid)
              let opentransaction = await mongoclient.db('cointunnel').collection("open-transactions").findOne({ txid: element.txid });
              console.log(opentransaction)
              mongoclient.db('cointunnel').collection("open-transactions").deleteOne({ txid: element.txid });
              let merchant = await mongoclient.db('cointunnel').collection("merchantData").findOne({ name: opentransaction.merchant });
              if (!merchant.ltc_deposit || merchant.ltc_deposit === "none") continue;
              if (!opentransaction) continue;
              let todo = {
                verification: secrets.reqsession,
                type: "LTC nouser paid",
                data: {
                  status: "paid",
                  merchant: opentransaction.merchant,
                  price_in_usd: opentransaction.price_in_usd,
                  price_in_crypto: opentransaction.price_in_crypto,
                  coin: "LTC",
                  version: "v2",
                  creation: opentransaction.creation,
                  callback: opentransaction.callback,
                  note: opentransaction.note,
                  txid: opentransaction.txid,
                  type: "no buyer account",
                  accuracy: opentransaction.accuracy,
                  publicAddress: opentransaction.publicAddress,
                  sendTo: merchant.ltc_deposit,
                  expiry: opentransaction.expiry
                },
                privateData: {
                  address: element.wallet,
                  secret: element.secret,
                  verifac: merchant.verifac
                }
              };

              fetch(secrets.domain + '/api/v2/transactions/sendcallback', {
                method: 'POST',
                body: JSON.stringify(todo),
                headers: { 'Content-Type': 'application/json' }
              })
            }
          } else if (element.coin === "ETH") {
            let wallet = await fetch(`${secrets.domain}/api/v2/explorer/eth/auto/${element.wallet}`) // push to main deployment first
            wallet = await wallet.json();
            console.log(wallet)
            let total_balance = Number(wallet.data.wei) * 0.000000000000000001;
            let acceptable_balance = 0.01 * Number(element.accuracy) * Number(element.price_in_crypto);
            if (acceptable_balance < total_balance) {
              // send all the balance to merchant
              // it's good and do things
              let opentransaction = await mongoclient.db('cointunnel').collection("open-transactions").findOne({ txid: element.txid });
              mongoclient.db('cointunnel').collection("open-transactions").deleteOne({ txid: element.txid });
              let merchant = await mongoclient.db('cointunnel').collection("merchantData").findOne({ name: opentransaction.merchant });
              if (!merchant.eth_deposit || merchant.eth_deposit === "none") continue;
              if (!opentransaction) continue;
              let todo = {
                verification: secrets.reqsession,
                type: "ETH nouser paid",
                data: {
                  status: "paid",
                  merchant: opentransaction.merchant,
                  price_in_usd: opentransaction.price_in_usd,
                  price_in_crypto: opentransaction.price_in_crypto,
                  coin: "ETH",
                  version: "v2",
                  creation: opentransaction.creation,
                  callback: opentransaction.callback,
                  note: opentransaction.note,
                  txid: opentransaction.txid,
                  type: "no buyer account",
                  accuracy: opentransaction.accuracy,
                  publicAddress: opentransaction.publicAddress,
                  sendTo: merchant.eth_deposit,
                  expiry: opentransaction.expiry
                },
                privateData: {
                  address: element.wallet,
                  secret: element.secret,
                  verifac: merchant.verifac
                }
              };

              fetch(secrets.domain + '/api/v2/transactions/sendcallback', {
                method: 'POST',
                body: JSON.stringify(todo),
                headers: { 'Content-Type': 'application/json' }
              })
            }
            // first make the api that creates the NOUSER transaction lol (Done (maybe?))
          }
        };
        await sleep(60000)
      }
    }
    sendRequests();
    async function sendRequests(){
      while(true){
        // get mongodb request list
        // then send the requests and delete them
        // if request timesout, then don't delete item
        await sleep(60000)
      }
    }
  })
}