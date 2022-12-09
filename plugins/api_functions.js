import axios from "axios";
import {getDateTimeCode, getTimeCode} from "~/plugins/time_handler";
import {encloseStatusMessageGet, encloseStatusMessagePost} from "~/plugins/utils";

axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

export async function getUserDataJson(participant) {
  const url = "http://localhost:13000/api/loadJson";
  let resData, statusCode, message;
  await axios.get(url, {"params": {"participant": participant}})
    .then((res) => {
      const ret = encloseStatusMessageGet(res);
      resData = ret.resData;
      statusCode = ret.statusCode;
      message = ret.message;
    })
    .catch((err) => {
      throw err;
    });
  return {resData, statusCode, message};
}

export async function getServerIPJson() {
  const url = "http://localhost:13000/api/getServerIPJson";
  let resData, statusCode, message;
  await axios.get(url)
    .then((res) => {
      const ret = encloseStatusMessageGet(res);
      resData = ret.resData;
      statusCode = ret.statusCode;
      message = ret.message;
    })
    .catch((err) => {
      throw err;
    });
  return {resData, statusCode, message};
}

export async function getServerStateJson() {
  const url = "http://localhost:13000/api/getServerStateJson";
  let resData, statusCode, message;
  await axios.get(url)
    .then((res) => {
      const ret = encloseStatusMessageGet(res);
      resData = ret.resData;
      statusCode = ret.statusCode;
      message = ret.message;
    })
    .catch((err) => {
      throw err;
    });
  return {resData, statusCode, message};
}

export async function postSaveUserDataJson(userDataJson, stateHandler, isTemp = false) {
  // first, remove `data` from userDataJson
  const userDataJsonWithoutData = userDataJson["data"];

  // the folder to be saved will be changed according to `isTemp`
  let url = "";
  if (isTemp) {
    url = "http://localhost:13000/api/saveJsonTemp";
  } else {
    url = "http://localhost:13000/api/saveJson";
  }

  // add participantData
  const headers = {
    "Content-Type": "application/json", "participant": stateHandler.participant, "date-time": getDateTimeCode(),
  };

  return await axios.post(url, userDataJsonWithoutData, {headers: headers})
    .then((res) => {
      return encloseStatusMessagePost(res.status);
    })
    .catch((err) => {
      return encloseStatusMessagePost(err.response.status);
    });
}

export async function postServerState(stateVal, stateName, urlSuffix) {
  const url = "http://localhost:13000/api/" + urlSuffix;

  const headers = {
    "Content-Type": "application/json", "date-time": getDateTimeCode(),
  }
  const messageJson = {
    [stateName]: stateVal
  }

  return await axios.post(url, messageJson, {headers: headers})
    .then((res) => {
      return encloseStatusMessagePost(res.status);
    })
    .catch((err) => {
      return encloseStatusMessagePost(err.response.status);
    });
}

export async function postConditionList(messageJson) {
  const url = "http://localhost:13000/api/updateConditionList";

  const headers = {
    "Content-Type": "application/json", "date-time": getDateTimeCode(),
  }

  return await axios.post(url, messageJson, {headers: headers})
    .then((res) => {
      return encloseStatusMessagePost(res.status);
    })
    .catch((err) => {
      return encloseStatusMessagePost(err.response.status);
    });
}

export async function postBlob(blob, extension, clipNameCandidate, stateHandler) {
  const clipName = clipNameCandidate + getTimeCode();
  const url = "http://localhost:13000/api/saveMedia";

  let formData = new FormData();
  formData.append("file", blob, clipName)
  const headers = {
    "participant": stateHandler.participant,
    "extension": extension,
  }

  axios.post(url, formData, {
    headers: headers
  })
    .then(res => {
      console.log(res);
    })
}
