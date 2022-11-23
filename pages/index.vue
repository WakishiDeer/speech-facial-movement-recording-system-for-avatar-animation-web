<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height class="mx-auto" v-if="userDataJson">
        <v-row align="center" justify="center" class="d-flex justify-space-around mx-auto text-center">
          <Forms :state-handler="stateHandler" :user-data-json="userDataJson"
                 @update-id="updateID" @update-condition="updateCondition"
                 @update-task="updateTask"/>

          <MediaControllers :state-handler="stateHandler" :audio-handler="audioHandler" :video-handler="videoHandler"
                            :wave-handler="waveHandler"
                            @update-mic-params="updateMicParams" @start-animation="startAnimation"
                            @update-media-params="updateMediaParams"/>

          <v-spacer/>

          <ImageViewers :state-handler="stateHandler"
                        @change-visibility="changeImageVisibility"/>

          <CalibrationControllers :audio-handler="audioHandler" :state-handler="stateHandler"
                                  @update-calibration-count-min="updateCalibrationCountMin"
                                  @update-calibration-count-max="updateCalibrationCountMax"
                                  @update-calibration-min="updateCalibrationMin"
                                  @update-calibration-max="updateCalibrationMax"
                                  @update-calibration-user-data="updateCalibrationUserData"/>
          />
        </v-row>

        <v-row>
          <VolumeMeter :audio-handler="audioHandler" :state-handler="stateHandler"/>
          {{ audioHandler.rmsValue }}
        </v-row>

        <v-row>
          <ScriptControllers :key="rerenderNum"
                             :state-handler="stateHandler" :user-data-json="userDataJson"
                             @on-sleep="changeTransitionBtnVisibility"
                             @on-next="updateSlideNext" @on-prev="updateSlidePrev"/>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
p {
  font-family: "UD Digi Kyokasho N-R", serif;
  line-height: 180%;
}
</style>

<script>
import {isReactive, reactive, toRefs} from "vue";
import {
  getLocalStorage,
  loadUserDataJson,
  getUpdatedScriptLength,
  saveUserDataJson,
  setLocalStorage,
  goToNextSlide,
  goToPrevSlide,
  getCurrentScriptNoContent, getScriptIndex, getTask, getCondition, getSlideIndex,
} from "~/plugins/state_handler";
import Forms from "~/pages/Forms";
import MediaControllers from "~/pages/MediaControllers";
import ImageViewers from "~/pages/ImageViewers";
import CalibrationControllers from "~/pages/CalibrationControllers";
import VolumeMeter from "~/pages/VolumeMeter";
import ScriptControllers from "~/pages/ScriptControllers";
import {doAnimation, loadRmsAvgData} from "~/plugins/audio_handler";
import {
  startVideoRecorder,
  startWaveRecorder,
  stopVideoRecorder,
  stopWaveRecorder
} from "~/plugins/media_stream_recorder";
import {defineComponent, onBeforeMount, watch} from '@nuxtjs/composition-api'


export default defineComponent({
  name: 'IndexPage',
  components: {ScriptControllers, VolumeMeter, CalibrationControllers, ImageViewers, MediaControllers, Forms},
  setup() {
    // ON CREATED
    // data declaration
    const stateHandler = reactive({
      // participant
      participant: "e72e6fba-8ed3-5cde-9ff6-36f062e1e51b",  //default
      // buttons
      showMicBtn: true,
      showMinBtn: false,
      showMaxBtn: false,
      showVideoBtn: true,
      showTransitionButton: true,
      // reference img
      isDisplayed: false,
      // volume bars
      isAnimated: false,
      barColor: "blue-gray",
      // scripts
      conditions: ["normal", "low", "high", "muffled"],
      selectConditions: {state: "normal"},
      tasks: ["ita", "vowel"],
      selectTasks: {state: "ita"},
      currentScriptIndex: 0,
      currentScriptContent: "",
      currentScriptNo: "",
      scriptLength: 0,
      // slide
      currentSlideIndex: 0,
      slideLength: 0,
      sleepTimeMs: 2000,
    });
    const timeHandler = reactive({
      hour: 0,
      min: 0,
      sec: 0,
      msec: 0,
      adjustedMsec: 0,
      timeCode: "00-00-00-00",
    });
    const audioHandler = reactive({
      // values
      calibrationCountTotal: 5,  // the times of trial to calibrate
      calibrationCountMin: 0,
      calibrationCountMax: 0,
      minRms: 0.0,
      maxRms: 0.0,
      minRmsAvg: 0.0,
      maxRmsAvg: 0.0,
      sampleRate: 48000,
      rmsValue: 0.0,
      adjustedRmsValue: 0.0,
      // state
      hasRmsValue: false,
      // audio set up
      audioCtx: null,
      stream: null,
      input: null,
      analyzer: null,
    });
    const videoHandler = reactive({
      // setting for video
      sampleRate: 48000,
      mimeType: "",
      extension: "",
      // video name
      clipNameCandidate: "",
      // objects
      stream: null,
      videoRecorder: null,
    });
    const waveHandler = reactive({
      sampleRate: 48000,
      mimeType: "",
      extension: "",
      clipNameCandidate: "",
      stream: null,
      waveRecorder: null,
    });
    // wrap with "data" to retain reactivity
    // let userDataJson = reactive({"data": {}});
    let userDataJson = reactive({});

// methods
// forms
const updateID = (participant) => {
  stateHandler.participant = participant;
};
const updateCondition = (condition) => {
  stateHandler.selectConditions.state = condition;
};
const updateTask = (task) => {
  stateHandler.selectTasks.state = task;
};
const updateScriptSlideLength = (scriptLength, slideLength) => {
  stateHandler.scriptLength = scriptLength;
  stateHandler.slideLength = slideLength;
};
const updateScriptSlideIndex = (scriptIndex, slideIndex) => {
  stateHandler.currentScriptIndex = scriptIndex;
  stateHandler.currentSlideIndex = slideIndex;
};
const updateScriptNoContent = (currentScriptNo, currentScriptContent) => {
  stateHandler.currentScriptNo = currentScriptNo;
  stateHandler.currentScriptContent = currentScriptContent;
};
// media controllers
const updateMicParams = (stream, input, analyzer, showMicBtn, showMinBtn, showMaxBtn) => {
  audioHandler.stream = stream;
  audioHandler.input = input;
  audioHandler.analyzer = analyzer;
  stateHandler.showMicBtn = showMicBtn;
  stateHandler.showMinBtn = showMinBtn;
  stateHandler.showMaxBtn = showMaxBtn;
};
const startAnimation = () => {
  const {isAnimated, fftSize} = doAnimation(stateHandler, audioHandler);
  stateHandler.isAnimated = isAnimated;
  audioHandler.analyzer.fftSize = fftSize;
};
const updateMediaParams = (videoStream, videoMimeType, videoExtension, videoRecorder,
                           wavStream, wavMimeType, wavExtension, wavRecorder) => {
  videoHandler.stream = videoStream;
  videoHandler.mimeType = videoMimeType;
  videoHandler.extension = videoExtension;
  videoHandler.videoRecorder = videoRecorder;
  waveHandler.stream = wavStream;
  waveHandler.mimeType = wavMimeType;
  waveHandler.extension = wavExtension;
  waveHandler.waveRecorder = wavRecorder;
  // disable if both streams have been set
  if (videoHandler.stream !== null && waveHandler.stream !== null) {
    stateHandler.showVideoBtn = false;
  }
}
// image viewer
const changeImageVisibility = (isDisplayed) => {
  stateHandler.isDisplayed = isDisplayed;
};
// calibration controllers
const updateCalibrationMin = (calibrationCountMin, minRms, minRmsAvg, showMinBtn) => {
  audioHandler.calibrationCountMin = calibrationCountMin;
  audioHandler.minRms = minRms;
  audioHandler.minRmsAvg = minRmsAvg;
  stateHandler.showMinBtn = showMinBtn;
};
const updateCalibrationMax = (calibrationCountMax, maxRms, maxRmsAvg, showMaxBtn) => {
  audioHandler.calibrationCountMax = calibrationCountMax;
  audioHandler.maxRms = maxRms;
  audioHandler.maxRmsAvg = maxRmsAvg;
  stateHandler.showMaxBtn = showMaxBtn;
  // update calibration data for userDataJson
};
const updateCalibrationUserData = (updateTarget, calibratedRmsAvg) => {
  // update calibrated rms avg data to userDataJson
  userDataJson[updateTarget] = calibratedRmsAvg;
  saveUserDataJson(userDataJson, stateHandler);
}
// script controller
const changeTransitionBtnVisibility = (isDisabled) => {
  stateHandler.showTransitionButton = isDisabled;
};
const updateTimecode = (timecode, type) => {
  const currentScriptIndex = getScriptIndex(stateHandler);
  const task = getTask(stateHandler);
  const condition = getCondition(stateHandler);
  userDataJson[task][condition]["timecode_" + type][currentScriptIndex] = timecode;
};
const updateSlideNext = (event, on) => {
  // update script and slide indices
  const currentScriptIndex = getScriptIndex(stateHandler);
  const currentSlideIndex = getSlideIndex(stateHandler);
  updateScriptSlideIndex(currentScriptIndex + 1, currentSlideIndex + 1);
  // get updated script no and content
  const {currentScriptNo, currentScriptContent} = getCurrentScriptNoContent(stateHandler, userDataJson);
  updateScriptNoContent(currentScriptNo, currentScriptContent);
  // media manipulations
  // note script index was already updated
  mediaManipulationNext();
  // transit
  goToNextSlide(event, on);
};
const mediaManipulationNext = () => {
  if (stateHandler.currentSlideIndex === 1) {
    // when {currentSlideIndex === 1} (i.e., the first slide of the script)
    startMediaRecording();
  } else if (stateHandler.currentSlideIndex === stateHandler.slideLength - 1) {
    // when {currentSlideIndex === slideLength - 1 === 101} (i.e., "Finish" slide)
    stopMediaRecording();
  } else {
    // within script transition
    stopMediaRecording();
    startMediaRecording();
  }
};
const updateSlidePrev = (event, on) => {
  // update script and slide indices
  const currentScriptIndex = getScriptIndex(stateHandler);
  const currentSlideIndex = getSlideIndex(stateHandler);
  updateScriptSlideIndex(currentScriptIndex + 1, currentSlideIndex + 1);
  // get updated script no and content
  const {currentScriptNo, currentScriptContent} = getCurrentScriptNoContent(stateHandler, userDataJson);
  updateScriptNoContent(currentScriptNo, currentScriptContent);
  // media manipulations
  // note script index was already updated
  mediaManipulationPrev();
  // transit
  goToPrevSlide(event, on);
};
const mediaManipulationPrev = () => {
  if (stateHandler.currentScriptIndex === 0) {
    // when {currentSlideIndex === 0}
    stopMediaRecording();
  } else if (stateHandler.currentSlideIndex === stateHandler.slideLength - 2) {
    // when {currentSlideIndex === slideLength - 2 === 100} (i.e., Last slide of the script)
    startMediaRecording();
  } else {
    // within script transition
    stopMediaRecording();
    startMediaRecording();
  }
};
const startMediaRecording = () => {
  if (videoHandler.videoRecorder !== null && waveHandler.waveRecorder !== null) {
    // start recording
    startVideoRecorder(videoHandler);
    startWaveRecorder(waveHandler, stateHandler);
  }
};
const stopMediaRecording = () => {
  if (videoHandler.videoRecorder !== null && waveHandler.waveRecorder !== null) {
    // stop recording
    stopVideoRecorder(videoHandler);
    stopWaveRecorder(waveHandler, stateHandler);
  }
};

// name setting
onBeforeMount(async () => {
  // default loading
  const localStorage = window.localStorage;
  const participantCandidate = getLocalStorage(localStorage, "participant");
  // take over the existing data
  if (!(participantCandidate === null)) {
    // when cache is valid, set existing name
    stateHandler.participant = participantCandidate;
  }
  // load json file of user data
  const userDataJsonNew = await loadUserDataJson(stateHandler.participant);
  userDataJson = Object.assign(userDataJson, userDataJsonNew);

  // initialize length of scripts
  const {scriptLength, slideLength} = getUpdatedScriptLength(stateHandler, userDataJson);
  updateScriptSlideLength(scriptLength, slideLength);
  // initialize audio
  try {
    const {minRmsAvg, maxRmsAvg, isZero} = loadRmsAvgData(userDataJson);
    audioHandler.minRmsAvg = minRmsAvg;
    audioHandler.maxRmsAvg = maxRmsAvg;
    if (isZero) {
      // if not calibrated, show calibration button
      audioHandler.showMinBtn = true;
      audioHandler.showMaxBtn = true;
    }
  } catch (e) {
    // invalid max/min rms avg data
    // i.e., minRmsAvg > maxRmsAvg
    console.error(e);
  }
  setLocalStorage(localStorage, "participant", stateHandler.participant);
  // setLocalStorage(localStorage, "userDataJson", JSON.stringify(userDataJson));
  console.log(isReactive(userDataJson["ita"]));
});

console.log(JSON.stringify(userDataJson));
watch(
  () => userDataJson,
  (next, prev) => {
    // update userDataJson
    console.log("userDataJson updated");
  },
  {deep: true}
)

return {
  stateHandler,
  timeHandler,
  audioHandler,
  videoHandler,
  waveHandler,
  userDataJson,
  updateID,
  updateCondition,
  updateTask,
  updateScriptSlideLength,
  updateScriptSlideIndex,
  updateScriptNoContent,
  updateMicParams,
  startAnimation,
  updateMediaParams,
  changeImageVisibility,
  updateCalibrationMin,
  updateCalibrationMax,
  updateCalibrationUserData,
  changeTransitionBtnVisibility,
  updateSlideNext,
  updateSlidePrev,
};
}
}
)
;
</script>
