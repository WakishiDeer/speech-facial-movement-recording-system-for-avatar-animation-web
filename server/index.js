const osc = require("osc");
const fs = require("fs");
const path = require("path");

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
  "isRecording": false,
  "slate": "",
};
let conditionList = [];
const userDataRootPath = path.resolve(__dirname, "../", "assets", "user_data");

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
  serverStateJson["slate"] = participant + "_" + task + "_" + condition;
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

function startRecording(oscClient) {
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

function stopRecording(oscClient) {
  oscClient.send({
    "address": "/RecordStop",
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
});

oscClient.on("error", (err) => {
  console.error(err);
});

module.exports = serverStateJson;
module.exports = userDataRootPath;
