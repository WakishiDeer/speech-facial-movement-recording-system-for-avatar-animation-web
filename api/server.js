const appApi = require("express")();
const appOsc = require("express")();
const ws = require("ws");
const osc = require("osc");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const {networkInterfaces} = require("os");
const multer = require("multer");

let hostIP = "127.0.0.1";
let iosIP = "127.0.0.1";
const portApi = 13000;
const portOsc = 8000;
const userDataRootPath = path.resolve(__dirname, "../", "assets", "user_data");
// multipart setting
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // make dir if not existing
    const participant = checkGetParticipant(req);
    const folderPath = getUserDataDirPath(userDataRootPath, participant);
    // callback
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    // callback
    cb(null, file.originalname + req.headers.extension);
  },
});
const upload = multer({
  storage: storage,
});


appApi.use(cors());
appApi.use(bodyParser.urlencoded({
  extended: true,
  limit: "300mb"
}));
appApi.use(bodyParser.json({
  limit: "100mb"
}));

// api
appApi.listen(portApi, () => {
  console.log("Start listening api...");
});

function checkGetParticipant(req) {
  const participant = req.query.participant;
  if (participant === undefined) {
    throw Error("Participant is not specified.");
  }
  return participant;
}

function getUserDataJsonPath(userDataRootPath, participant, isTemp = false) {
  const folderPath = getUserDataDirPath(userDataRootPath, participant, isTemp);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {recursive: true});
  }
  return path.join(folderPath, "data_" + participant + ".json");
}

function getUserDataDirPath(userDataRootPath, participant, isTemp) {
  let folderPath;
  if (isTemp) {
    folderPath = path.join(userDataRootPath, participant, "tmp");
  } else {
    folderPath = path.join(userDataRootPath, participant);
  }
  return folderPath;
}

async function writeJsonFile(filePath, req) {
  // handle saving json data
  fs.writeFileSync(filePath, JSON.stringify(req.body));
  console.log("User data has been saved at: " + filePath);
}

appApi.post("/api/saveJson", async (req, res) => {
  try {
    const participant = checkGetParticipant(req);
    const filePath = getUserDataJsonPath(userDataRootPath, participant);

    await writeJsonFile(filePath, req);
    res.status(200).send("User data has been saved...: " + JSON.stringify(req.body));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/saveJsonTemp", async (req, res) => {
  try {
    const participant = checkGetParticipant(req);
    const dateTime = req.headers["date-time"];
    const filePath = getUserDataJsonPath(userDataRootPath, participant, true);

    await writeJsonFile(filePath, req);
    res.status(200).send("User data has been saved...: " + JSON.stringify(req.body));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
})

appApi.get("/api/loadJson", async (req, res) => {
  try {
    const participant = checkGetParticipant(req);
    const filePath = getUserDataJsonPath(userDataRootPath, participant);

    const userData = fs.readFileSync(filePath, "utf-8");
    // if valid data, return it as success
    res.status(200).json(JSON.parse(userData));
    console.log("User data has been sent to client");
  } catch (err) {
    console.error(err);
    // if error and just not existing, return empty data as status
    if (err.code === "ENOENT") {
      res.status(204).json(JSON.parse("{}"));
    } else {
      res.status(500).send("error");
    }
  }
});

// use `multer` to save "multipart/from-data"
appApi.post("/api/saveMedia", upload.single("file"), async (req, res) => {
  try {
    res.send("Media has been saved successfully...");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/updateIosIP", async (req, res) => {
  try {
    iosIP = req.body["ios-ip"];
    console.info("ios IP has been updated: " + iosIP);
    res.send("iOS IP has been updated successfully...: " + iosIP);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});


appApi.post("/api/updateServerIP", async (req, res) => {
  try {
    const serverIP = req.body["server-ip"];
    console.info("server IP has been updated: " + serverIP);
    res.send("Server IP Address has been updated successfully...: " + serverIP);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});


appApi.get("/api/getServerIP", async (req, res) => {
  try {
    const ipAddressJson = getIpAddressJson();
    res.status(200).json(ipAddressJson);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.get("/api/oscStart", async (req, res) => {
  try {
    runOscServer(server);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

// osc settings
// osc
function getIpAddressJson() {
  return networkInterfaces();
}

const server = appOsc.listen(portOsc, () => {
  console.log("Start listening osc...");
});

function runOscServer(server) {
  const wss = new ws.WebSocketServer({
    server: server
  });
  // listen for connections
  wss.on("connection", (socket) => {
    const socketPort = new osc.TCPSocketPort({
      socket: socket,
      metadata: true
    });

    socketPort.on("ready", () => {
      socketPort.send({
        address: "/OSCSetSendTarget",
        args: [{
          type: "IP",
          value: hostIP
        },
          {
            type: "port",
            value: portOsc
          }
        ]
      });
      socketPort.send({
        "address": "/AddLiveLinkAddress",
        "args": [{
          type: "IP",
          value: iosIP
        },
          {
            type: "port",
            value: portOsc
          }]
      });
    });

    socketPort.on("message", (oscMsg) => {
      console.log("Message from iPad: ", oscMsg);
    });

    socketPort.on("error", (err) => {
      console.error(err);
    });
  });
}


module.exports = appApi;
