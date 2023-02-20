const osc = require("osc");
const path = require("path");

// logging for memory
const logIntervalTime = 1000;  // per 1 second
// file name with time
function getDateTimeString() {
  // datetime with ISOString in Japan
  const date = new Date();
  date.setHours(date.getHours() + 9);
  return date.toISOString().replace(/:/g, "-");
}
const saveLogPath = path.join(__dirname, "log", "memory_" + getDateTimeString() + ".log");

function emitLog() {
  const used = process.memoryUsage();
  const messages = [];
  for (let key in used) {
    messages.push(`${key} - ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
  // print time and memory usage
  const message = `${new Date().toLocaleTimeString()} - ${messages.join(", ")}`;
  console.log(message);
  // add memory usage to log file
  try {
    fs.appendFile(saveLogPath, message + "\n", (err) => {
      if (err) throw err;
    });
  } catch (err) {
    console.error(err);
  }
}

setInterval(emitLog, logIntervalTime);

// state management
let serverStateJson = {
  "osc-server-active": false,
  "participant": "",
  "condition": "",
  "task": "",
  "server-ip": "127.0.0.1",
  "ios-ip": "127.0.0.1",
  "api-port": 13000,
  "osc-port": 8000,
  "takeNum": 0,
  "is-recording": false,
  "slate": "",
  "battery": 0.0,
  "thermal": 0,
};
const userDataRootPath = path.resolve(__dirname, "../", "assets", "user_data");

function getServerStateJson() {
  return serverStateJson;
}

function updateServerState(item, value) {
  if (item === "server-ip" || item === "ios-ip") {
    serverStateJson[item] = value;
    // if server ip or ios ip is changed, update osc client
    if (oscClient !== null) {
      oscClient.close();
    }
    if (isNotLocalHostAddress(serverStateJson["server-ip"]) && isNotLocalHostAddress(serverStateJson["ios-ip"])) {
      // if not local address of both server and ios, start osc server
      oscClient = initializeUDPPort(serverStateJson["server-ip"], serverStateJson["osc-port"], serverStateJson["ios-ip"]);
      startOscServer();
      sendTargetAddresses(serverStateJson["server-ip"], serverStateJson["ios-ip"], serverStateJson["osc-port"]);
    }
  } else if (item === "participant" || item === "task" || item === "condition") {
    serverStateJson[item] = value;
    if (oscClient !== null) {
      sendName(serverStateJson["participant"], serverStateJson["task"], serverStateJson["condition"]);
    }
  } else {
    serverStateJson[item] = value;
  }
}

function initializeUDPPort(address, port, remoteAddress) {
  return new osc.UDPPort({
    localAddress: address,
    localPort: port,
    remoteAddress: remoteAddress,
    remotePort: port,
    metadata: true
  });
}

function sendMessage(addrArgs) {
  console.log(addrArgs);
  oscClient.send(addrArgs);
}

function sendTargetAddresses(hostIP, iosIP, oscPort) {
  const addrArgsSetSendTarget = {
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
  };
  sendMessage(addrArgsSetSendTarget);

  const addrArgsAddLiveLinkAddress = {
    address: "/AddLiveLinkAddress",
    args: [
      {
        type: "s",
        value: hostIP
      },
      {
        type: "i",
        value: oscPort + 1
      }
    ]
  }
  sendMessage(addrArgsAddLiveLinkAddress);
}

function sendName(participant, task, condition) {
  // set slate name
  updateServerState("slate", participant + "_" + task + "_" + condition);
  oscClient.send({
    "address": "/Slate",
    "args": [{
      "type": "s",
      "value": serverStateJson["slate"]
    }]
  });
  oscClient.send({
    "address": "/Take",
    "args": [{
      "type": "i",
      "value": serverStateJson["takeNum"]
    }]
  });
}

function startRecording() {
  oscClient.send({
    "address": "/RecordStart",
    "args": [{
      "type": "s",
      "value": serverStateJson["slate"]
    },
      {
        "type": "i",
        "value": serverStateJson["takeNum"]
      }]
  });
}

function stopRecording() {
  oscClient.send({
    "address": "/RecordStop",
  });
}

// osc settings
// initialize osc server
function startOscServer() {
  oscClient.on("message", (oscMsg, timeTag, info) => {
    switch (oscMsg.address) {
      case "/OSCSetSendTargetConfirm":
        updateServerState("osc-server-active", true);
        break;
      case "/Battery":
        updateServerState("battery", oscMsg.args[0].value);
        break;
      case "/Thermal":
        updateServerState("thermal", oscMsg.args[0].value);
        break;
      case "/RecordStartConfirm":
        updateServerState("is-recording", true);
        break;
      case "/RecordStopConfirm":
        updateServerState("is-recording", false);
        break;
      default:
        console.log(oscMsg);
        break;
    }
  });

  oscClient.open();

  oscClient.on("ready", () => {
    if (isNotLocalHostAddress(serverStateJson["ios-ip"])) {
      // set target addresses
      sendTargetAddresses(serverStateJson["server-ip"], serverStateJson["ios-ip"], serverStateJson["osc-port"]);
      sendName(serverStateJson["participant"], serverStateJson["task"], serverStateJson["condition"]);
    }
  });

  oscClient.on("error", (err) => {
    console.error(err);
  });
}


// api
const app = require("express")();
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");

let conditionList = [];

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

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json({}));

// api
app.listen(serverStateJson["api-port"], () => {
  console.log("Start listening api...");
});


app.post("/api/saveJson", async (req, res) => {
  try {
    const filePath = getUserDataJsonPath(userDataRootPath, serverStateJson["participant"]);

    await writeJsonFile(filePath, req);
    res.status(200).send("User data has been saved...: " + JSON.stringify(req.body));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/saveJsonTemp", async (req, res) => {
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
app.post("/api/saveMedia", upload.single("file"), async (req, res) => {
  try {
    const ext = req.headers.extension;
    res.status(200).send("Media has been saved...: " + ext);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/updateIosIP", async (req, res) => {
  try {
    const iosIP = req.body["ios-ip"];
    if (isNotLocalHostAddress(iosIP)) {
      updateServerState("ios-ip", iosIP);
      console.info("ios IP has been updated: " + iosIP);
      res.status(200).send("iOS IP has been updated successfully...: " + iosIP);
    } else {
      res.status(204).send("iOS IP is invalid: " + iosIP);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/updateServerIP", async (req, res) => {
  try {
    const hostIP = req.body["server-ip"];
    if (isNotLocalHostAddress(hostIP)) {
      updateServerState("server-ip", hostIP);
      console.info("server IP has been updated: " + hostIP);
    } else {
      // initialize osc server
      res.send("Server IP Address has been updated successfully...: " + hostIP);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/updateParticipant", async (req, res) => {
  try {
    console.log("update participant");
    const participant = req.body["participant"];
    updateServerState("participant", participant);
    // initialize osc server
    res.send("Participant has been updated successfully...: " + participant);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/updateCondition", async (req, res) => {
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

app.post("/api/updateConditionList", async (req, res) => {
  try {
    // deep copy
    conditionList = JSON.parse(JSON.stringify(req.body["condition-list"]));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/updateTask", async (req, res) => {
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

app.post("/api/startOscRecording", (req, res) => {
  try {
    startRecording();
    res.send("OSC recording has been started...");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/stopOscRecording", (req, res) => {
  try {
    stopRecording();
    res.send("OSC recording has been stopped...");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.get("/api/loadJson", async (req, res) => {
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

app.get("/api/getServerIPJson", async (req, res) => {
  try {
    const ipAddressJson = getIpAddressJson();
    res.status(200).json(ipAddressJson);
  } catch (err) {

    console.error(err);
    res.status(500).send("error");
  }
});

app.get("/api/getServerStateJson", async (req, res) => {
  try {
    const serverStateJson = getServerStateJson();
    res.status(200).json(serverStateJson);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

module.exports = app;


// utils
const {networkInterfaces} = require("os");
const dns = require("dns");
const dnsPromises = dns.promises;

function isLocalIpAddressExists(ipAddress) {
  const serverIpList = makeServerIPList(getIpAddressJson());
  return serverIpList.includes(ipAddress);
}

function isNotLocalHostAddress(ipAddress) {
  return ipAddress !== "127.0.0.1"
}

async function isReachable(ipAddress, port) {
  return await dnsPromises.lookup(ipAddress)
    .then(({address, family}) => {
      return true;
    })
    .catch((err) => {
      console.error(err);
      return false;
    });
}

function makeServerIPList(serverIPJson) {
  // given server ip json, return server ip list
  const serverIPList = [];
  for (const key in serverIPJson) {
    for (const ip of serverIPJson[key]) {
      if (ip["family"] === "IPv4") {
        serverIPList.push(ip["address"]);
      }
    }
  }
  return serverIPList;
}

function getIpAddressJson() {
  return networkInterfaces();
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


let oscClient = null;
