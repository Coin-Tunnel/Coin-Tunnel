showData(); //let localStorage = window.localStorage;

function reveal() {
    var xhr = new XMLHttpRequest();
    var currentcoin = localStorage.getItem('buyercoin');
    xhr.open('POST', '/operations/reveal-' + currentcoin);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        document.getElementById("privatekey").innerHTML = xhr.response;
    }; //document.getElementById("custId").value = googleUser.getAuthResponse().id_token;
    //var wait=setTimeout("document.hidden.submit();",2000);


    xhr.send();
}

function onLoad() {
    gapi.load('auth2', function () {
        gapi.auth2.init();
    });
}

function gotoconnect() {
    window.location.href = "/welcome";
}

function withdraw() {
    var currentcoin = localStorage.getItem("buyercoin");
    var address = document.getElementById("text-25b8").value;
    var tag;
    if (currentcoin === "xrp") tag = document.getElementById("text-25b9").value;
    var amount = document.getElementById("text-e0a1").value;

    if (currentcoin === "eth") {
        // do some extra validation
        var maxAmount = document.getElementById("maxwithdraw").innerText;
        if (maxAmount < amount) return alert("You don't have enough funds for this transaction!");
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/withdraw/' + currentcoin);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        console.log(xhr.response);

        if (xhr.response.includes("good")) {
            alert("An email has been sent to the connected email address (Check your spam folder)");
            window.location.href = "/dashboard-b";
        } else {
            alert(xhr.response);
        }
    }; //document.getElementById("custId").value = googleUser.getAuthResponse().id_token;
    //var wait=setTimeout("document.hidden.submit();",2000);


    xhr.send(JSON.stringify({
        address: address,
        amount: amount,
        tag: tag
    }));
}

function change() {
    var currentcoin = localStorage.getItem("buyercoin");

    if (confirm('Are you sure you want to submit a request to change your wallet to a ' + currentcoin + ' cloud wallet?')) {
        // Save it!
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/operations/change-' + currentcoin);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function () {
            console.log(xhr.response);

            if (xhr.response.includes("good")) {
                alert("An email has been sent to the connected email address (check your spam folder)");
                window.location.reload();
            } else {
                alert(xhr.response);
            }
        }; //document.getElementById("custId").value = googleUser.getAuthResponse().id_token;
        //var wait=setTimeout("document.hidden.submit();",2000);


        xhr.send(JSON.stringify({
            hello: "world"
        }));
    } else {
        // Do nothing!
        return window.location.href = "#";
    }
} //////////////////


function deleteUser() {
    var email = document.getElementById("name-6797").value;
    if (email === "") return;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/delete-b');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        console.log(xhr.response);

        if (xhr.response.includes("good")) {
            alert("An email has been sent to the connected email address (check your spam folder)");
            window.location.href = "/dashboard-b";
        } else {
            alert(xhr.response);
        }
    }; //document.getElementById("custId").value = googleUser.getAuthResponse().id_token;
    //var wait=setTimeout("document.hidden.submit();",2000);


    xhr.send(JSON.stringify({
        email: email
    }));
}

function regenerate() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/regenerateID");
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        console.log(xhr.response);

        if (xhr.response.includes("good")) {
            alert("An email has been sent to the connected email address (check your spam folder)");
            window.location.href = "/dashboard-b";
        } else {
            alert(xhr.response);
        }
    };

    xhr.send(JSON.stringify({
        thing: "thing"
    }));
}

function changetobtc() {
    document.documentElement.style.overflow = "hidden";
    document.getElementById("sec-22810d").classList.add("open");
    document.getElementById("8ewo21").style.width = "100%";
    document.getElementById("eidk30").style.display = "block";
    var coin = localStorage.getItem('buyercoin');
    localStorage.setItem('buyercoin', 'btc');
    showData();
    window.location.reload();
}

function changetoltc() {
    document.getElementById("sec-22810d").classList.remove("open");
    document.documentElement.style.overflow = "";
    document.getElementById("8ewo21").style.width = "0%";
    document.getElementById("eidk30").style.display = "none";
    var coin = localStorage.getItem('buyercoin');
    localStorage.setItem('buyercoin', 'ltc');
    showData(); //window.location.reload();
}

function changetoeth() {
    document.getElementById("sec-22810d").classList.remove("open");
    document.documentElement.style.overflow = "";
    document.getElementById("8ewo21").style.width = "0%";
    document.getElementById("eidk30").style.display = "none";
    var coin = localStorage.getItem('buyercoin');
    localStorage.setItem('buyercoin', 'eth');
    showData(); //window.location.reload();
}

function changetoxrp() {
    document.getElementById("sec-22810d").classList.remove("open");
    document.documentElement.style.overflow = "";
    document.getElementById("8ewo21").style.width = "0%";
    document.getElementById("eidk30").style.display = "none";
    var coin = localStorage.getItem('buyercoin');
    localStorage.setItem('buyercoin', 'xrp');
    showData();
}

function showData() {
    var coin = localStorage.getItem('buyercoin');
    console.log(allData);

    if (coin === "eth") {
        var getMaxAmountEth = function getMaxAmountEth() {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://ethgasstation.info/json/ethgasAPI.json");

            xhr.onload = function () {
                var response = JSON.parse(xhr.response);
                console.log(response);
                var low = response.safeLow / 10;
                var maxGasSpent = 22000 * low * 1000000000; //in Wei

                var maxEthSpent = "0.00037";
                var ethInWallet = document.getElementById("amountinwallet").textContent;
                ethInWallet = ethInWallet.slice(18, ethInWallet.length - 14);
                ethInWallet = ethInWallet.replace(/^\D+|\D+$/g, "");
                ethInWallet = Number(ethInWallet);
                console.log(maxEthSpent);
                if (ethInWallet - maxEthSpent < 0) document.getElementsByClassName("amounttowithdraweths")[0].innerHTML = "Amount | Max withdraw in ETH: " + "<a id=\"maxwithdraw\" style=\"color: #478AC9\" onclick=\"addvalue(false)\">0</a>" + " | Min withdraw in ETH: " + "<a id=\"minwithdraw\" style=\"color: #478AC9\" onclick=\"addvalue(true)\">".concat(maxEthSpent, "</a>"); else document.getElementsByClassName("amounttowithdraweths")[0].innerHTML = "Amount | Max withdraw in ETH: " + "<a id=\"maxwithdraw\" style=\"color: #478AC9\" onclick=\"addvalue(false)\">".concat(ethInWallet - maxEthSpent, "</a>") + " | Min withdraw in ETH: " + "<a id=\"minwithdraw\" style=\"color: #478AC9\" onclick=\"addvalue(true)\">".concat(maxEthSpent, "</a>");
            };

            xhr.send();
        };

        document.getElementById("sec-9794").innerHTML = "\n        <section class=\"u-align-center u-clearfix u-palette-2-light-2 u-section-4\" id=\"sec-9794\">\n          <div class=\"u-clearfix u-sheet u-sheet-1\">\n            <h1 class=\"u-text u-text-default u-text-palette-2-base u-text-1\">DANGER ZONE</h1>\n            <h4 class=\"u-text u-text-default u-text-palette-2-base u-text-2\">Currently we only support CLOUD wallets! If you already have a ETHEREUM cloud wallet, making another one will destroy your funds! If you don't have a ETHEREUM cloud wallet, create one!\n            </h4>\n            <div class=\"u-form u-form-1\">\n                <div class=\"u-form-group u-form-select u-form-group-1\">\n                  <label for=\"select-a11b\" class=\"u-form-control-hidden u-label\">Select</label>\n                </div>\n                <div class=\"u-align-left u-form-group u-form-submit u-form-group-2\">\n                  <a href=\"#\" class=\"u-btn u-btn-submit u-button-style\" onclick=\"change()\">Change (A confirmation email will be sent to you)</a>\n                  <input type=\"submit\" value=\"submit\" class=\"u-form-control-hidden\">\n                </div>\n            </div>\n            <div class=\"u-form u-form-3\">\n              <form action=\"#\" method=\"POST\" class=\"u-clearfix u-form-spacing-10 u-form-vertical u-inner-form\" style=\"padding: 10px\" source=\"custom\" name=\"form-1\">\n                <input type=\"hidden\" id=\"siteId\" name=\"siteId\" value=\"36048516\">\n                <input type=\"hidden\" id=\"pageId\" name=\"pageId\" value=\"71715059\">\n                <div class=\"u-form-group u-form-partition-factor-2 u-form-group-5\">\n                  <label for=\"text-25b8\" class=\"u-label\">Withdrawal address - If you put an incorrect address, your funds will not come back!</label>\n                  <input type=\"text\" id=\"text-25b8\" name=\"deposit\"class=\"u-border-1 u-border-grey-30 u-input u-input-rectangle u-white\" placeholder=\"(ETH ONLY)\">\n                </div>\n                <div class=\"u-form-group u-form-partition-factor-2 u-form-group-6\">\n                  <label for=\"text-e0a1\" class=\"u-label amounttowithdraweths\">Amount to withdraw</label>\n                  <input type=\"text\" id=\"text-e0a1\" name=\"amount\" class=\"u-border-1 u-border-grey-30 u-input u-input-rectangle u-white\" placeholder=\"(IN ETH)\">\n                </div>\n                <div class=\"u-align-left u-form-group u-form-submit\">\n                  <a href=\"#\" onclick=\"withdraw()\" class=\"u-btn u-btn-submit u-button-style\">Withdraw - A confirmation email will be sent to you!</a>\n                  <input type=\"submit\" value=\"submit\" class=\"u-form-control-hidden\">\n                </div>\n              </form>\n            </div>\n          </div>\n        </section>\n        ";
        document.getElementById("privatekey").innerHTML = "<a onclick='reveal()' style='background: #3d85c6; border-radius: 13px; width: 187px; height: 44px; color:  #ffffff; display: inline-block; font: normal bold 19px/44px \"Open Sans\", sans-serif; text-align: center;'>Click to reveal</a>"; //alert ("This coin is still in BETA. Many of the payment features will NOT work. The wallet is operational, but nothing else is currently.")

        document.getElementById("coinimagepayment").src = "https://ethereum.org/static/4d030a46f561e5c754cabfc1a97528ff/3bf79/impact_transparent.png";

        if (allData.eth.address.toLowerCase().includes("cloud wallet setup!")) {
            document.getElementById("amountinwallet").innerText = allData.eth.amount;
            document.getElementById("usdequivalent").innerText = "N/A"; // this is if the stupid buyer doesn't have a stupid wallet set up.
        } else {
            document.getElementById("amountinwallet").style = "display: none;";
            document.getElementById("usdequivalent").style = "display: none;";
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://api.blockcypher.com/v1/eth/main/addrs/" + allData.eth.address + "/balance");

            xhr.onload = function () {
                var response = JSON.parse(xhr.response);
                response.balance = (Math.round(1000000 * Number(response.balance) / 1000000000000000000) / 1000000).toString();
                response.unconfirmed_balance = (Math.round(1000000 * Number(response.unconfirmed_balance) / 1000000000000000000) / 1000000).toString();
                var text = 'Amount in wallet: ' + response.balance + ' ETH | On the way: ' + response.unconfirmed_balance + 'ETH';
                document.getElementById("amountinwallet").innerText = text;
                document.getElementsByClassName("loadingimage")[0].style = "display: none;";
                document.getElementsByClassName("loadingimage")[1].style = "display: none;";
                document.getElementById("usdequivalent").innerHTML = (Number(allData.eth.price) * response.balance).toString() + " USD";
                document.getElementById("amountinwallet").style = "";
                document.getElementById("usdequivalent").style = "";
                getMaxAmountEth();
            };

            xhr.send();
        }

        document.getElementById("coinbanner").style.backgroundImage = "";
        document.getElementById("accounttype").innerHTML = allData.eth.type;
        document.getElementById("depositaddress").innerHTML = allData.eth.address;
        document.getElementById("cryptopricedisplay").innerText = allData.eth.price + " USD";
        document.getElementById("walletaddressspan").innerText = allData.eth.address;
        var coinshow = document.getElementsByClassName("u-font-oswald");

        for (var i = 0; i < coinshow.length; i++) {
            document.getElementsByClassName("u-font-oswald")[i].innerHTML = "ETH";
        }

        document.getElementById("coinimage").innerHTML = "\n        <a href=\"https://ethereum.org\" target=\"_blank\">\n            <img id=\"doge\" src=\"/images/ethereum.png\" width=\"125px\" height=\"200px\">\n        </a>";
        document.getElementById("inwallet").innerText = "Ethereum in wallet";
        document.getElementById("cryptoprice").innerText = "Ethereum price";
        document.getElementById("cryptoaddress").innerText = "Ethereum deposit address";
        document.getElementById("ethereumindicator1").style.color = "#478AC9";
        document.getElementById("ethereumindicator2").style.color = "#478AC9";
        document.getElementById("litecoinindicator1").style.color = "#CCC9C9";
        document.getElementById("litecoinindicator2").style.color = "#CCC9C9";
        document.getElementById("bitcoinindicator1").style.color = "#CCC9C9";
        document.getElementById("bitcoinindicator2").style.color = "#CCC9C9";
        document.getElementById("rippleindicator1").style.color = "#CCC9C9";
        document.getElementById("rippleindicator2").style.color = "#CCC9C9";
    } else if (coin === "ltc") {
        document.getElementById("privatekey").innerHTML = "<a onclick='reveal()' style='background: #3d85c6; border-radius: 13px; width: 187px; height: 44px; color:  #ffffff; display: inline-block; font: normal bold 19px/44px \"Open Sans\", sans-serif; text-align: center;'>Click to reveal</a>";
        document.getElementById("coinimagepayment").src = "https://litecoin.org/img/litecoin.svg";
        document.getElementById("coinimagepayment").style.width = "80px";
        document.getElementById("accounttype").innerHTML = allData.ltc.type;
        document.getElementById("depositaddress").innerHTML = allData.ltc.address; //document.getElementById("amountinwallet").innerText = allData.ltc.amount;

        document.getElementById("cryptopricedisplay").innerText = allData.ltc.price + " USD";
        document.getElementById("walletaddressspan").innerText = allData.ltc.address; //document.getElementById("usdequivalent").innerText = allData.ltc.usd + " USD"

        document.getElementById("litecoinindicator1").style.color = "#478AC9";
        document.getElementById("litecoinindicator2").style.color = "#478AC9";
        document.getElementById("bitcoinindicator1").style.color = "#CCC9C9";
        document.getElementById("bitcoinindicator2").style.color = "#CCC9C9";
        document.getElementById("ethereumindicator1").style.color = "#CCC9C9";
        document.getElementById("ethereumindicator2").style.color = "#CCC9C9";
        document.getElementById("rippleindicator1").style.color = "#CCC9C9";
        document.getElementById("rippleindicator2").style.color = "#CCC9C9";

        var _coinshow = document.getElementsByClassName("u-font-oswald");

        for (var i = 0; i < _coinshow.length; i++) {
            document.getElementsByClassName("u-font-oswald")[i].innerHTML = "LTC";
        }

        document.getElementById("coinimage").innerHTML = "\n        <a href=\"https://litecoin.org/\" target=\"_blank\">\n            <img id=\"doge\" src=\"/images/litecoin.png\" width=\"150px\" height=\"150px\">\n        </a>";
        document.getElementById("inwallet").innerText = "Litecoin in wallet";
        document.getElementById("cryptoprice").innerText = "Litecoin price";
        document.getElementById("cryptoaddress").innerText = "Litecoin deposit address";

        if (allData.ltc.address.toLowerCase().includes("cloud wallet setup!")) {
            document.getElementById("amountinwallet").innerText = allData.ltc.amount;
            document.getElementById("usdequivalent").innerText = "N/A"; // this is if the stupid buyer doesn't have a stupid wallet set up.
        } else {
            document.getElementById("privatekey").innerHTML = "<a onclick='reveal()' style='background: #3d85c6; border-radius: 13px; width: 187px; height: 44px; color:  #ffffff; display: inline-block; font: normal bold 19px/44px \"Open Sans\", sans-serif; text-align: center;'>Click to reveal</a>";
            document.getElementById("amountinwallet").style = "display: none;";
            document.getElementById("usdequivalent").style = "display: none;";
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://sochain.com/api/v2/get_address_balance/LTC/".concat(allData.ltc.address));

            xhr.onload = function () {
                var response = JSON.parse(xhr.response); //response.balance = (Math.round(1000*Number(response.balance)/1000000000000000000)/1000).toString();
                //response.unconfirmed_balance = (Math.round(1000*Number(response.unconfirmed_balance)/1000000000000000000)/1000).toString();

                var text = "Amount in wallet: ".concat(response.data.confirmed_balance, " LTC | On the way: ").concat(response.data.unconfirmed_balance, " LTC");
                document.getElementById("amountinwallet").innerText = text;
                document.getElementsByClassName("loadingimage")[0].style = "display: none;";
                document.getElementsByClassName("loadingimage")[1].style = "display: none;";
                document.getElementById("usdequivalent").innerHTML = (Number(allData.ltc.price) * response.data.confirmed_balance).toString() + " USD";
                document.getElementById("amountinwallet").style = "";
                document.getElementById("usdequivalent").style = "";
            };

            xhr.send();
        }

        document.getElementById("sec-9794").innerHTML = "\n        <section class=\"u-align-center u-clearfix u-palette-2-light-2 u-section-4\" id=\"sec-9794\">\n          <div class=\"u-clearfix u-sheet u-sheet-1\">\n            <h1 class=\"u-text u-text-default u-text-palette-2-base u-text-1\">DANGER ZONE</h1>\n            <h4 class=\"u-text u-text-default u-text-palette-2-base u-text-2\">Currently we only support CLOUD wallets! If you already have a LITECOIN cloud wallet, making another one will destroy your funds! If you don't have a LITECOIN cloud wallet, create one!\n            </h4>\n            <div class=\"u-form u-form-1\">\n                <div class=\"u-form-group u-form-select u-form-group-1\">\n                  <label for=\"select-a11b\" class=\"u-form-control-hidden u-label\">Select</label>\n                </div>\n                <div class=\"u-align-left u-form-group u-form-submit u-form-group-2\">\n                  <a href=\"#\" class=\"u-btn u-btn-submit u-button-style\" onclick=\"change()\">Change (A confirmation email will be sent to you)</a>\n                  <input type=\"submit\" value=\"submit\" class=\"u-form-control-hidden\">\n                </div>\n            </div>\n            <div class=\"u-form u-form-3\">\n              <form action=\"#\" method=\"POST\" class=\"u-clearfix u-form-spacing-10 u-form-vertical u-inner-form\" style=\"padding: 10px\" source=\"custom\" name=\"form-1\">\n                <input type=\"hidden\" id=\"siteId\" name=\"siteId\" value=\"36048516\">\n                <input type=\"hidden\" id=\"pageId\" name=\"pageId\" value=\"71715059\">\n                <div class=\"u-form-group u-form-partition-factor-2 u-form-group-5\">\n                  <label for=\"text-25b8\" class=\"u-label\">Withdrawal address - If you put an incorrect address, your funds will not come back!</label>\n                  <input type=\"text\" id=\"text-25b8\" name=\"deposit\"class=\"u-border-1 u-border-grey-30 u-input u-input-rectangle u-white\" placeholder=\"(LTC ONLY)\">\n                </div>\n                <div class=\"u-form-group u-form-partition-factor-2 u-form-group-6\">\n                  <label for=\"text-e0a1\" class=\"u-label\">Amount to withdraw</label>\n                  <input type=\"text\" id=\"text-e0a1\" name=\"amount\" class=\"u-border-1 u-border-grey-30 u-input u-input-rectangle u-white\" placeholder=\"(IN LTC)\">\n                </div>\n                <div class=\"u-align-left u-form-group u-form-submit\">\n                  <a href=\"#\" onclick=\"withdraw()\" class=\"u-btn u-btn-submit u-button-style\">Withdraw - A confirmation email will be sent to you!</a>\n                  <input type=\"submit\" value=\"submit\" class=\"u-form-control-hidden\">\n                </div>\n              </form>\n            </div>\n          </div>\n        </section>\n        ";
    } else if (coin === "xrp") {
        document.getElementById("privatekey").innerHTML = "<a onclick='reveal()' style='background: #3d85c6; border-radius: 13px; width: 187px; height: 44px; color:  #ffffff; display: inline-block; font: normal bold 19px/44px \"Open Sans\", sans-serif; text-align: center;'>Click to reveal</a>";
        document.getElementById("coinimagepayment").src = "https://cdn.freelogovectors.net/wp-content/uploads/2021/01/xrp-icon-freelogovectors.net_.png";
        document.getElementById("coinimagepayment").style.width = "80px";
        document.getElementById("accounttype").innerHTML = allData.xrp.type;
        document.getElementById("depositaddress").innerHTML = allData.xrp.address; //document.getElementById("amountinwallet").innerText = allData.ltc.amount;

        document.getElementById("cryptopricedisplay").innerText = allData.xrp.price + " USD";
        document.getElementById("walletaddressspan").innerText = allData.xrp.address; //document.getElementById("usdequivalent").innerText = allData.ltc.usd + " USD"

        document.getElementById("litecoinindicator1").style.color = "#CCC9C9";
        document.getElementById("litecoinindicator2").style.color = "#CCC9C9";
        document.getElementById("bitcoinindicator1").style.color = "#CCC9C9";
        document.getElementById("bitcoinindicator2").style.color = "#CCC9C9";
        document.getElementById("ethereumindicator1").style.color = "#CCC9C9";
        document.getElementById("ethereumindicator2").style.color = "#CCC9C9";
        document.getElementById("rippleindicator1").style.color = "#478AC9";
        document.getElementById("rippleindicator2").style.color = "#478AC9";

        var _coinshow2 = document.getElementsByClassName("u-font-oswald");

        for (var i = 0; i < _coinshow2.length; i++) {
            document.getElementsByClassName("u-font-oswald")[i].innerHTML = "XRP";
        }

        document.getElementById("coinimage").innerHTML = "\n        <a href=\"https://xrpl.org/\" target=\"_blank\">\n            <img id=\"doge\" src=\"https://seeklogo.com/images/R/ripple-xrp-logo-E97D62205B-seeklogo.com.png\" width=\"150px\" height=\"150px\">\n        </a>";
        document.getElementById("inwallet").innerText = "Ripple in wallet";
        document.getElementById("cryptoprice").innerText = "Ripple price";
        document.getElementById("cryptoaddress").innerText = "Ripple deposit address";

        if (allData.xrp.address.toLowerCase().includes("cloud wallet setup!")) {
            document.getElementById("amountinwallet").innerText = allData.xrp.amount;
            document.getElementById("usdequivalent").innerText = "N/A";
            document.getElementsByClassName("loadingimage")[0].style = "display: none;";
            document.getElementsByClassName("loadingimage")[1].style = "display: none;"; // this is if the stupid buyer doesn't have a stupid wallet set up.
        } else {
            document.getElementById("privatekey").innerHTML = "<a onclick='reveal()' style='background: #3d85c6; border-radius: 13px; width: 187px; height: 44px; color:  #ffffff; display: inline-block; font: normal bold 19px/44px \"Open Sans\", sans-serif; text-align: center;'>Click to reveal</a>";
            document.getElementById("amountinwallet").style = "display: none;";
            document.getElementById("usdequivalent").style = "display: none;";
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://www.coin-tunnel.ml/api/v2/explorer/xrp/address/".concat(allData.xrp.address));

            xhr.onload = function () {
                var response = JSON.parse(xhr.response); //response.balance = (Math.round(1000*Number(response.balance)/1000000000000000000)/1000).toString();
                //response.unconfirmed_balance = (Math.round(1000*Number(response.unconfirmed_balance)/1000000000000000000)/1000).toString();

                var text;
                var text2;

                if (response.status === "failed") {
                    text = "The XRP ledger requires you to make a 20 XRP transaction to activate the wallet. (These funds will NOT be lost after deposit)";
                    text2 = "0 USD";
                } else {
                    text2 = (Number(allData.xrp.price) * Number(response.data.xrpBalance)).toString() + " USD";
                    text = "Amount in wallet: "+response.data.xrpBalance+ " XRP <br><br> Withdrawable: "+(Math.floor(Number((response.data.xrpBalance)-20) * 1000000) / 1000000).toString();
                }

                document.getElementById("amountinwallet").innerHTML = text;
                document.getElementsByClassName("loadingimage")[0].style = "display: none;";
                document.getElementsByClassName("loadingimage")[1].style = "display: none;";
                document.getElementById("usdequivalent").innerHTML = text2;
                document.getElementById("amountinwallet").style = "";
                document.getElementById("usdequivalent").style = "";
            };

            xhr.send();
        }

        document.getElementById("sec-9794").innerHTML = "\n        <section class=\"u-align-center u-clearfix u-palette-2-light-2 u-section-4\" id=\"sec-9794\">\n          <div class=\"u-clearfix u-sheet u-sheet-1\">\n            <h1 class=\"u-text u-text-default u-text-palette-2-base u-text-1\">DANGER ZONE</h1>\n            <h4 class=\"u-text u-text-default u-text-palette-2-base u-text-2\">Currently we only support CLOUD wallets! If you already have a RIPPLE cloud wallet, making another one will destroy your funds! If you don't have a LITECOIN cloud wallet, create one!\n            </h4>\n            <div class=\"u-form u-form-1\">\n                <div class=\"u-form-group u-form-select u-form-group-1\">\n                  <label for=\"select-a11b\" class=\"u-form-control-hidden u-label\">Select</label>\n                </div>\n                <div class=\"u-align-left u-form-group u-form-submit u-form-group-2\">\n                  <a href=\"#\" class=\"u-btn u-btn-submit u-button-style\" onclick=\"change()\">Change (A confirmation email will be sent to you)</a>\n                  <input type=\"submit\" value=\"submit\" class=\"u-form-control-hidden\">\n                </div>\n            </div>\n            <div class=\"u-form u-form-3\">\n              <form action=\"#\" method=\"POST\" class=\"u-clearfix u-form-spacing-10 u-form-vertical u-inner-form\" style=\"padding: 10px\" source=\"custom\" name=\"form-1\">\n                <input type=\"hidden\" id=\"siteId\" name=\"siteId\" value=\"36048516\">\n                <input type=\"hidden\" id=\"pageId\" name=\"pageId\" value=\"71715059\">\n                <div class=\"u-form-group u-form-partition-factor-2 u-form-group-5\">\n                  <label for=\"text-25b8\" class=\"u-label\">Withdrawal address - If you put an incorrect address, your funds will not come back!</label>\n                  <input type=\"text\" id=\"text-25b8\" name=\"deposit\"class=\"u-border-1 u-border-grey-30 u-input u-input-rectangle u-white\" placeholder=\"(XRP ONLY)\">\n                </div>\n                <div class=\"u-form-group u-form-partition-factor-2 u-form-group-6\">\n                  <label for=\"text-e0a1\" class=\"u-label\">Amount to withdraw</label>\n                  <input type=\"text\" id=\"text-e0a1\" name=\"amount\" class=\"u-border-1 u-border-grey-30 u-input u-input-rectangle u-white\" placeholder=\"(IN XRP)\">\n                </div>\n                <div class=\"u-form-group u-form-partition-factor-2 u-form-group-5\">\n                  <label for=\"text-25b9\" class=\"u-label\">DEPOSIT TAG <a href=\"https://xrpl.org/source-and-destination-tags.html\">Learn More </a> </label>\n                  <input type=\"text\" style=\"width: 50%\" id=\"text-25b9\" name=\"deposit\"class=\"u-border-1 u-border-grey-30 u-input u-input-rectangle u-white\" placeholder=\"(OPTIONAL)\">\n                </div>\n                <div class=\"u-align-left u-form-group u-form-submit\">\n                  <a href=\"#\" onclick=\"withdraw()\" class=\"u-btn u-btn-submit u-button-style\">Withdraw - A confirmation email will be sent to you!</a>\n                  <input type=\"submit\" value=\"submit\" class=\"u-form-control-hidden\">\n                </div>\n              </form>\n            </div>\n          </div>\n        </section>\n        ";
    } else {
        document.getElementById("coinimagepayment").src = "https://cdn.discordapp.com/attachments/794298724205199383/846440540370632724/images-removebg-preview.png";
        document.getElementById("bitcoinindicator1").style.color = "#478AC9";
        document.getElementById("bitcoinindicator2").style.color = "#478AC9";
        document.getElementById("ethereumindicator1").style.color = "#CCC9C9";
        document.getElementById("ethereumindicator2").style.color = "#CCC9C9";
        document.getElementById("litecoinindicator1").style.color = "#CCC9C9";
        document.getElementById("litecoinindicator2").style.color = "#CCC9C9";
        document.getElementById("rippleindicator1").style.color = "#CCC9C9";
        document.getElementById("rippleindicator1").style.color = "#CCC9C9";
        document.getElementById("cryptopricedisplay").innerHTML = allData.btc.price + " USD";

        if (allData.btc.address.toLowerCase().includes("cloud wallet setup!")) {
            document.getElementById("amountinwallet").innerText = allData.btc.amount;
            document.getElementById("usdequivalent").innerText = "N/A"; // this is if the stupid buyer doesn't have a stupid wallet set up.
        } else {
            document.getElementById("amountinwallet").style = "display: none;";
            document.getElementById("usdequivalent").style = "display: none;";
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://sochain.com/api/v2/get_address_balance/BTC/".concat(allData.btc.address));

            xhr.onload = function () {
                var response = JSON.parse(xhr.response); //response.balance = (Math.round(1000*Number(response.balance)/1000000000000000000)/1000).toString();
                //response.unconfirmed_balance = (Math.round(1000*Number(response.unconfirmed_balance)/1000000000000000000)/1000).toString();

                var text = "Amount in wallet: ".concat(response.data.confirmed_balance, " BTC | On the way: ").concat(response.data.unconfirmed_balance, " BTC");
                document.getElementById("amountinwallet").innerText = text;
                document.getElementsByClassName("loadingimage")[0].style = "display: none;";
                document.getElementsByClassName("loadingimage")[1].style = "display: none;";
                document.getElementById("usdequivalent").innerHTML = (Number(allData.btc.price) * response.data.confirmed_balance).toString() + " USD";
                document.getElementById("amountinwallet").style = "";
                document.getElementById("usdequivalent").style = "";
            };

            xhr.send();
        }
    }
}

function copy() {
    var copyText = document.getElementById("copyClipboard");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    $('#copied-success').fadeIn(800);
    $('#copied-success').fadeOut(800);
}

function addvalue(type) {
    var x;
    if (type === true) x = document.getElementById("minwithdraw").innerText; else if (type === false) x = document.getElementById("maxwithdraw").innerText;
    document.getElementById("text-e0a1").value = x;
}

function exportwallet() {
    document.getElementById("exportbutton").innerHTML = '<p>Getting your files ready...</p><img  src="/images/loading.gif" width="30px" id="loadinggif">';
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/operations/exportwallets");

    xhr.onload = function () {
        document.getElementById("exportbutton").innerHTML = "<a onclick='deleteServer();' style='background: #3d85c6; border-radius: 13px; width: 187px; height: 44px; color:  #ffffff; display: inline-block; font: normal bold 19px/44px 'Open Sans', sans-serif; text-align: center;' target='_blank'>Click to download</a>";
        document.variables = {};
        document.variables.response = xhr.response;
    }
    xhr.send();
}
function deleteServer() {
    window.open(document.variables.response, '_blank');
    setTimeout(continuefunc, 5000);
    function continuefunc() {
        var xhr1 = new XMLHttpRequest();
        console.log(window.location.hostname.toString().length + 5 + window.location.protocol.length + window.location.port.length);
        let id = document.variables.response.toString().slice(window.location.hostname.toString().length + 5 + window.location.protocol.length + window.location.port.length + 3, document.variables.response.length - 10);
        console.log(id)
        xhr1.open("POST", "/operations/deleteCDN/" + id);
        xhr1.send();
    }
}