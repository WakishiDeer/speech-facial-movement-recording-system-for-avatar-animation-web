const appApi = require("express")();
const OSC = require("osc-js");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const {networkInterfaces} = require("os");
const multer = require("multer");

let serverStateJson = {
  "osc-server-active": false,
  "participant": "",
  "condition": "",
  "task": "",
  "server-ip": "127.0.0.1",
  "ios-ip": "127.0.0.1",
  "api-port": 13000,
  "osc-port": 8000
};
let conditionList = [];
let takeNum = 0;
const userDataRootPath = path.resolve(__dirname, "../", "assets", "user_data");
// multipart setting
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // make dir if not existing
    const folderPath = getUserDataDirPath(userDataRootPath, serverStateJson["participant"]);
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
appApi.listen(serverStateJson["api-port"], () => {
  console.log("Start listening api...");
});

function updateServerState(item, value) {
  serverStateJson[item] = value;
  // initialize osc server
  udpPort = initializeUdpPort();
  sendInitialization(udpPort);
  console.log("Server state has been updated: ", item);
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
    const filePath = getUserDataJsonPath(userDataRootPath, serverStateJson["participant"]);

    await writeJsonFile(filePath, req);
    res.status(200).send("User data has been saved...: " + JSON.stringify(req.body));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/saveJsonTemp", async (req, res) => {
  try {
    const dateTime = req.headers["date-time"];
    const filePath = getUserDataJsonPath(userDataRootPath, serverStateJson["participant"], true);

    await writeJsonFile(filePath, req);
    res.status(200).send("User data has been saved...: " + JSON.stringify(req.body));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
})


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
    const iosIP = req.body["ios-ip"];
    updateServerState("ios-ip", iosIP);
    console.info("ios IP has been updated: " + iosIP);
    res.send("iOS IP has been updated successfully...: " + iosIP);
    udpPort = initializeUdpPort();
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/updateServerIP", async (req, res) => {
  try {
    const hostIP = req.body["server-ip"];
    updateServerState("server-ip", hostIP);
    console.info("server IP has been updated: " + hostIP);
    // initialize osc server
    res.send("Server IP Address has been updated successfully...: " + hostIP);
    udpPort = initializeUdpPort();
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/updateParticipant", async (req, res) => {
  try {
    const participant = req.body["participant"];
    updateServerState("participant", participant);
    // initialize osc server
    res.send("Participant has been updated successfully...: " + participant);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/updateCondition", async (req, res) => {
  try {
    const condition = req.body["condition"];
    updateServerState("condition", condition);
    // initialize osc server
    res.send("Condition has been updated successfully...: " + condition);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/updateConditionList", async (req, res) => {
  try {
    // deep copy
    conditionList = JSON.parse(JSON.stringify(req.body["condition-list"]));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.post("/api/updateTask", async (req, res) => {
  try {
    const task = req.body["task"];
    updateServerState("task", task);
    // initialize osc server
    res.send("Task has been updated successfully...: " + task);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.get("/api/loadJson", async (req, res) => {
  try {
    const filePath = getUserDataJsonPath(userDataRootPath, serverStateJson["participant"]);

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

appApi.get("/api/getServerIPJson", async (req, res) => {
  try {
    const ipAddressJson = getIpAddressJson();
    res.status(200).json(ipAddressJson);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

appApi.get("/api/getServerStateJson", async (req, res) => {
  try {
    const serverStateJson = getServerStateJson();
    res.status(200).json(serverStateJson);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});


// osc settings
// osc
let osc = initializeUdpPort();
osc.open();

function initializeUdpPort() {
  return new OSC({plugin: new OSC.WebsocketServerPlugin({port: 8000})});
}

function createMessage(...args) {
  const url = args[0];
  if(args.length < 2){
    throw new Error("OSC message should have at least 2 arguments");
  }else if (args.length === 2){
    return new OSC.Message(url, args[1]);
  }else{
    // first arg is URL
    // second and later args are data
    return new OSC.Message(url, ...args.slice(1));
  }
}

function runOscServer(udpPort) {
  // open the socket
  udpPort.on("ready", () => {
    sendInitialization(udpPort);
    console.log("OSC server is ready...");
  });
  udpPort.on("message", (oscMsg) => {
    console.log("Message from iPad: ", oscMsg);
  });
  // on receiving error
  udpPort.on("error", (err) => {
    console.error(err);
  });
}

function getIpAddressJson() {
  return networkInterfaces();
}

function isServerRunning(udpPort) {
  return udpPort.socket && udpPort.socket.readyState === "open";
}

function getServerStateJson() {
  return serverStateJson;
}


function sendInitialization(udpPort) {
  sendTargetAddresses(udpPort, serverStateJson["server-ip"], serverStateJson["ios-ip"], serverStateJson["osc-port"]);
  sendName(udpPort, serverStateJson["participant"], serverStateJson["task"], serverStateJson["condition"],);
}

function sendTargetAddresses(udpPort, hostIP, iosIP, oscPort) {
  udpPort.send({
    address: "/OSCSetSendTarget",
    args: [
      {
        type: "s",
        value: hostIP
      },
      {
        type: "i",
        value: oscPort
      }
    ]
  });
  udpPort.send({
    address: "/AddLiveLinkAddress",
    args: [
      {
        type: "s",
        value: iosIP
      },
      {
        type: "i",
        value: oscPort
      }
    ]
  });
}

function sendName(udpPort, participant, task, condition) {
  // set slate name
  udpPort.send({
    "address": "/Slate",
    "args": [{
      "type": "s",
      "value": participant + "_" + task + "_" + condition
    }]
  });
  udpPort.send({
    "address": "/Take",
    "args": [{
      "type": "i",
      "value": takeNum
    }]
  });
}

module.exports = appApi;
