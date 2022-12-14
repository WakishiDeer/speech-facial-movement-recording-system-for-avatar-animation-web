import {
  getServerIPJson,
  getServerStateJson,
  getUserDataJson, postConditionList, postOscRecording,
  postSaveUserDataJson,
  postServerState
} from "~/plugins/api_functions";
import {checkUserDataJsonValid} from "~/plugins/utils";
import Vue from "vue";


export async function loadUserDataJson(participant) {
  try {
    const {resData, statusCode, message} = await getUserDataJson(participant);
    return resData;
  } catch (err) {
    throw err;
  }
}

export async function loadServerIPJson() {
  try {
    // resData should be JSON object
    const {resData, statusCode, message} = await getServerIPJson();
    return resData;
  } catch (err) {
    throw err;
  }
}

export async function loadServerStateJson() {
  try {
    const {resData, statusCode, message} = await getServerStateJson();
    return resData;
  } catch (err) {
    throw err;
  }
}

export async function saveUserDataJson(userDataJson, stateHandler) {
  try {
    checkUserDataJsonValid(userDataJson);
  } catch (err) {
    console.error(err);
    return;
  }

  const isTemp = false;
  const {statusCode, message} = postSaveUserDataJson(userDataJson, stateHandler, isTemp);
  console.log("saveUserDataJson: " + message);
}

export async function saveUserDataJsonTemp(userDataJson, stateHandler) {
  try {
    checkUserDataJsonValid(userDataJson);
  } catch (err) {
    console.log(err);
    return;
  }

  const isTemp = true;
  const {statusCode, message} = postSaveUserDataJson(userDataJson, stateHandler, isTemp);
  console.log("saveUserDataJsonTemp: " + message);
}

export async function sendConditionList(conditionList) {
  // note that this is not serverState
  const messageJson = {
    "condition-list": conditionList
  };
  const {statusCode, message} = await postConditionList(messageJson);
  console.log("sendConditionList: " + message);
}

export async function sendIosIP(iosIP) {
  const {statusCode, message} = await postServerState(iosIP, "ios-ip", "updateIosIP");
  console.log("sendIosIP: " + message);
}

export async function sendServerIP(serverIP) {
  const {statusCode, message} = await postServerState(serverIP, "server-ip", "updateServerIP");
  console.log("sendServerIP: " + message);
}

export async function sendParticipant(participant) {
  const {statusCode, message} = await postServerState(participant, "participant", "updateParticipant");
  console.log("sendParticipant: " + message);
}

export async function sendCondition(condition) {
  const {statusCode, message} = await postServerState(condition, "condition", "updateCondition");
  console.log("sendCondition: " + message);
}

export async function sendTask(task) {
  const {statusCode, message} = await postServerState(task, "task", "updateTask");
  console.log("sendTask: " + message);
}

export async function requestStartOscRecording() {
  const isStart = true;
  const {statusCode, message} = await postOscRecording(isStart);
  console.log("requestStartOscRecording: " + message);
}

export async function requestStopOscRecording() {
  const isStart = false;
  const {statusCode, message} = await postOscRecording(isStart);
  console.log("requestStopOscRecording: " + message);
}

export function getScriptIndex(stateHandler) {
  return stateHandler.currentScriptIndex;
}

export function getSlideIndex(stateHandler) {
  return stateHandler.currentSlideIndex;
}

export function getCurrentScriptNoContent(stateHandler, userDataJson) {
  const condition = getCondition(stateHandler);
  const task = getTask(stateHandler);
  const currentScriptIndex = getScriptIndex(stateHandler);
  const currentScriptNo = userDataJson["data"][task][condition]["no"][currentScriptIndex];
  const currentScriptContent = userDataJson["data"][task][condition]["content"][currentScriptIndex];
  return {currentScriptNo, currentScriptContent};
}

export function getCondition(stateHandler) {
  return stateHandler.selectConditions.state;
}

export function getTask(stateHandler) {
  return stateHandler.selectTasks.state;
}

export function getScriptLength(stateHandler, userDataJson) {
  const task = getTask(stateHandler);
  return userDataJson["data"][task]["normal"]["no"].length;
}

export function getSlideLength(stateHandler, userDataJson) {
  const task = getTask(stateHandler);
  return userDataJson["data"][task]["normal"]["no"].length + 2;
}

export function goToNextSlide(event, on) {
  on.click(event);
}

export function goToPrevSlide(event, on) {
  on.click(event);
}

export function updateState(audioHandler, stateHandler) {
  // update state
  const condition = getCondition(stateHandler);
  if (condition === "muffled") {
    if (0 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 33.3) {
      Vue.set(stateHandler, "barColor", "teal");
    } else {
      Vue.set(stateHandler, "barColor", "blue-grey darken-3");
    }
  } else if (condition === "normal") {
    if (33.3 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 66.6) {
      Vue.set(stateHandler, "barColor", "teal");
    } else {
      Vue.set(stateHandler, "barColor", "blue-grey darken-3");
    }
  } else if (condition === "high") {
    if (66.6 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 100) {
      Vue.set(stateHandler, "barColor", "teal");
    } else {
      Vue.set(stateHandler, "barColor", "blue-grey darken-3");
    }
  }
}

export function changeVisibility(stateHandler) {
  return (!stateHandler.isDisplayed);
}

export function setLocalStorage(localStorage, key, val) {
  localStorage.setItem(key, val);
}

export function getLocalStorage(localStorage, key) {
  return localStorage.getItem(key);
}
