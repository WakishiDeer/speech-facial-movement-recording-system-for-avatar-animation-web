import axios from "axios";
import {getDateTimeCode} from "~/plugins/time_handler";
import {encloseStatusMessageGet, encloseStatusMessagePost} from "~/plugins/utils";

axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

export async function getUserDataJson(participant) {
  const url = "http://localhost:13000/api/loadJson";
  await axios.get(url, {params: {participant: participant}})
    .then((res) => {
      return encloseStatusMessageGet(res.data, res.status);
    })
    .catch((err) => {
      return encloseStatusMessageGet({}, err.status);
    });
}

export async function postSaveUserDataJson(userDataJson, stateHandler, isTemp = false) {
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

  return await axios.post(url, userDataJson, {headers: headers})
    .then((res) => {
      return encloseStatusMessagePost(res.status);
    })
    .catch((err) => {
      return encloseStatusMessagePost(err.status);
    });
}
