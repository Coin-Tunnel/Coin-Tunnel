
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv, cookieParser;
const algorithm = 'aes-256-ctr';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var W3CWebSocket = require('websocket').w3cwebsocket;;
// you can't save sessions *in* web sockets, but you can still read them, you just can't write. (This is fine anyways lol);
var livePrices = {
    btc: {
        aInternal: 10,
        aListener: function (val) { },
        set a(val) {
            this.aInternal = val;
            this.aListener(val);
        },
        get a() {
            return this.aInternal;
        },
        registerListener: function (listener) {
            this.aListener = listener;
        }
    },
    eth: {
        aInternal: 10,
        aListener: function (val) { },
        set a(val) {
            this.aInternal = val;
            this.aListener(val);
        },
        get a() {
            return this.aInternal;
        },
        registerListener: function (listener) {
            this.aListener = listener;
        }
    },
    ltc: {
        aInternal: 10,
        aListener: function (val) { },
        set a(val) {
            this.aInternal = val;
            this.aListener(val);
        },
        get a() {
            return this.aInternal;
        },
        registerListener: function (listener) {
            this.aListener = listener;
        }
    },
    xrp: {
        aInternal: 10,
        aListener: function (val) { },
        set a(val) {
            this.aInternal = val;
            this.aListener(val);
        },
        get a() {
            return this.aInternal;
        },
        registerListener: function (listener) {
            this.aListener = listener;
        }
    },
    ada: {
        aInternal: 10,
        aListener: function (val) { },
        set a(val) {
            this.aInternal = val;
            this.aListener(val);
        },
        get a() {
            return this.aInternal;
        },
        registerListener: function (listener) {
            this.aListener = listener;
        }
    },
    bnb: {
        aInternal: 10,
        aListener: function (val) { },
        set a(val) {
            this.aInternal = val;
            this.aListener(val);
        },
        get a() {
            return this.aInternal;
        },
        registerListener: function (listener) {
            this.aListener = listener;
        }
    }
}
var openWs = {
    btc: 0,
    ltc: 0,
    xrp: 0,
    eth: 0,
    bnb: 0,
    ada: 0
}

sleep(1000).then(thing => {
    router.get("/server-time", async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        // compose the message
        res.write('id: You suck\n');

        let data = "hello world you suck";

        for (var t = 0; t < 1000000; t++) {
            if (t === 10) {
                return res.end();
            }
            function date() {
                var d = new Date();
                var year = d.getFullYear();
                var month = d.getMonth() + 1;
                var date = d.getDate()
                return year + "/" + month + "/" + date + " " + d.toTimeString();
            }
            try {
                let randomWait = Math.floor(Math.random() * 4000);
                await sleep(randomWait);
                res.write("data: " + date() + '\n\n');
            } catch (err) {
                return err.toString()
            }

            await sleep(1000);
        }

        for (var x = 0; x < 10; x++) {
            res.write("data: " + data + '\n\n'); // whenever you send two new line characters the message is sent automatically
            await sleep(1000);
        }
    })
    router.get("/prices/btc", async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        if (req.query.static && req.query.static === "true"){
          return res.send(livePrices.btc.a)   
        } else if (req.query.slow && req.query.slow === "true"){
            for (var x = 0; x<400; x++){
                res.write("data: "+livePrices.btc.a.toString() + "\n\n");
                await sleep(250)
            }
        }else{
            livePrices.btc.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/eth", async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        if (req.query.static && req.query.static === "true"){
          return res.send(livePrices.eth.a)   
        } else if (req.query.slow && req.query.slow === "true"){
            for (var x = 0; x<100; x++){
                res.write("data: "+livePrices.eth.a.toString() + "\n\n");
                await sleep(1000)
            }
        }else{
            livePrices.eth.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/ltc", async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        if (req.query.static && req.query.static === "true"){
          return res.send(livePrices.ltc.a)   
        } else if (req.query.slow && req.query.slow === "true"){
            for (var x = 0; x<100; x++){
                res.write("data: "+livePrices.ltc.a.toString() + "\n\n");
                await sleep(1000)
            }
        }else{
            livePrices.ltc.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/xrp", async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        if (req.query.static && req.query.static === "true"){
          return res.send(livePrices.xrp.a)   
        } else if (req.query.slow && req.query.slow === "true"){
            for (var x = 0; x<100; x++){
                res.write("data: "+livePrices.xrp.a.toString() + "\n\n");
                await sleep(1000)
            }
        }else{
            livePrices.xrp.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/ada", async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        if (req.query.static && req.query.static === "true"){
          return res.send(livePrices.ada.a)   
        } else if (req.query.slow && req.query.slow === "true"){
            for (var x = 0; x<100; x++){
                res.write("data: "+livePrices.ada.a.toString() + "\n\n");
                await sleep(1000)
            }
        }else{
            livePrices.ada.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/bnb", async (req, res) => {
        if (req.query.static !== "true"){
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }); 
        }
        if (req.query.static && req.query.static === "true"){
          return res.send(livePrices.bnb.a.toString())   
        } else if (req.query.slow && req.query.slow === "true"){
            for (var x = 0; x<100; x++){
                res.write("data: "+livePrices.bnb.a + "\n\n");
                await sleep(1000)
            }
        }else{
            livePrices.bnb.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/all", async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        if (req.query.slow && req.query.slow === "true"){
            for (var x = 0; x<100; x++){
                let data = {
                    btc: livePrices.btc.a,
                    ltc: livePrices.ltc.a,
                    eth: livePrices.eth.a,
                    xrp: livePrices.xrp.a,
                    ada: livePrices.ada.a,
                    bnb: livePrices.bnb.a
                }
                data = JSON.stringify(data)
                res.write("data: "+data + "\n\n");
                await sleep(1000)
            }
        }else{
            livePrices.btc.registerListener(function (val) {
                let data = {
                    btc: livePrices.btc.a,
                    ltc: livePrices.ltc.a,
                    eth: livePrices.eth.a,
                    xrp: livePrices.xrp.a,
                    ada: livePrices.ada.a,
                    bnb: livePrices.bnb.a
                }
                data = JSON.stringify(data)
                res.write("data: "+data + "\n\n");
            });
        }
    })
})
updatePrices();
async function updatePrices() {
    updateBtc();
    updateEth();
    updateLtc();
    updateXrp();
    updateBnb();
    updateAda();
}
async function updateBtc() {
    if (openWs.btc !== 0) return;
    else openWs.btc = openWs.btc + 1;
    var client = new W3CWebSocket('wss://stream.binance.com:9443/stream?streams=btcusdt@aggTrade');

    client.onopen = function () {
        console.log('Bitcoin WebSocket Client Connected');
    };
    client.onmessage = function (message) {
        var data = message.data;
        var stream = JSON.parse(data).stream;
        var btcPrice;
        try {
            btcPrice = Number(JSON.parse(data).data.p)
        } catch (err) {
            return;
        }
        livePrices.btc.a = btcPrice;
    };
    client.onclose = async function () {
        console.log('echo-protocol Connection Closed. Attempting to reconnect in 10 seconds...');
        openWs.btc = 0;
        await sleep(10000);
        return updateBtc();
    };
    client.onerror = async function (error) {
        console.log("Connection Error: " + JSON.stringify(error).toString() + " Attempting to reconnect in 10 seconds...");
        openWs.btc = 0;
        await sleep(10000);
        return updateBtc();
    };
    return;
}
async function updateEth() {
    if (openWs.eth !== 0) return;
    else openWs.eth = openWs.eth + 1;
    var client = new W3CWebSocket('wss://stream.binance.com:9443/stream?streams=ethusdt@aggTrade');

    client.onopen = function () {
        console.log('Ethereum WebSocket Client Connected');
    };
    client.onmessage = function (message) {
        var data = message.data;
        var stream = JSON.parse(data).stream;
        var price;
        try {
            price = Number(JSON.parse(data).data.p)
        } catch (err) {
            return;
        }
        livePrices.eth.a = price;
    };
    client.onclose = async function () {
        console.log('echo-protocol Connection Closed. Attempting to reconnect in 10 seconds...');
        openWs.eth = 0;
        await sleep(10000)
        return updateEth();
    };
    client.onerror = async function (error) {
        console.log("Connection Error: " + JSON.stringify(error).toString() + " Attempting to reconnect in 10 seconds...");
        openWs.eth = 0;
        await sleep(10000);
        return updateEth();
    };
    return;
}
async function updateLtc() {
    if (openWs.ltc !== 0) return;
    else openWs.ltc = openWs.ltc + 1;
    var client = new W3CWebSocket('wss://stream.binance.com:9443/stream?streams=ltcusdt@aggTrade');

    client.onopen = function () {
        console.log('Litecoin WebSocket Client Connected');
    };
    client.onmessage = function (message) {
        var data = message.data;
        var stream = JSON.parse(data).stream;
        var price;
        try {
            price = Number(JSON.parse(data).data.p)
        } catch (err) {
            return;
        }
        livePrices.ltc.a = price;
    };
    client.onclose = async function () {
        console.log('echo-protocol Connection Closed. Attempting to reconnect in 10 seconds...');
        openWs.ltc = 0;
        await sleep(10000)
        return updateLtc();
    };
    client.onerror = async function (error) {
        console.log("Connection Error: " + JSON.stringify(error).toString() + " Attempting to reconnect in 10 seconds...");
        openWs.ltc = 0;
        await sleep(10000);
        return updateLtc();
    };
    return;
}
async function updateXrp() {
    if (openWs.xrp !== 0) return;
    else openWs.xrp = openWs.xrp + 1;
    var client = new W3CWebSocket('wss://stream.binance.com:9443/stream?streams=xrpusdt@aggTrade');

    client.onopen = function () {
        console.log('Ripple WebSocket Client Connected');
    };
    client.onmessage = function (message) {
        var data = message.data;
        var stream = JSON.parse(data).stream;
        var price;
        try {
            price = Number(JSON.parse(data).data.p)
        } catch (err) {
            return;
        }
        livePrices.xrp.a = price;
    };
    client.onclose = async function () {
        console.log('echo-protocol Connection Closed. Attempting to reconnect in 10 seconds...');
        openWs.xrp = 0;
        await sleep(10000)
        return updateXrp();
    };
    client.onerror = async function (error) {
        console.log("Connection Error: " + JSON.stringify(error).toString() + " Attempting to reconnect in 10 seconds...");
        openWs.xrp = 0;
        await sleep(10000);
        return updateXrp();
    };
    return;
}
async function updateAda() {
    if (openWs.ada !== 0) return;
    else openWs.ada = openWs.ada + 1;
    var client = new W3CWebSocket('wss://stream.binance.com:9443/stream?streams=adausdt@aggTrade');

    client.onopen = function () {
        console.log('Cardano WebSocket Client Connected');
    };
    client.onmessage = function (message) {
        var data = message.data;
        var stream = JSON.parse(data).stream;
        var price;
        try {
            price = Number(JSON.parse(data).data.p)
        } catch (err) {
            return;
        }
        livePrices.ada.a = price;
    };
    client.onclose = async function () {
        console.log('echo-protocol Connection Closed. Attempting to reconnect in 10 seconds...');
        openWs.ada = 0;
        await sleep(10000)
        return updateAda();
    };
    client.onerror = async function (error) {
        console.log("Connection Error: " + JSON.stringify(error).toString() + " Attempting to reconnect in 10 seconds...");
        openWs.ada = 0;
        await sleep(10000);
        return updateAda();
    };
    return;
}
async function updateBnb() {
    if (openWs.bnb !== 0) return;
    else openWs.bnb = openWs.bnb + 1;
    var client = new W3CWebSocket('wss://stream.binance.com:9443/stream?streams=bnbusdt@aggTrade');

    client.onopen = function () {
        console.log('Bianance Coin WebSocket Client Connected');
    };
    client.onmessage = function (message) {
        var data = message.data;
        var stream = JSON.parse(data).stream;
        var price;
        try {
            price = Number(JSON.parse(data).data.p)
        } catch (err) {
            return;
        }
        livePrices.bnb.a = price;
    };
    client.onclose = async function () {
        console.log('echo-protocol Connection Closed. Attempting to reconnect in 10 seconds...');
        openWs.bnb = 0;
        await sleep(10000)
        return updateBnb();
    };
    client.onerror = async function (error) {
        console.log("Connection Error: " + JSON.stringify(error).toString() + " Attempting to reconnect in 10 seconds...");
        openWs.bnb = 0;
        await sleep(10000);
        return updateBnb();
    };
    return;
}
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

    cookieParser = var1.cookieParser;
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
