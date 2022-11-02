import {getTimeCode} from "~/plugins/time_handler";
import axios from "axios";

axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

async function downloadBlob(blob, extension, clipNameCandidate, stateHandler) {
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

export async function setUpMediaVideo(videoHandler) {
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
      videoHandler.stream = stream;
      videoHandler.mimeType = "video/x-matroska;codecs=avc1";
      videoHandler.extension = ".mkv";
      videoHandler.videoRecorder = RecordRTC(videoHandler.stream, {
        type: "video",
        disableLogs: true,
        mimeType: videoHandler.mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 6400000,
      });
    })
    .catch(err => {
      console.error(err);
    });
}

export function stopVideoRecorder(videoHandler, stateHandler, timeHandler) {
  videoHandler.clipNameCandidate = stateHandler.participant + "!" +
    stateHandler.selectConditions.state + "!" + stateHandler.currentScriptNo + "!";
  videoHandler.videoRecorder.stopRecording(stopRecordingCallback);

  function stopRecordingCallback() {
    const blob = videoHandler.videoRecorder.getBlob();
    const no = stateHandler.currentScriptNo;
    downloadBlob(blob, videoHandler.extension, videoHandler.clipNameCandidate, stateHandler)
      .then(r => {
        console.log("Uploaded: " + no);
      });
  }
}

export async function setUpMediaWave(waveHandler) {
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
      waveHandler.stream = stream;
      waveHandler.mimeType = "audio/wav";
      waveHandler.extension = ".wav";
      waveHandler.waveRecorder = RecordRTC(waveHandler.stream, {
        type: "audio",
        disableLogs: true,
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfChannels: 1,
        audioBitsPerSecond: 3200000,
        desiredSampRate: 48000,
        bufferSize: 16384,
        mimeType: waveHandler.mimeType,
      })
    });
}

export function startVideoRecorder(videoHandler) {
  // videoHandler.videoRecorder.reset();
  videoHandler.videoRecorder.startRecording();
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
    downloadBlob(blob, waveHandler.extension, waveHandler.clipNameCandidate, stateHandler)
      .then(r => {
        console.log("Uploaded: " + no);
      });
  }
}
