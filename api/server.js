const appApi = require("express")();
const osc = require("osc");
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
  "osc-port": 8000,
  "takeNum": 0,
};
let conditionList = [];
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
}));
appApi.use(bodyParser.json({
}));

// api
appApi.listen(serverStateJson["api-port"], () => {
  console.log("Start listening api...");
});


function getIpAddressJson() {
  return networkInterfaces();
}

function getServerStateJson() {
  return serverStateJson;
}

function updateServerState(item, value) {
  serverStateJson[item] = value;

  // restart osc server
  if (item === "server-ip") {
    oscClient.close();
    oscClient = initializeUDPPort(serverStateJson["server-ip"], serverStateJson["osc-port"], serverStateJson["ios-ip"]);
    oscClient.open();
  }
  // reset osc server
  if (item === "ios-ip" || item === "server-ip") {
    sendTargetAddresses(oscClient, serverStateJson["server-ip"], serverStateJson["ios-ip"], serverStateJson["osc-port"]);
  }
  // change name of the Live Link Face
  if (item === "participant" || item === "task" || item === "condition") {
    sendName(oscClient, serverStateJson["participant"], serverStateJson["task"], serverStateJson["condition"]);
  }
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

function initializeUDPPort(address, port, remoteAddress) {
  return new osc.UDPPort({
      localAddress: address,
      localPort: port,
      remoteAddress: remoteAddress,
      remotePort: port,
      metadata: true,
    }
  )
}

function sendTargetAddresses(oscClient, hostIP, iosIP, oscPort) {
  oscClient.send({
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
  oscClient.send({
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

function sendName(oscClient, participant, task, condition) {
  // set slate name
  oscClient.send({
    "address": "/Slate",
    "args": [{
      "type": "s",
      "value": participant + "_" + task + "_" + condition
    }]
  });
  oscClient.send({
    "address": "/Take",
    "args": [{
      "type": "i"
    }]
  });
}

// osc settings
// initialize osc server
let oscClient = initializeUDPPort(serverStateJson["server-ip"], serverStateJson["osc-port"], serverStateJson["ios-ip"]);

oscClient.on("message", (oscMsg, timeTag, info) => {
  console.info(oscMsg);
  // console.info(timeTag);
  // console.info(info);
});

oscClient.open();

oscClient.on("ready", () => {
  // set target addresses
  sendTargetAddresses(oscClient, serverStateJson["server-ip"], serverStateJson["ios-ip"], serverStateJson["osc-port"]);
  sendName(oscClient, serverStateJson["participant"], serverStateJson["task"], serverStateJson["condition"]);
})

oscClient.on("error", (err) => {
  console.error(err);
});


module.exports = appApi;
