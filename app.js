const express = require('express');
const app = express();
var cors = require('cors')
const os = require("os");
const cluster = require("cluster");

var secrets;
if (process.env.secrets){
  secrets = JSON.parse(process.env.secrets)
}else{
  secrets = require("./secret.json")
}

let port = process.env.PORT || 3200;
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

const clusterWorkerSize = os.cpus().length;
const start = async () => {
  try {
      await app.listen(port);
      console.log(`server listening on ${port} and worker ${process.pid}`);
  } catch (err) {
      fastify.log.error(err);
      process.exit(1);
  }
}

if (clusterWorkerSize > 1) {
  if (cluster.isMaster) {
      for (let i=0; i < clusterWorkerSize; i++) {
          cluster.fork();
      }

      cluster.on("exit", function(worker) {
          console.log("Worker", worker.id, " has exited.")
      })
  } else {
      start();
  }
} else {
  start();
}
