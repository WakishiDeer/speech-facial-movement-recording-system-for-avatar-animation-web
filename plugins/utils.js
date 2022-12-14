import {isReactive} from "vue";

export function consoleReactive(obj) {
  for (const key in obj) {
    if (isReactive(obj[key])) {
      console.log(key);
    } else {
      console.warn(key)
    }
  }
}

export function checkUserDataJsonEmpty(userDataJson) {
  if (userDataJson === null) {
    throw new Error("userDataJson is null");
  }
  if (userDataJson === undefined) {
    throw new Error("userDataJson is undefined");
  }
}

export function checkUserDataJsonValid(userDataJson) {
  try {
    checkUserDataJsonEmpty(userDataJson);
  } catch (e) {
    throw e;
  }
  // if `data` is not contained
  if (userDataJson["data"] === undefined) {
    throw new Error("userDataJson.data is undefined");
  }
  // if no data is contained in `data`
  if (Object.keys(userDataJson["data"]).length === 0) {
    throw new Error("userDataJson.data is empty");
  }
}

export function isStatusCode200(statusCode) {
  // if status code is 200, return true. Otherwise, return false
  return statusCode === 200;
}

export function encloseStatusMessageGet(res) {
  const resData = res.data;
  const statusCode = res.status;
  const statusText = res.statusText;
  let message = "";
  if (isStatusCode200(statusCode)) {
    message = "GET - Success with status code: " + statusCode + " " + statusText;
  } else {
    message = "GET - Error with status code: " + statusCode + " " + statusText;
    throw new Error(message);
  }
  return {resData, statusCode, message};
}

export function encloseStatusMessagePost(statusCode) {
  let message = "";
  if (isStatusCode200(statusCode)) {
    message = "POST - Success with status code: " + statusCode;
  } else {
    message = "POST - Error with status code: " + statusCode;
  }
  return {statusCode, message};
}

export function isRmsMinMaxValid(rmsMin, rmsMax) {
  return rmsMin <= rmsMax;
}

export function isRmsZero(rms) {
  return rms === 0;
}

export function checkExclusive(isNext, isPrev, tolerateFalse = false) {
  if ((isNext && isPrev) || (!isNext && !isPrev)) {
    if (!tolerateFalse) {
      throw new Error("isNext and isPrev are not exclusive");
    }
  }
}

export function isFirstSlide(updatedSlideIndex, isNext, isPrev) {
  try {
    checkExclusive(isNext, isPrev, true);
  } catch (err) {
    console.log(err);
  }
  // slide 0 -> 1
  if (isNext) {
    return updatedSlideIndex === 1;
  }
  // slide 1 -> 0
  if (isPrev) {
    return updatedSlideIndex === 0;
  }
}

export function isLastSlide(updatedSlideIndex, isNext, isPrev, slideLength) {
  try {
    checkExclusive(isNext, isPrev, true);
  } catch (err) {
    console.log(err);
  }

  // slide slideLength - 2 -> slideLength - 1
  if (isNext) {
    return updatedSlideIndex === slideLength - 1;
  }
  // slide slideLength - 1 -> slideLength - 2
  if (isPrev) {
    return updatedSlideIndex === slideLength - 2;
  }
}

export function makeServerIPList(serverIPJson) {
  // given server ip json, return server ip list
  const serverIPList = [];
  for (const key in serverIPJson) {
    for (const ip of serverIPJson[key]) {
      if (ip["family"] === "IPv4") {
        serverIPList.push(ip["address"]);
      }
    }
  }
  return serverIPList;
}

export function isValidIPv4(ip) {
  const regex = new RegExp("^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
  return regex.test(ip);
}
