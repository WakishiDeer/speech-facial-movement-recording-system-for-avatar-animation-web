import {getDateTimeCode, getTimeCode} from "~/plugins/time_handler";
import axios from "axios";

axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

export function initializeScriptIndex(stateHandler, targetJson) {
  stateHandler.curentScriptIndex = 0; // range from 0 to {5 - 1, 100 - 1}
  stateHandler.currentScriptNo = targetJson[stateHandler.selectConditions.state]["no"][stateHandler.currentScriptIndex];
  stateHandler.currentScriptContent = targetJson[stateHandler.selectConditions.state]["content"][stateHandler.currentScriptIndex];
}

export function initializeSlideIndex(stateHandler) {
  stateHandler.currentSlideIndex = 0; // range from 0 to {5 + 1, 100 + 1}
}

export async function initializeJsonData(scriptJson, vowelJson, stateHandler) {
  // first, try to get userDataJson
  const url = "http://localhost:13000/api/loadJson";
  let userDataJson = {};
  let hasPreviousData = false;
  await axios.get(url, {params: {participant: stateHandler.participant}})
    .then(res => {
      const response = JSON.parse(JSON.stringify(res.data));

      // if data is not created or found
      if (Object.keys(response).length === 0) {
        // initialization
        // concat json files into one
        userDataJson["ita"] = JSON.parse(JSON.stringify(scriptJson));  // deep copy
        userDataJson["vowel"] = JSON.parse(JSON.stringify(vowelJson));
        // initialize {min, max} rms only when rms_min or rms_max is undefined
        userDataJson["rms_min"] = 0.0;
        userDataJson["rms_max"] = 0.0;
        console.log("Json data has been initialized...");
      } else {
        userDataJson = response;  // deep copy
        hasPreviousData = true;
        console.log("Loaded json from existing one...");
      }
    })
    .catch(err => {
      console.warn(err);
      userDataJson = {};
    });
  return {userDataJson, hasPreviousData};
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
    "Content-Type": "application/json",
    "participant": stateHandler.participant,
    "date-time": getDateTimeCode(),
  };

  await axios.post(url, userDataJson, {headers: headers})
    .then(res => {
      console.log("Json data has been sent: " + res);
    });
}

export async function loadJsonScript(scriptJson, vowelJson, participant) {
  let pathIta = "";
  let scriptIta;
  pathIta = "ita_scripts/ita_" + participant;
  await import("~/assets/" + pathIta + ".json")
    .then(data => {
      scriptIta = data.default;
    });

  let pathVowel = "";
  let scriptVowel;
  pathVowel = "vowel_scripts/vowel_" + participant;
  await import("~/assets/" + pathVowel + ".json")
    .then(data => {
      scriptVowel = data.default;
    });

  return {scriptIta, scriptVowel};
}

export function updateTimeCodeData(userDataJson, currentCondition, currentTask, currentScriptIndex, type) {
  userDataJson[currentTask][currentCondition]["timecode_" + type][currentScriptIndex] = getTimeCode();
}

export function updateCalibrationData(targetJson, userDataJson, updateTarget, calibratedVal) {
  // update calibration data of {min, max}
  if (updateTarget === "rms_min" || updateTarget === "rms_max") {
    // update data
    targetJson[updateTarget] = calibratedVal;
    userDataJson[updateTarget] = calibratedVal;
  }
}

export function updateCondition(condition, stateHandler) {
  stateHandler.isFirstItem = true;
  stateHandler.selectConditions.state = condition;
}

export function updateTask(task, stateHandler) {
  stateHandler.isFirstItem = true;
  stateHandler.selectTasks.state = task;
}

export function updateLength(stateHandler, targetJson) {
  stateHandler.scriptLength = targetJson["normal"]["no"].length;
  // NOTE: first and last slide -> 2
  stateHandler.slideLength = targetJson["normal"]["no"].length + 2;
}

// switch target data on selecting
export function getTargetJson(stateHandler, scriptJson, vowelJson) {
  let target;
  if (stateHandler.selectTasks.state === "ita") {
    // target = JSON.parse(JSON.stringify(scriptJson));
    target = scriptJson;
  } else if (stateHandler.selectTasks.state === "vowel") {
    // target = JSON.parse(JSON.stringify(vowelJson));
    target = vowelJson;
  }
  return target;
}

export function updateScriptIndex(stateHandler, targetJson, isNext = false) {
  if (isNext) {
    stateHandler.currentScriptIndex++;
  } else {
    stateHandler.currentScriptIndex--;
  }
}

export function updateScript(stateHandler, targetJson) {
  // update string for script
  stateHandler.currentScriptNo = targetJson[stateHandler.selectConditions.state]["no"][stateHandler.currentScriptIndex];
  stateHandler.currentScriptContent = targetJson[stateHandler.selectConditions.state]["content"][stateHandler.currentScriptIndex];
}

export function updateSlide(stateHandler, scriptJson, isNext = false) {
  if (isNext) {
    stateHandler.currentSlideIndex++;
  } else {
    stateHandler.currentSlideIndex--;
  }
}

export function updateState(audioHandler, stateHandler) {
  // update state
  if (stateHandler.selectConditions.state === "muffled") {
    if (0 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 25) {
      stateHandler.barColor = "teal";
    } else {
      stateHandler.barColor = "blue-grey darken-3";
    }
  } else if (stateHandler.selectConditions.state === "low") {
    if (25 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 50) {
      stateHandler.barColor = "teal";
    } else {
      stateHandler.barColor = "blue-grey darken-3";
    }
  } else if (stateHandler.selectConditions.state === "normal") {
    if (50 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 75) {
      stateHandler.barColor = "teal";
    } else {
      stateHandler.barColor = "blue-grey darken-3";
    }
  } else if (stateHandler.selectConditions.state === "high") {
    if (75 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 100) {
      stateHandler.barColor = "teal";
    } else {
      stateHandler.barColor = "blue-grey darken-3";
    }
  }
}

export function changeVisibility(stateHandler) {
  stateHandler.isDisplayed = !stateHandler.isDisplayed;
}

export function setLocalStorage(key, val) {
  // userDataJson -> userDataJson_{participants}_{datetime}
  // if (key === "userDataJson") {
  // once, save the latest one
  // localStorage.setItem(key, val);
  // next, save as temporally data
  // NOTE: to extract data, type your desirable one on the browser
  // key = key + "_" + stateHandler.participant + "_" + getDateTimeCode();
  // localStorage.setItem(key, val);
  // }
  localStorage.setItem(key, val);
}

export function getLocalStorage(key) {
  return localStorage.getItem(key);
}
