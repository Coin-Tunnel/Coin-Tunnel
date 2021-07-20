const express = require('express');
const app = express();
var cors = require('cors')

var secrets;
if (process.env.secrets){
  secrets = JSON.parse(process.env.secrets)
}else{
  secrets = require("./secret.json")
}

let port = process.env.PORT || 3000;
let secret = secrets.reqsession;
app.set('port', port);

const session = require('cookie-session');
app.set('trust proxy', 1) // trust first proxy

app.set('view engine', 'ejs');
app.use(express.static('static'));
let sessionParser = session({
    secret: secret,
    keys: [secret],
    name: "session",
    resave: false,
    saveUninitialized: false,
    //expires: 604800000,
})
app.use(sessionParser);
app.use(cors())

require('./router')(app);

app.listen(port, () => console.info(`Listening on port ${port}`));