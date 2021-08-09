const fs = require("file-system");
const WebSocketClient = require("websocket").client;
const fetch = require("node-fetch");
const secrets = require("../secret.json");
const rootDir = __dirname;
const coins = require("./config").coins;
main();
// HEIGHT IS TIME!!!
// UPDATE FUNCTION ISN"T WORKING! (fixed I think)
var syncing = false;
async function main() {
    var client = new WebSocketClient();
    client.connect('wss://www.coin-tunnel.ml/api/trading/v1/ws', 'echo-protocol');
    client.on("connect", async function (connection) {
        console.log('WebSocket Client Connected');

        for (let i = 0; i < coins.length; i++) {
            await fetch(`http://admin:${secrets.secret}@127.0.0.1:5984/${coins[i].toLowerCase()}`, {
                method: "PUT"
            });
            let meta = await fetch(`http://admin:${secrets.secret}@127.0.0.1:5984/${coins[i].toLowerCase()}/meta`);
            meta = await meta.json();
            if (meta.error === "not_found") {
                let result = await fetch(`http://admin:${secrets.secret}@127.0.0.1:5984/${coins[i].toLowerCase()}/meta`, {
                    method: "PUT",
                    body: JSON.stringify({
                        height: 0
                    })
                });
                console.log(await result.json())
            }
        }
        // going to be working on mainly BTC rn
        connection.send(JSON.stringify({ request: "height", coin: "btc" }));

        connection.on("message", async function (e) {
            let data = JSON.parse(e.utf8Data);
            console.log(data)
            if (data.type === "response") {
                data.type;
                if (data.responseTo === "height") {
                    data.responseTo;
                    data.meta.coin;
                    data.data;
                    let globalHeight = data.data;
                    globalHeight = Number(globalHeight);
                    let localHeight = await getDocument(data.meta.coin, "meta");
                    localHeight = localHeight.height;
                    if (globalHeight > localHeight) {
                        syncing = true;
                        console.log(`${data.meta.coin}'S DATA IS OUTDATED! SYNCING IN PROGRESS. LOCAL HEIGHT IS ${localHeight}, REMOTE HEIGHT IS ${globalHeight}`);
                        connection.send(JSON.stringify({ request: "specific-height", coin: data.meta.coin, height: localHeight, nextBlock: true }));
                    } else {
                        syncing = false;
                    }
                } else if (data.responseTo === "specific-height") {
                    data.responseTo;
                    data.meta.coin;
                    data.meta.time;
                    data.data; // a number (that's it!)
                    //updating meta height info
                    let currentMeta = await getDocument(data.meta.coin.toLowerCase(), "meta");
                    await updateDocument(data.meta.coin.toLowerCase(), "meta", {
                        height: data.meta.time
                    })
                    //adding data (100,000 blocks per doc)
                    let table = await getDocument(data.meta.coin.toLowerCase(), "table");
                    if (table.error === "not_found") {
                        await createDocument(data.meta.coin.toLowerCase(), "table", {
                            //example: _6000000000: "idhere" // would be all numbers from 0 to 6000000000 (inclusive for both)
                            //example: _12000000000: "idhere" // would be all numbers from 6000000001 to 12000000000 (inclusive for both)
                        })
                    }

                    table = await getDocument(data.meta.coin.toLowerCase(), "table");
                    let writeHeight = Number(data.meta.time);
                    let cell = table[(Math.ceil(writeHeight / 6000000000) * 6000000000).toString()];
                    if (cell) {
                        await updateDocument(data.meta.coin.toLowerCase(), cell, { [data.meta.time]: data.data });
                    } else {
                        let newChunk = await createDocument(data.meta.coin.toLowerCase(), null, { [data.meta.time]: data.data })
                        await updateDocument(data.meta.coin.toLowerCase(), "table", {
                            [(Math.ceil(writeHeight / 6000000000) * 6000000000).toString()]: newChunk._id
                        })
                    }
                    // starting the second recursive request
                    connection.send(JSON.stringify({ request: "height", coin: data.meta.coin }));
                }
            } else if (data.type === "newblock") {
                if (syncing === true) return;

                await updateDocument(data.meta.coin.toLowerCase(), "meta", {
                    height: data.meta.time
                })
                //adding data (6000000000 blocks per doc)
                let table = await getDocument(data.meta.coin.toLowerCase(), "table");
                if (table.error === "not_found") {
                    let datax = await createDocument(data.meta.coin.toLowerCase(), "table", {
                        //example: 6000000000: "idhere" // would be all numbers from 0 to 6000000000 (inclusive for both)
                        //example: 12000000000: "idhere" // would be all numbers from 6000000001 to 12000000000 (inclusive for both)
                    })
                    console.log("Data", datax)
                }
                table = await getDocument(data.meta.coin.toLowerCase(), "table");
                console.log("TABLE", table)
                let writeHeight = Number(data.meta.time);
                let cell = table[(Math.ceil(writeHeight / 6000000000) * 6000000000).toString()];
                if (cell) {
                    await updateDocument(data.meta.coin.toLowerCase(), cell, { [data.meta.time]: data.data });
                } else {
                    let newChunk = await createDocument(data.meta.coin.toLowerCase(), null, { [data.meta.time]: data.data });
                    console.log("NEW CHUNK", newChunk)
                    let x = await updateDocument(data.meta.coin.toLowerCase(), "table", {
                        [(Math.ceil(writeHeight / 6000000000) * 6000000000).toString()]: newChunk.id
                    })
                }
            }
        })
    })
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function getDocument(db, id) {
    let document = await fetch(`http://admin:${secrets.secret}@127.0.0.1:5984/${db}/${id}`);
    document = await document.json();
    return document;
};
async function updateDocument(db, id, data) {
    await sleep(100)
    let current = await fetch(`http://admin:${secrets.secret}@127.0.0.1:5984/${db}/${id}`);
    current = await current.json();
    delete current._id;
    let sendData = current;
    Object.entries(data).forEach(([key, value]) => {
        sendData[key] = value;
    })
    await sleep(100)
    let results = await fetch(`http://admin:${secrets.secret}@127.0.0.1:5984/${db}/${id}`, {
        method: "PUT",
        body: JSON.stringify(sendData),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    results = await results.json();
    if (results.error === "conflict") {
        throw ("Document conflict error!")
    }
    return results;
}
async function createDocument(db, id, data) {
    if (id !== null) id = "/" + id.toString();
    else {
        id = await fetch("http://127.0.0.1:5984/_uuids");
        id = await id.json();
        id = id.uuids[0];
        id = "/" + id.toString();
    }
    let results = await fetch(`http://admin:${secrets.secret}@127.0.0.1:5984/${db}${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
    results = await results.json();
    return results;
}