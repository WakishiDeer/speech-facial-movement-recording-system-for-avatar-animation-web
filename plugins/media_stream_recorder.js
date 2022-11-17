import {postBlob} from "./api_functions";

export async function setUpMediaVideo(videoHandler) {
  // data to be returned
  let videoStream = null;
  let videoMimeType = null;
  let videoExtension = null;
  let videoRecorder = null;
  // audio constrains
  const audioConstrains = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: videoHandler.sampleRate
  };
  // video setting
  await navigator.mediaDevices.getUserMedia({
    audio: audioConstrains,
    video: {
      width: 1920, height: 1080,
      frameRate: {
        min: 60,
        ideal: 60,
        max: 60,
      }
    }
  })
    .then(stream => {
      import("recordrtc/RecordRTC");
      videoStream = stream;
      videoMimeType = "video/x-matroska;codecs=avc1";
      videoExtension = ".mkv";
      videoRecorder = RecordRTC(videoStream, {
        type: "video",
        disableLogs: true,
        mimeType: videoMimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 6400000,
      });
    })
    .catch(err => {
      console.error(err);
    });
  return {videoStream, mimeType: videoMimeType, extension: videoExtension, videoRecorder};
}


export async function setUpMediaWave(waveHandler) {
  // data to be returned
  let wavStream = null;
  let wavMimeType = null;
  let wavExtension = null;
  let wavRecorder = null;
  // audio constrains
  const audioConstrains = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: waveHandler.sampleRate
  };

  // wave setting
  await navigator.mediaDevices.getUserMedia({
    audio: audioConstrains,
    video: false,
  })
    .then(stream => {
      wavStream = stream;
      wavMimeType = "audio/wav";
      wavExtension = ".wav";
      wavRecorder = RecordRTC(wavStream, {
        type: "audio",
        disableLogs: true,
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfChannels: 1,
        audioBitsPerSecond: 3200000,
        desiredSampRate: 48000,
        bufferSize: 16384,
        mimeType: wavMimeType,
      })
    });
  return {wavStream, wavMimeType, wavExtension, wavRecorder};
}

export function startVideoRecorder(videoHandler) {
  // videoHandler.videoRecorder.reset();
  videoHandler.videoRecorder.startRecording();
}

export function stopVideoRecorder(videoHandler, stateHandler) {
  videoHandler.clipNameCandidate = stateHandler.participant + "!" +
    stateHandler.selectConditions.state + "!" + stateHandler.currentScriptNo + "!";
  videoHandler.videoRecorder.stopRecording(stopRecordingCallback);

  function stopRecordingCallback() {
    const blob = videoHandler.videoRecorder.getBlob();
    const no = stateHandler.currentScriptNo;
    postBlob(blob, videoHandler.extension, videoHandler.clipNameCandidate, stateHandler)
      .then(() => {
        console.log("Uploaded: " + no);
      });
  }
}

export function startWaveRecorder(waveHandler) {
  waveHandler.waveRecorder.reset();
  waveHandler.waveRecorder.startRecording();
}

export async function stopWaveRecorder(waveHandler, stateHandler) {
  waveHandler.clipNameCandidate = stateHandler.participant + "!" +
    stateHandler.selectConditions.state + "!" + stateHandler.currentScriptNo + "!";
  waveHandler.waveRecorder.stopRecording(stopRecordingCallback);

  function stopRecordingCallback() {
    const blob = waveHandler.waveRecorder.getBlob();
    const no = stateHandler.currentScriptNo;
    postBlob(blob, waveHandler.extension, waveHandler.clipNameCandidate, stateHandler)
      .then(r => {
        console.log("Uploaded: " + no);
      });
  }
}

