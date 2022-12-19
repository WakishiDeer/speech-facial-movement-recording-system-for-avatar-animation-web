import {updateState} from "~/plugins/state_handler";
import {isRmsZero, isRmsMinMaxValid} from "~/plugins/utils";
import Vue from "vue";


export function loadRmsAvgData(userDataJson) {
  // if having previous data, just take over
  const minRmsAvg = userDataJson["data"]["rms_min"];
  const maxRmsAvg = userDataJson["data"]["rms_max"];
  let isZero = false;
  if (isRmsZero(minRmsAvg) || isRmsZero(maxRmsAvg)) {
    // return zeros
    isZero = true;
    return {minRmsAvg, maxRmsAvg, isZero};
  } else if (!isRmsMinMaxValid(minRmsAvg, maxRmsAvg)) {
    throw new Error("Invalid RMS min/max value");
  } else {
    // return previously calibrated data
    return {minRmsAvg, maxRmsAvg, isZero};
  }
}

export async function setUpMic(audioHandler) {
  if (audioHandler.stream === null) {
    const audioCtx = new AudioContext({sampleRate: audioHandler.sampleRate});
    // media device request
    const audioConstrains = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: audioHandler.sampleRate
    };
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstrains,
    });
    const input = audioCtx.createMediaStreamSource(stream);
    const analyzer = audioCtx.createAnalyser();
    input.connect(analyzer);
    // analyzer settings
    analyzer.smoothingTimeConstant = 0;
    // turn off button
    const showMicBtn = false;
    // except when there is an existing data
    let showMinBtn = false;
    if (audioHandler.minRmsAvg <= 0.0) {
      showMinBtn = true;
    }
    let showMaxBtn = false;
    if (audioHandler.maxRmsAvg <= 0.0) {
      showMaxBtn = true;
    }
    return {stream, input, analyzer, showMicBtn, showMinBtn, showMaxBtn};
  }
}

export function doAnimation(stateHandler, audioHandler) {
  let isAnimated = false;
  let fftSize = audioHandler.analyzer.fftSize;
  if (!stateHandler.isAnimated) {
    isAnimated = true;
    fftSize = 32768;
    const bufferLength = audioHandler.analyzer.frequencyBinCount;
    const pcmData = new Float32Array(bufferLength);
    // animation
    const onFrame = () => {
      window.requestAnimationFrame(onFrame);
      audioHandler.analyzer.getFloatTimeDomainData(pcmData);
      let sumSquares = 0.0;
      for (const amplitude of pcmData) {
        sumSquares += amplitude * amplitude;
      }
      const rmsValue = Math.sqrt(sumSquares / pcmData.length);
      const adjustedRmsValue = calcNormalizedRms(audioHandler, rmsValue) * 100;
      Vue.set(audioHandler, "rmsValue", rmsValue);
      Vue.set(audioHandler, "adjustedRmsValue", adjustedRmsValue);
      updateState(audioHandler, stateHandler);
    }
    window.requestAnimationFrame(onFrame);
    return {isAnimated, fftSize};
  }
}

export function calcNormalizedRms(audioHandler, rmsValue) {
  return (rmsValue - audioHandler.minRmsAvg) / (audioHandler.maxRmsAvg - audioHandler.minRmsAvg);
}

