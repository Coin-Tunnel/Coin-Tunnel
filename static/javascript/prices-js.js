var prices = {
    btc: 0,
    eth: 0,
    ltc: 0,
    xrp: 0,
    ada: 0,
    bnb: 0
}
if (!window.EventSource){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum,ripple,cardano&vs_currencies=usd");

    xhr.onload = function () {
        var response = JSON.parse(xhr.response);
        prices.btc = response.bitcoin.usd;
        prices.eth = response.ethereum.usd;
        prices.ltc = response.litecoin.usd;
        prices.xrp = response.ripple.usd;
        prices.ada = response.cardano.usd;
    };
    xhr.send();



    var xhr1 = new XMLHttpRequest();
    xhr1.open("GET", "/sse/prices/bnb?static=true");

    xhr1.onload = function () {
        prices.bnb = Number(xhr1.response);
        setTimeout(doubleCheck, 1000);
    };
    xhr1.send();
    function doubleCheck(){
        let data = prices;
        document.getElementById("btcprice").innerText = data.btc+" USD";
        document.getElementById("ethprice").innerText = data.eth+" USD";
        document.getElementById("ltcprice").innerText = data.ltc+" USD";
        document.getElementById("xrpprice").innerText = data.xrp+" USD";
        document.getElementById("adaprice").innerText = data.ada+" USD";
        document.getElementById("bnbprice").innerText = data.bnb+" USD";
    }
}else{
    const event = new EventSource("/sse/prices/all?slow=true");

    event.onmessage = function(event) {
        data = JSON.parse(event.data)
    
        document.getElementById("btcprice").innerText = data.btc+" USD";
        prices.btc = Number(data.btc);
        let amount = document.getElementById("btcamount").value;
        document.getElementById("btcusd").value = Number(amount)*prices.btc;
    
        document.getElementById("ethprice").innerText = data.eth+" USD";
        prices.eth = Number(data.eth);
        amount = document.getElementById("ethamount").value;
        document.getElementById("ethusd").value = Number(amount)*prices.eth;
    
        document.getElementById("ltcprice").innerText = data.ltc+" USD";
        prices.ltc = Number(data.ltc);
        amount = document.getElementById("ltcamount").value;
        document.getElementById("ltcusd").value = Number(amount)*prices.ltc;
    
        document.getElementById("xrpprice").innerText = data.xrp+" USD";
        prices.xrp = Number(data.xrp);
        amount = document.getElementById("xrpamount").value;
        document.getElementById("xrpusd").value = Number(amount)*prices.xrp;
    
        document.getElementById("adaprice").innerText = data.ada+" USD";
        prices.ada = Number(data.ada);
        amount = document.getElementById("adaamount").value;
        document.getElementById("adausd").value = Number(amount)*prices.ada;
    
        document.getElementById("bnbprice").innerText = data.bnb+" USD";
        prices.bnb = Number(data.bnb);
        amount = document.getElementById("bnbamount").value;
        document.getElementById("bnbusd").value = Number(amount)*prices.bnb;
    }
    
    
    
    window.onbeforeunload = function(event) {
        btcevent.close();
        ethevent.close();
        ltcevent.close();
        xrpevent.close();
        adaevent.close();
        bnbevent.close();
    };       
}


checkJquery();
function checkJquery(){
    if (window.jQuery) console.log("jquery has loaded")
    else setTimeout(checkJquery, 1000);
    $('#btcamount').on('input', function() {
        let amount = document.getElementById("btcamount").value;
        document.getElementById("btcusd").value = Number(amount)*prices.btc;
    }); 
    $('#ethamount').on('input', function() {
        let amount = document.getElementById("ethamount").value;
        document.getElementById("ethusd").value = Number(amount)*prices.eth;
    }); 
    $('#ltcamount').on('input', function() {
        let amount = document.getElementById("ltcamount").value;
        document.getElementById("ltcusd").value = Number(amount)*prices.ltc;
    }); 
    $('#xrpamount').on('input', function() {
        let amount = document.getElementById("xrpamount").value;
        document.getElementById("xrpusd").value = Number(amount)*prices.xrp;
    }); 
    $('#adaamount').on('input', function() {
        let amount = document.getElementById("adaamount").value;
        document.getElementById("adausd").value = Number(amount)*prices.ada;
    }); 
    $('#bnbamount').on('input', function() {
        let amount = document.getElementById("bnbamount").value;
        document.getElementById("bnbusd").value = Number(amount)*prices.bnb;
    }); 
}