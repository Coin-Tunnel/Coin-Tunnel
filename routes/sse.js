
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv, cookieParser;
const algorithm = 'aes-256-ctr';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var W3CWebSocket = require('websocket').w3cwebsocket;;
// you can't save sessions *in* web sockets, but you can still read them, you just can't write. (This is fine anyways lol);
global.livePrices = {
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
    },
    trx: {
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
    all: 0
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
        if (req.query.static !== "true") {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
        if (req.query.static && req.query.static === "true") {
            return res.send(global.livePrices.btc.a.toString())
        } else if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 400; x++) {
                res.write("data: " + global.livePrices.btc.a.toString() + "\n\n");
                await sleep(250)
            }
        } else {
            global.livePrices.btc.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/eth", async (req, res) => {
        if (req.query.static !== "true") {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
        if (req.query.static && req.query.static === "true") {
            return res.send(global.livePrices.eth.a.toString())
        } else if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 100; x++) {
                res.write("data: " + global.livePrices.eth.a.toString() + "\n\n");
                await sleep(1000)
            }
        } else {
            global.livePrices.eth.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/ltc", async (req, res) => {
        if (req.query.static !== "true") {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
        if (req.query.static && req.query.static === "true") {
            return res.send(global.livePrices.ltc.a.toString())
        } else if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 100; x++) {
                res.write("data: " + global.livePrices.ltc.a.toString() + "\n\n");
                await sleep(1000)
            }
        } else {
            global.livePrices.ltc.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/xrp", async (req, res) => {
        if (req.query.static !== "true") {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
        if (req.query.static && req.query.static === "true") {
            return res.send(global.livePrices.xrp.a.toString())
        } else if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 100; x++) {
                res.write("data: " + global.livePrices.xrp.a.toString() + "\n\n");
                await sleep(1000)
            }
        } else {
            global.livePrices.xrp.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/ada", async (req, res) => {
        if (req.query.static !== "true") {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
        if (req.query.static && req.query.static === "true") {
            return res.send(global.livePrices.ada.a.toString())
        } else if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 100; x++) {
                res.write("data: " + global.livePrices.ada.a.toString() + "\n\n");
                await sleep(1000)
            }
        } else {
            global.livePrices.ada.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/bnb", async (req, res) => {
        if (req.query.static !== "true") {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
        if (req.query.static && req.query.static === "true") {
            return res.send(global.livePrices.bnb.a.toString())
        } else if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 100; x++) {
                res.write("data: " + global.livePrices.bnb.a + "\n\n");
                await sleep(1000)
            }
        } else {
            global.livePrices.bnb.registerListener(function (val) {
                res.write("data: " + val + '\n\n');
            });
        }
    })
    router.get("/prices/trx", async (req, res) => {
        if (req.query.static !== "true") {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
        if (req.query.static && req.query.static === "true") {
            return res.send(global.livePrices.trx.a.toString())
        } else if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 100; x++) {
                res.write("data: " + global.livePrices.trx.a + "\n\n");
                await sleep(1000)
            }
        } else {
            global.livePrices.trx.registerListener(function (val) {
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
        if (req.query.slow && req.query.slow === "true") {
            for (var x = 0; x < 100; x++) {
                let data = {
                    btc: global.livePrices.btc.a,
                    ltc: global.livePrices.ltc.a,
                    eth: global.livePrices.eth.a,
                    xrp: global.livePrices.xrp.a,
                    ada: global.livePrices.ada.a,
                    bnb: global.livePrices.bnb.a,
                    trx: global.livePrices.trx.a
                }
                data = JSON.stringify(data)
                res.write("data: " + data + "\n\n");
                await sleep(1000)
            }
        } else {
            global.livePrices.btc.registerListener(function (val) {
                let data = {
                    btc: global.livePrices.btc.a,
                    ltc: global.livePrices.ltc.a,
                    eth: global.livePrices.eth.a,
                    xrp: global.livePrices.xrp.a,
                    ada: global.livePrices.ada.a,
                    bnb: global.livePrices.bnb.a,
                    trx: global.livePrices.trx.a
                }
                data = JSON.stringify(data)
                res.write("data: " + data + "\n\n");
            });
        }
    })
})
updatePrices();
async function updatePrices() {
    updateAll();
}

async function updateAll() {
    if (openWs.all !== 0) return;
    else openWs.all = openWs.all + 1;
    var client = new W3CWebSocket('wss://stream.binance.com:9443/stream?streams=btcusdt@aggTrade/ethusdt@aggTrade/ltcusdt@aggTrade/xrpusdt@aggTrade/adausdt@aggTrade/bnbusdt@aggTrade/trxusdt@aggTrade');

    client.onopen = function () {
        console.log('WebSocket Client Connected');
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
        global.livePrices[stream.slice(0, -13)].a = price;
    };
    client.onclose = async function () {
        console.log('echo-protocol Connection Closed. Attempting to reconnect in 10 seconds...');
        openWs.all = 0;
        await sleep(10000)
        return updateBnb();
    };
    client.onerror = async function (error) {
        console.log("Connection Error: " + JSON.stringify(error).toString() + " Attempting to reconnect in 10 seconds...");
        openWs.all = 0;
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