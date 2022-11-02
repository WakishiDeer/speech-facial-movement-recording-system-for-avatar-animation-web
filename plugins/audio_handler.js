import {updateState} from "~/plugins/state_handler";


export async function setUpMic(audioHandler, stateHandler) {
  if (audioHandler.stream === null) {
    audioHandler.audioCtx = new AudioContext({sampleRate: audioHandler.sampleRate});
    // media device request
    const audioConstrains = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: audioHandler.sampleRate
    };
    audioHandler.stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstrains,
    });
    audioHandler.input = audioHandler.audioCtx.createMediaStreamSource(audioHandler.stream);
    audioHandler.analyzer = audioHandler.audioCtx.createAnalyser();
    audioHandler.input.connect(audioHandler.analyzer);
    // analyzer settings
    audioHandler.analyzer.smoothingTimeConstant = 0;
    // button
    stateHandler.showMicBtn = false;
    // except when there is an existing data
    if (audioHandler.minRmsAvg <= 0.0) {
      stateHandler.showMinBtn = true;
    }
    if (audioHandler.maxRmsAvg <= 0.0) {
      stateHandler.showMaxBtn = true;
    }
    // animation
    doAnimation(audioHandler, stateHandler);
  }
}

export function updateCalibrationMin(audioHandler, stateHandler) {
  audioHandler.calibrationCountMin++;
  if (audioHandler.calibrationCountMin < audioHandler.calibrationCountTotal) {
    audioHandler.minRms = audioHandler.rmsValue;
    audioHandler.minRmsAvg += audioHandler.minRms;
  } else {
    // over
    audioHandler.minRmsAvg /= audioHandler.calibrationCountTotal;
    stateHandler.showMinBtn = false;
  }
}

export function updateCalibrationMax(audioHandler, stateHandler) {
  audioHandler.calibrationCountMax++;
  if (audioHandler.calibrationCountMax < audioHandler.calibrationCountTotal) {
    audioHandler.maxRms = audioHandler.rmsValue;
    audioHandler.maxRmsAvg += audioHandler.maxRms;
  } else {
    // over
    audioHandler.maxRmsAvg /= audioHandler.calibrationCountTotal;
    stateHandler.showMaxBtn = false;
  }
}

export function doAnimation(audioHandler, stateHandler) {
  if (audioHandler.analyzer !== null && !stateHandler.isAnimated) {
    stateHandler.isAnimated = true;
    audioHandler.analyzer.fftSize = 32768;
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
      audioHandler.rmsValue = Math.sqrt(sumSquares / pcmData.length);
      audioHandler.adjustedRmsValue = calcNormalizedRms(audioHandler) * 100;
      updateState(audioHandler, stateHandler);
    }
    window.requestAnimationFrame(onFrame);
  }
}

export function calcNormalizedRms(audioHandler) {
  return (audioHandler.rmsValue - audioHandler.minRmsAvg) / (audioHandler.maxRmsAvg - audioHandler.minRmsAvg);
}

