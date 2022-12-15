const fs = require("fs");
const path = require("path");
const {networkInterfaces} = require("os");
const {getIpAddressJson, getUserDataDirPath} = require("./utils");

module.exports = function isIPAddressExists(ipAddress) {
  const ipAddressJson = getIpAddressJson();
  return ipAddress in ipAddressJson;
}

module.exports = function getIpAddressJson() {
  return networkInterfaces();
}

module.exports = function getUserDataJsonPath(userDataRootPath, participant, isTemp = false) {
  const folderPath = getUserDataDirPath(userDataRootPath, participant, isTemp);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {recursive: true});
  }
  return path.join(folderPath, "data_" + participant + ".json");
}

module.exports = function getUserDataDirPath(userDataRootPath, participant, isTemp) {
  let folderPath;
  if (isTemp) {
    folderPath = path.join(userDataRootPath, participant, "tmp");
  } else {
    folderPath = path.join(userDataRootPath, participant);
  }
  return folderPath;
}


module.exports = async function writeJsonFile(filePath, req) {
  // handle saving json data
  fs.writeFileSync(filePath, JSON.stringify(req.body));
  console.log("User data has been saved at: " + filePath);
}
