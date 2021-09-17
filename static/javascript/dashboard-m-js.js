let dbData = window.allData
document.getElementById("merchantid").innerText = dbData.tunnelId;

if (localStorage.getItem("merchant-coin") === null) {
    localStorage.setItem('merchant-coin', 'BTC');
    window.location.reload();
} else if (localStorage.getItem("merchant-coin") === "BTC") {
    // do rando stuff 
    document.getElementById("changeVarCoin").style = "display:none";
    document.getElementById("merchantaddress").innerText = dbData.deposit;
    document.getElementById("merchantcoin").innerHTML = "BTC <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i>";
    document.getElementById("loadinggif").style = "display:none";
} else if (localStorage.getItem("merchant-coin") === "LTC") {
    // do more stupid stuff'
    document.getElementById("btcchangecoin").style = "display:none";

    if (dbData.ltc_deposit !== undefined && dbData.ltc_deposit !== "none") {
        document.getElementById("walletcontent").style = "display: none";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://chain.so/api/v2/get_address_balance/LTC/".concat(dbData.ltc_deposit));

        xhr.onload = function () {
            console.log(xhr.response);
            var response = JSON.parse(xhr.response);
            console.log(response);
            var text = "In wallet: " + response.data.confirmed_balance + " LTC | On the way: " + response.data.unconfirmed_balance + " LTC";
            document.getElementById("walletcontent").innerText = text;
            document.getElementById("walletcontent").style = "";
            document.getElementById("loadinggif").style = "display:none";
            document.getElementById("merchantaddress").innerText = dbData.ltc_deposit;
        };

        xhr.send();
    } else {
        document.getElementById("walletcontent").innerText = "No wallet connected!";
        document.getElementById("walletcontent").style = "";
        document.getElementById("loadinggif").style = "display:none";
        document.getElementById("merchantaddress").innerText = "No wallet connected";
    }

    document.getElementById("modalcoin").innerText = "Enter your new LTC address below";
    document.getElementById("changecoinbutton").innerText = "Change LTC";
    document.getElementById("merchantcoin").innerHTML = "LTC <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i>";
} else if (localStorage.getItem("merchant-coin") === "ETH") {
    document.getElementById("changeVarText").innerText = "Change your ETHEREUM deposit address"
    document.getElementById("btcchangecoin").style = "display:none";
    document.getElementById("modalcoin").innerText = "Enter your new ETH address below";
    document.getElementById("changecoinbutton").innerText = "Change ETH";
    var ethwallet = "No wallet connected yet!";

    if (!dbData.eth_deposit || dbData.eth_deposit === "none") {
        dbData.eth_deposit = "No ETH wallet connected";
        document.getElementById("loadinggif").style = "display:none";
    } else {
        document.getElementById("walletcontent").style = "display: none"; //getWalletData();

        var xhr1 = new XMLHttpRequest();
        xhr1.open('GET', "https://api.blockcypher.com/v1/eth/main/addrs/".concat(dbData.eth_deposit, "/balance"));
        xhr1.setRequestHeader('Content-Type', 'application/json');

        xhr1.onload = function () {
            var parsed = JSON.parse(xhr1.response);
            console.log(parsed);
            parsed.balance = (Math.round(1000 * Number(parsed.balance) / 1000000000000000000) / 1000).toString();
            parsed.unconfirmed_balance = (Math.round(1000 * Number(parsed.unconfirmed_balance) / 1000000000000000000) / 1000).toString();
            ethwallet = "In wallet: " + parsed.balance + " ETH On the way: " + parsed.unconfirmed_balance + " ETH";
            document.getElementById("walletcontent").innerText = ethwallet;
            document.getElementById("walletcontent").style = "";
            document.getElementById("loadinggif").style = "display:none";
            console.log(ethwallet);
        };

        xhr1.send(); // get random info about the wallet
    }

    document.getElementById("merchantaddress").innerText = dbData.eth_deposit;
    document.getElementById("walletcontent").innerText = ethwallet;
    document.getElementById("merchantcoin").innerHTML = "ETH <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i>";
} else if (localStorage.getItem("merchant-coin") === "XRP") {
    document.getElementById("changeVarText").innerText = "Change your RIPPLE deposit address"
    document.getElementById("btcchangecoin").style = "display:none";
    document.getElementById("modalcoin").innerText = "Enter your new XRP address below";
    document.getElementById("optionalXrp").innerHTML = '<input type="text" placeholder="tag (optional)" id="xrp_tag" name="name" class="u-border-1 u-border-grey-30 u-input u-input-rectangle" style="color: black" required="false"> '
    document.getElementById("changecoinbutton").innerText = "Change XRP";
    var ethwallet = "No wallet connected yet!";

    if (!dbData.xrp_deposit || dbData.xrp_deposit === "none") {
        dbData.xrp_deposit = "No XRP wallet connected";
        document.getElementById("loadinggif").style = "display:none";
    } else {
        document.getElementById("walletcontent").style = "display: none"; //getWalletData();
        window.fetch("https://www.coin-tunnel.ml/api/v2/explorer/xrp/address/" + dbData.xrp_deposit).then(function (result) {
            return result.json();
        }).then(function (result) {
            if (result.status === "failed") result.balance = "XRP account not activated! To activate, deposit 20 XRP or more. Sending any less will NOT work. Transactions will NOT work"
            else result.balance = result.data.xrpBalance;
            ethwallet = "In wallet: " + result.balance + " XRP";
            document.getElementById("walletcontent").innerText = ethwallet;
            document.getElementById("walletcontent").style = "";
            document.getElementById("loadinggif").style = "display:none";
        });
    }

    document.getElementById("merchantaddress").innerText = dbData.xrp_deposit;
    document.getElementById("walletcontent").innerText = ethwallet;
    document.getElementById("merchantcoin").innerHTML = " XRP <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i>";
    document.getElementById("merchantcoin").style["padding-left"] = "2px"
}

function changeToBtc() {
    localStorage.setItem('merchant-coin', 'BTC');
    window.location.reload();
}

function changeToLtc() {
    localStorage.setItem('merchant-coin', 'LTC');
    window.location.reload();
}

function changeToEth() {
    localStorage.setItem('merchant-coin', 'ETH');
    window.location.reload();
}
function changeToXrp() {
    localStorage.setItem('merchant-coin', 'XRP');
    window.location.reload();
}

function onLoad() {
    gapi.load('auth2', function () {
        gapi.auth2.init();
    });
}

function regenerate() {
    if (confirm("Are you sure you want to reset the key?")) { } else {
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/regenerate');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        console.log(xhr.response);

        if (xhr.response.toString().includes("key")) {
            alert("A new key has been generated: " + xhr.response.toString().slice(8, xhr.response.toString().length - 2));
            document.getElementById("showhere").innerHTML = "A new has been generated! This will only appear once for security reasons (We don't actually know your key due to hashing) Write it down quick! The new key is: " + xhr.response.toString().slice(8, xhr.response.toString().length - 2);
        } else {
            alert(xhr.response);
        }
    };

    xhr.send(JSON.stringify({
        "hello": "hellow"
    }));
}

function verficationKey() {
    var value = document.getElementById("name-558c").value;
    if (value.length < 10) return alert("Verification string must be longer than 10 characters!");
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/changeKey');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        console.log(xhr.response);

        if (xhr.response.toString().includes("key")) {
            alert("A new verification string has been set: " + xhr.response.toString().slice(8, xhr.response.toString().length - 2));
        } else {
            alert(xhr.response);
        }
    };

    xhr.send(JSON.stringify({
        "key": value
    }));
}

function changeLtc(coin) {
    var currentcoin;
    var address

    if (coin){
        currentcoin = coin;
        address = document.getElementById(coin.toLowerCase()+"_address_field").value;
    }
    else {
        currentcoin = localStorage.getItem("merchant-coin");
        address = document.getElementById("ltc_address_field").value;
    }

    var cointable = {
        BTC: "Bitcoin",
        LTC: "Litecoin",
        ETH: "Ethereum",
        XRP: "Ripple"
    };
    var lowercase = {
        BTC: "btc",
        LTC: "ltc",
        ETH: "eth",
        XRP: "xrp"
    };

    if (address === "") {
        document.getElementById("error-text").innerHTML = "That was an invalid ".concat(cointable[currentcoin], " address");
        document.getElementById("error-ltc").checked = true;
    } else {
        //do dumb stuff
        var xhr = new XMLHttpRequest();
        xhr.open('POST', "/operations/change-".concat(lowercase[currentcoin], "-m"));
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function () {
            console.log(xhr.response);

            if (xhr.response.toString().includes("good")) {
                document.getElementById("error-text").innerHTML = "A new ".concat(currentcoin, " payout address has been set!");
                document.getElementById("error-ltc").checked = true;
            } else {
                document.getElementById("error-text").innerHTML = xhr.response.toString();
                document.getElementById("error-ltc").checked = true;
            }
        };
        var xrpSpecialTag;
        if (!document.getElementById("xrp_tag")) xrpSpecialTag = undefined;
        else xrpSpecialTag = document.getElementById("xrp_tag").value;

        xhr.send(JSON.stringify({
            address: address,
            tag: xrpSpecialTag
        }));
    }
}

function sleep(ms) {
    return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
    });
}

function getWalletData(address) {
    var xhr1 = new XMLHttpRequest();
    xhr1.open('GET', "https://blockchair.com/ethereum/address/".concat(address));
    xhr1.setRequestHeader('Content-Type', 'application/json');

    xhr1.onload = function () {
        console.log(xhr1.response);
        var x = xhr1.response;
        var y = x.search("<span>Balance</span>");
        x = x.slice(y);
        y = x.search("<span>ERC-20 Token balance</span>");
        x = x.slice(0, y);
        x = x.slice(0, 60);
        var num = x.replace(/^\D+|\D.*$/g, "");
        console.log(num);
        y = x.search(num);
        x = x.slice(y + 10);
        console.log(x);
        var num2 = x.replace(/^\D+|\D.*$/g, "");
        console.log(num2);
        var entirenum = Number(num + "." + num2);
        console.log(entirenum);
        ethwallet = "In wallet: " + entirenum.toString() + " On the way: " + xhr1.response.unconfirmed_balance;
        document.getElementById("walletcontent").innerText = ethwallet;
        console.log(ethwallet);
    };

    xhr1.send();
}