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

export function isStatusCode200(statusCode) {
  // if status code is 200, return true. Otherwise, return false
  return statusCode === 200;
}

export function encloseStatusMessageGet(resData, statusCode) {
  let message = "";
  if (isStatusCode200(statusCode)) {
    message = "GET - Success with status code: " + statusCode;
  } else {
    message = "GET - Error with status code: " + statusCode;
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
  return rmsMin < rmsMax;
}

export function isRmsZero(rms) {
  return rms === 0;
}

export function checkExclusive(isNext, isPrev) {
  if ((isNext && isPrev) || (!isNext && !isPrev)) {
    throw new Error("isNext and isPrev are not exclusive");
  }
}

export function isFirstSlide(updatedSlideIndex, isNext, isPrev) {
  try {
    checkExclusive(isNext, isPrev);
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
    checkExclusive(isNext, isPrev);
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
