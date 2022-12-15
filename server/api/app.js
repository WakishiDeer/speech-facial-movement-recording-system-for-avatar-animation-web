const cors = require("cors");
const bodyParser = require("body-parser");
const app = require("express")();
const {serverStateJson, userDataRootPath} = require("../index");
const {getIpAddressJson, getUserDataJsonPath, getUserDataDirPath} = require("../utils");
const multer = require("multer");

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
    res.send("Media has been saved successfully...");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/updateIosIP", async (req, res) => {
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

app.post("/api/updateServerIP", async (req, res) => {
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

app.post("/api/updateParticipant", async (req, res) => {
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
    startRecording(oscClient);
    res.send("OSC recording has been started...");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/stopOscRecording", (req, res) => {
  try {
    stopRecording(oscClient);
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
