const app = require("express")();
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");

const port = 13000;
// multipart setting
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // make dir if not existing
    const participant = req.headers.participant;
    const folderPath = "./assets/user_data/" + participant;
    if (!fs.existsSync(folderPath)) {
      await fs.promises.mkdir(folderPath, {recursive: true})
        .then(res => {
          console.log("Directory has been made: " + res);
        });
    }
    // callback
    cb(null, "./assets/user_data/" + participant + "/");
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
  limit: "300mb"
}));
app.use(bodyParser.json({
  limit: "100mb"
}));

app.listen(port, () => {
  console.log("Start listening...");
});

async function writeJsonFile(folderPath, path, req) {
  // make dir at first time
  if (!fs.existsSync(folderPath)) {
    await fs.promises.mkdir(folderPath, {recursive: true});
  }

  // handle saving json data
  fs.writeFileSync(path, JSON.stringify(req.body));
  console.log("User data has been saved at: " + path);
}

app.post("/api/saveJson", async (req, res) => {
  try {
    const participant = req.headers.participant;
    const folderPath = "./assets/user_data/" + participant + "/";
    const path = folderPath + "data_" + participant + ".json";

    await writeJsonFile(folderPath, path, req);
    res.status(200).send("User data has been saved...: " + JSON.stringify(req.body));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/api/saveJsonTemp", async (req, res) => {
  try {
    const participant = req.headers.participant;
    const dateTime = req.headers["date-time"];
    const folderPath = "./assets/user_data/" + participant + "/tmp/";
    const path = folderPath + "data_" + participant + "_" + dateTime + ".json";

    await writeJsonFile(folderPath, path, req);
    res.status(200).send("User data has been saved...: " + JSON.stringify(req.body));
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
})

app.get("/api/loadJson", async (req, res) => {
  try {
    const participant = req.query.participant;
    const folderPath = "./assets/user_data/" + participant + "/";
    const path = folderPath + "data_" + participant + ".json";

    // make dir at first time
    if (!fs.existsSync(folderPath)) {
      await fs.promises.mkdir(folderPath, {recursive: true});
    }

    const userData = fs.readFileSync(path, "utf-8");
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
app.post("/api/saveMedia", upload.single("file"), async (req, res) => {
  try {
    res.send("Media has been saved successfully...");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});


module.exports = app;
