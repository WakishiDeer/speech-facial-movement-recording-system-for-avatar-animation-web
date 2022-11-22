import {getUserDataJson, postSaveUserDataJson} from "~/plugins/api_functions";
import Vue, {readonly} from "vue";


export async function loadUserDataJson(participant) {
  const {resData, statusCode, message} = await getUserDataJson(participant);
  return resData;
}

export function saveUserDataJson(userDataJson, stateHandler) {
  // save userDataJson
  const isTemp = false;
  const {statusCode, message} = postSaveUserDataJson(userDataJson, stateHandler, isTemp);
  console.log("saveUserDataJson: " + message);
}

export function saveUserDataJsonTemp(userDataJson, stateHandler) {
  // save userDataJson
  const isTemp = true;
  const {statusCode, message} = postSaveUserDataJson(userDataJson, stateHandler, isTemp);
  console.log("saveUserDataJsonTemp: " + message);
}

export function getScriptIndex(stateHandler) {
  return stateHandler.currentScriptIndex;
}

export function getSlideIndex(stateHandler) {
  return stateHandler.currentSlideIndex;
}

export function getCurrentScriptNoContent(stateHandler, userDataJson) {
  const currentScriptIndex = getScriptIndex(stateHandler);
  const currentSlideIndex = getSlideIndex(stateHandler);
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

export function getUpdatedScriptLength(stateHandler, userDataJson) {
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
    if (0 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 25) {
      Vue.set(stateHandler, "barColor", "teal");
    } else {
      Vue.set(stateHandler, "barColor", "blue-grey darken-3");
    }
  } else if (condition === "low") {
    if (25 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 50) {
      Vue.set(stateHandler, "barColor", "teal");
    } else {
      Vue.set(stateHandler, "barColor", "blue-grey darken-3");
    }
  } else if (condition === "normal") {
    if (50 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 75) {
      Vue.set(stateHandler, "barColor", "teal");
    } else {
      Vue.set(stateHandler, "barColor", "blue-grey darken-3");
    }
  } else if (condition === "high") {
    if (75 <= audioHandler.adjustedRmsValue && audioHandler.adjustedRmsValue < 100) {
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
