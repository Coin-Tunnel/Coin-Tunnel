
const router = require('express').Router();
var mongoclient, checkUser, updateDocumentSet, createListing, swap, updateUser, createUser, checkStuff, sleep, secrets, bitcore, bitcoin, sochain_network, BitcoinjsNetwork, nodemailer, requestIp, createHmac, apiLimiter, longLimiter, guiLimiter;
var crypto, rateLimit, axios, fetch, FormData, bodyParser, clientId, clientSecret, scopes, redirectUri, sendBitcoin, sendBitcoinIncludeFee, getTxFee, checkTxFee, generateKeyPairs, encrypt, decrypt, makeid, secretKey, iv;
const algorithm = 'aes-256-ctr';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var activeNodes = 0;

sleep(1000).then(thing => {
    router.ws('/', async (ws, req) => {
        activeNodes = activeNodes + 1;
        ws.on('message', async msg => {
            let message = JSON.parse(msg);
            if (message.request === "height") {
                // for the time being, just send block height 0
                let height = 0;
                ws.send(JSON.stringify({ type: "response", responseTo: "height", meta: { coin: message.coin }, data: height }))
            } else if (message.request === "specific-height") {
                if (message.nextBlock === true) {
                    // do things
                }
            }
        })
        // sync at the 0'th second of the minute
        var now = new Date();
        var millisTill10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0) - now;
        if (millisTill10 < 0) {
            millisTill10 += 60000; // it's after, try again next minute.
        }
        setTimeout(recursive, millisTill10);
        function recursive() {
            let time = Date.now();
            ws.send(JSON.stringify({
                meta: {
                    time: time,
                    coin: "btc"
                },
                data: Number(global.livePrices.btc.a)
            }))
            setTimeout(recursive, 60000)
        }
        ws.on('close', () => {
            console.log("connection closed")
            activeNodes = activeNodes - 1;
            return;
        })

    })

})


module.exports = function (var1) {

    secrets = var1.secrets;
    bitcore = var1.bitcore;
    bitcoin = var1.bitcoin;
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
