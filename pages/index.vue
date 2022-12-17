<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height class="mx-auto" v-if="userDataJson">

        <v-row align="center" justify="center" class="d-flex justify-space-around mx-auto text-center">
          <Forms :state-handler="stateHandler" :user-data-json="userDataJson"
                 @update-id="updateID" @update-ios-ip="updateIosIP" @update-server-ip="updateServerIP"
                 @update-condition="updateCondition"
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
        </v-row>

        <v-row justify="center">
          <v-col>
            <Configurations
              class="align-self-center"
              :stateHandler="stateHandler"
            />
          </v-col>
          <v-col>
            <HealthBoard
              v-if="stateHandler.showHealthBoard"
              :stateHandler="stateHandler"
            />
          </v-col>
        </v-row>

        <v-row>
          <VolumeMeter :audio-handler="audioHandler" :state-handler="stateHandler"/>
          {{ audioHandler.rmsValue }}
        </v-row>

        <v-row>
          <ScriptControllers :key="rerenderNum"
                             :state-handler="stateHandler" :user-data-json="userDataJson"
                             @on-sync-btn-clicked="startSyncRecording"
                             @on-next-pass-through="updateSlidePassThroughNext"
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
import {reactive, ref} from "vue";
import {
  getLocalStorage,
  loadUserDataJson,
  saveUserDataJson,
  setLocalStorage,
  goToNextSlide,
  goToPrevSlide,
  getCurrentScriptNoContent,
  getScriptIndex,
  getTask,
  getCondition,
  getSlideIndex,
  getSlideLength,
  getScriptLength,
  saveUserDataJsonTemp,
  sendIosIP,
  loadServerIPJson,
  sendServerIP,
  loadServerStateJson,
  sendTask,
  sendCondition,
  sendParticipant,
  sendConditionList, requestStartOscRecording, requestStopOscRecording,
} from "~/plugins/state_handler";
import HealthBoard from "~/pages/HealthBoards";
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
import {getTimeCode} from "~/plugins/time_handler";
import {checkExclusive, isFirstSlide, isLastSlide, isValidIPv4, makeServerIPList} from "~/plugins/utils";
import Configurations from "~/pages/Configurations";


export default defineComponent({
    name: 'IndexPage',
    components: {
      Configurations,
      HealthBoard,
      ScriptControllers, VolumeMeter, CalibrationControllers, ImageViewers, MediaControllers, Forms
    },
    // beforeRouteLeave(to, from, next) {
    //   // when leaving the page, stop all the media
    //   const checkLeave = window.confirm("Are you sure you want to leave?");
    //   if (checkLeave) {
    //     next();
    //   } else {
    //     next(false);
    //   }
    // },
    // beforeRouteUpdate(to, from, next) {
    //   // when leaving the page, stop all the media
    //   const checkLeave = window.confirm("Are you sure you want to leave?");
    //   if (checkLeave) {
    //     next();
    //   } else {
    //     next(false);
    //   }
    // },
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
        showSyncBtn: false,
        // reference img
        isDisplayed: false,
        // volume bars
        isAnimated: false,
        barColor: "blue-gray",
        // media recordings
        isMediaRecording: false,
        // scripts
        // conditionList: ["normal", "low", "high", "muffled"],
        conditionList: ["normal", "high", "muffled"],
        conditionProgress: {
          normal: 0,
          high: 0,
          muffled: 0,
        },
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
        sleepTimeMs: 100,
        // server state
        serverStateJson: {},
        // Configurations
        isSyncMode: true,
        showHealthBoard: true,
        // osc
        iosIP: "127.0.0.1",
        serverIP: "127.0.0.1",
        serverIPList: ["127.0.0.1"],
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
      let userDataJson = reactive({"data": {}});

      // methods
      // forms
      const updateID = (participant) => {
        stateHandler.participant = participant;
      };

      const updateIosIP = (iosIP) => {
        if (isValidIPv4(iosIP)) {
          stateHandler.iosIP = iosIP;
        }
      };

      const updateServerIP = (serverIP) => {
        if (isValidIPv4(serverIP)) {
          stateHandler.serverIP = serverIP;
        }
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

      const updateSlideIndex = (beforeUpdatedSlideIndex, isNext = false, isPrev = false) => {
        const updateScriptIndex = (scriptIndex) => {
          stateHandler.currentScriptIndex = scriptIndex;
        };

        try {
          checkExclusive(isNext, isPrev, true);
        } catch (error) {
          console.log(error);
        }

        if (isNext) {
          stateHandler.currentSlideIndex = beforeUpdatedSlideIndex + 1;
          // only when slide is not `start` or `finish` slide
          if (!isFirstSlide(stateHandler.currentSlideIndex, isNext, isPrev)
            && !isLastSlide(stateHandler.currentSlideIndex, isNext, isPrev, stateHandler.slideLength)) {
            const beforeUpdatedScriptIndex = getScriptIndex(stateHandler);
            updateScriptIndex(beforeUpdatedScriptIndex + 1);
          }
        } else if (isPrev) {
          stateHandler.currentSlideIndex = beforeUpdatedSlideIndex - 1;
          // only when slide is not `start` or `finish` slide
          if (!isFirstSlide(stateHandler.currentSlideIndex, isNext, isPrev)
            && !isLastSlide(stateHandler.currentSlideIndex, isNext, isPrev, stateHandler.slideLength)) {
            const beforeUpdatedScriptIndex = getScriptIndex(stateHandler);
            updateScriptIndex(beforeUpdatedScriptIndex - 1);
          }
        } else {
          // for initialization, set both slide and script index to 0
          stateHandler.currentSlideIndex = beforeUpdatedSlideIndex;
          updateScriptIndex(beforeUpdatedSlideIndex);
        }
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
      const updateCalibrationCountMin = () => {
        audioHandler.calibrationCountMin += 1;
      };

      const updateCalibrationCountMax = () => {
        audioHandler.calibrationCountMax += 1;
      };

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
      };

      // update calibration data for userDataJson
      const updateCalibrationUserData = (updateTarget, calibratedRmsAvg) => {
        // update calibrated rms avg data to userDataJson
        userDataJson["data"][updateTarget] = calibratedRmsAvg;
        saveUserDataJson(userDataJson, stateHandler);
      }

      // script controller
      const changeTransitionBtnVisibility = (isDisabled) => {
        stateHandler.showTransitionButton = isDisabled;
      };

      const updateTimecode = (timecode, type, isNext = false, isPrev = false) => {
        const updatedScriptIndex = getScriptIndex(stateHandler);
        const updatedSlideIndex = getSlideIndex(stateHandler);
        const slideLength = getSlideLength(stateHandler, userDataJson);
        const task = getTask(stateHandler);
        const condition = getCondition(stateHandler);
        if (type === "start") {
          if (!isLastSlide(updatedSlideIndex, isNext, isPrev, slideLength)) {
            userDataJson["data"][task][condition]["timecode_" + type][updatedScriptIndex] = timecode;
          }
        } else {
          if (isLastSlide(updatedSlideIndex, isNext, isPrev, slideLength)) {
            userDataJson["data"][task][condition]["timecode_" + type][updatedScriptIndex] = timecode;
          } else {
            userDataJson["data"][task][condition]["timecode_" + type][updatedScriptIndex - 1] = timecode;
          }
        }
        // post temporary data
        saveUserDataJsonTemp(userDataJson, stateHandler);
      };

      const startSyncRecording = async () => {
        startMediaRecording(true, false);
        stateHandler.showSyncBtn = false;
        await requestStartOscRecording();
      }

      const stopSyncRecording = async () => {
        stopMediaRecording(true, false);
        await requestStopOscRecording();
      }

      const updateSlidePassThroughNext = (event, on) => {
        const beforeUpdatedSlideIndex = getSlideIndex(stateHandler);
        updateSlideIndex(beforeUpdatedSlideIndex, true, false);
        // we do nothing for media manipulation but only for timecode
        mediaManipulationOverallNext(true);
        // transit
        goToNextSlide(event, on);
        // check if the slide is the last slide
        if (isLastSlide(stateHandler.currentSlideIndex, true, false, stateHandler.slideLength)) {
          // when {currentSlideIndex === slideLength - 1 === 101} (i.e., "Finish" slide)
          saveUserDataJson(userDataJson, stateHandler);
        }
      }

      const mediaManipulationOverallNext = (isThroughoutCondition = false) => {
        if (isThroughoutCondition) {
          // for overall condition, we do not need to manipulate media
          updateTimecode(getTimeCode(), "start", true, false);
        } else {
          // for other conditions, we need to manipulate media
          if (isLastSlide(stateHandler.currentSlideIndex, true, false, stateHandler.slideLength)) {
            stopSyncRecording();
          } else {
            updateTimecode(getTimeCode(), "start", true, false);
          }
        }
      }

      const updateSlideNext = (event, on) => {
        // update script and slide indices
        const beforeUpdatedSlideIndex = getSlideIndex(stateHandler);
        updateSlideIndex(beforeUpdatedSlideIndex, true, false);
        // media manipulations
        // note script index was already updated
        mediaManipulationNext();
        // transit
        goToNextSlide(event, on);
        // check if the slide is the last slide
        if (isLastSlide(stateHandler.currentSlideIndex, true, false, stateHandler.slideLength)) {
          // when {currentSlideIndex === slideLength - 1 === 101} (i.e., "Finish" slide)
          saveUserDataJson(userDataJson, stateHandler);
        }
      };

      const mediaManipulationNext = () => {
        if (stateHandler.currentSlideIndex === 1) {
          // when {currentSlideIndex === 1} (i.e., the first slide of the script)
          startMediaRecording(true, false);
        } else if (stateHandler.currentSlideIndex === stateHandler.slideLength - 1) {
          // when {currentSlideIndex === slideLength - 1 === 101} (i.e., "Finish" slide)
          stopMediaRecording(true, false);
        } else {
          // within script transition
          stopMediaRecording(true, false);
          startMediaRecording(true, false);
        }
      };

      const updateSlidePrev = (event, on) => {
        // update script and slide indices
        const beforeUpdatedSlideIndex = getSlideIndex(stateHandler);
        updateSlideIndex(beforeUpdatedSlideIndex, false, true);
        // media manipulations
        // note script index was already updated
        mediaManipulationPrev();
        // transit
        goToPrevSlide(event, on);
        if (isFirstSlide(stateHandler.currentSlideIndex, false, true)) {
          // when {currentSlideIndex === 0} (i.e., "Start" slide)
          saveUserDataJson(userDataJson, stateHandler);
        }
      };

      const mediaManipulationPrev = () => {
        if (stateHandler.currentScriptIndex === 0) {
          // when {currentSlideIndex === 0}
          stopMediaRecording(false, true);
        } else if (stateHandler.currentSlideIndex === stateHandler.slideLength - 2) {
          // when {currentSlideIndex === slideLength - 2 === 100} (i.e., Last slide of the script)
          startMediaRecording(false, true);
        } else {
          // within script transition
          stopMediaRecording(false, true);
          startMediaRecording(false, true);
        }
      };

      const startMediaRecording = (isNext = false, isPrev = false) => {
        try {
          checkExclusive(isNext, isPrev, true);
        } catch (err) {
          console.log(err);
          return;
        }

        if (videoHandler.videoRecorder !== null && waveHandler.waveRecorder !== null) {
          // start recording
          updateTimecode(getTimeCode(), "start", isNext, isPrev);
          startVideoRecorder(videoHandler);
          startWaveRecorder(waveHandler);
        }
      };

      const stopMediaRecording = (isNext = false, isPrev = false) => {
        try {
          checkExclusive(isNext, isPrev, true);
        } catch (err) {
          console.log(err);
          return;
        }

        if (videoHandler.videoRecorder !== null && waveHandler.waveRecorder !== null) {
          // stop recording
          stopVideoRecorder(videoHandler, stateHandler);
          stopWaveRecorder(waveHandler, stateHandler);
          updateTimecode(getTimeCode(), "stop", isNext, isPrev);
        }
      };

      sendConditionList(stateHandler.conditionList);

      onBeforeMount(async () => {
        // default loading
        const localStorage = window.localStorage;
        const participantCandidate = getLocalStorage(localStorage, "participant");
        // take over the existing data
        if (!(participantCandidate === null)) {
          // when cache is valid, set existing name
          updateID(participantCandidate);
        }
        const iosIPCandidate = getLocalStorage(localStorage, "iosIP");
        if (isValidIPv4(iosIPCandidate)) {
          // when cache is valid, set existing name
          updateIosIP(iosIPCandidate);
        }
        const serverIPCandidate = getLocalStorage(localStorage, "serverIP");
        if (isValidIPv4(serverIPCandidate)) {
          updateServerIP(serverIPCandidate);
        }
        // initialize server's state
        await initializeServerState();

        // load json file of user data
        try {
          await loadUserDataJson(stateHandler.participant)
            .then((userDataJsonNew) => {
              // deep copy
              userDataJson["data"] = Object.assign({}, JSON.parse(JSON.stringify(userDataJsonNew)));
              userDataJson = JSON.parse(JSON.stringify(userDataJson));
              setLocalStorage(localStorage, "userDataJson", JSON.stringify(userDataJson));
            });
        } catch (err) {
          console.error(err);
        }

        // load server's available IP addresses
        try {
          const serverIPJson = await loadServerIPJson()
          stateHandler.serverIPList = makeServerIPList(serverIPJson);
        } catch (err) {
          console.error(err);
        }

        // initialize length of scripts
        const scriptLength = getScriptLength(stateHandler, userDataJson);
        const slideLength = getSlideLength(stateHandler, userDataJson);
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

        // watch the server state interval
        setInterval(async () => {
          // update the server's state
          // only if window is active
          if (document.visibilityState === "visible") {
            stateHandler.serverStateJson = await loadServerStateJson();
          }
        }, 100);
      });

      const initializeServerState = async () => {
        try {
          await sendParticipant(stateHandler.participant);
          await sendCondition(stateHandler.selectConditions.state);
          await sendTask(stateHandler.selectTasks.state);
          await sendServerIP(stateHandler.serverIP);
          await sendIosIP(stateHandler.iosIP);
        } catch (err) {
          console.error(err);
        }
      }

      // watchers
      let rerenderNum = ref(0);
      // when slide length is updated, rerender (for ensuring correct order of slides)
      watch(() => stateHandler.slideLength, () => {
        // count up to force render
        rerenderNum.value++;
      });

      watch(() => stateHandler.participant, async () => {
        // update local storage
        await sendParticipant(stateHandler.participant);
        const localStorage = window.localStorage;
        setLocalStorage(localStorage, "participant", stateHandler.participant);
      });

      // when switching the task
      watch(() => stateHandler.selectTasks.state, async () => {
        await sendTask(stateHandler.selectTasks.state);
        // firstly, update script length
        const scriptLength = getScriptLength(stateHandler, userDataJson);
        const slideLength = getSlideLength(stateHandler, userDataJson);
        updateScriptSlideLength(scriptLength, slideLength);
        // initialize script index and slide index
        updateSlideIndex(0);
        // count up to force render
        rerenderNum.value++;
      });

      // when switching the condition
      watch(() => stateHandler.selectConditions.state, async () => {
        await sendCondition(stateHandler.selectConditions.state);
        // initialize script index and slide index
        updateSlideIndex(0);
        // count up to force render
        rerenderNum.value++;
      });

      watch(() => stateHandler.conditionList, () => {
        if (stateHandler.conditionList.length === 0 && stateHandler.isSyncMode) {
          stopSyncRecording();
        }
      }, {deep: true});

      // watch the progress (deep)
      watch(() => stateHandler.conditionProgress, () => {
        const condition = getCondition(stateHandler);
        // if num of script reached the limit, remove the condition from the list
        if (stateHandler.slideLength - 1 <= stateHandler.conditionProgress[condition]) {
          // remove condition from the list
          stateHandler.conditionList = stateHandler.conditionList.filter((item) => item !== condition);
        }
      }, {deep: true});

      // watch slide index
      watch(() => stateHandler.currentSlideIndex, () => {
        const {currentScriptNo, currentScriptContent} = getCurrentScriptNoContent(stateHandler, userDataJson);
        updateScriptNoContent(currentScriptNo, currentScriptContent);
        const condition = getCondition(stateHandler);
        stateHandler.conditionProgress[condition] = stateHandler.currentSlideIndex;
      });

      watch(() => stateHandler.currentScriptIndex, () => {
      });

      // watch IPs and server state
      watch(() => stateHandler.iosIP, async () => {
        await sendIosIP(stateHandler.iosIP);
        const localStorage = window.localStorage;
        setLocalStorage(localStorage, "iosIP", stateHandler.iosIP);
      });
      watch(() => stateHandler.serverIP, async () => {
        await sendServerIP(stateHandler.serverIP);
        const localStorage = window.localStorage;
        setLocalStorage(localStorage, "serverIP", stateHandler.serverIP);
      });

      // watch sync mode
      watch(() => stateHandler.isSyncMode, () => {
        if (stateHandler.isSyncMode) {
          stateHandler.sleepTimeMs = 100;
        } else {
          stateHandler.sleepTimeMs = 2000;
        }
      });

      // watch audio and video btn
      watch(() => [stateHandler.showMicBtn, stateHandler.showVideoBtn], () => {
        // if both are pressed (hidden), show the sync btn
        stateHandler.showSyncBtn = !stateHandler.showMicBtn && !stateHandler.showVideoBtn;
      });

      // watch the media stream
      watch(() => [videoHandler.videoRecorder?.state, waveHandler.waveRecorder?.state], () => {
        console.log(videoHandler.videoRecorder?.state, waveHandler.waveRecorder?.state);
        if (videoHandler.videoRecorder.state === "recording" && waveHandler.waveRecorder.state === "recording") {
          stateHandler.isMediaRecording = true;
        } else {
          stateHandler.isMediaRecording = false;
        }
      });

      return {
        stateHandler,
        timeHandler,
        audioHandler,
        videoHandler,
        waveHandler,
        userDataJson,
        rerenderNum,
        updateID,
        updateIosIP,
        updateServerIP,
        updateCondition,
        updateTask,
        updateMicParams,
        startAnimation,
        updateMediaParams,
        changeImageVisibility,
        updateCalibrationCountMin,
        updateCalibrationCountMax,
        updateCalibrationMin,
        updateCalibrationMax,
        updateCalibrationUserData,
        changeTransitionBtnVisibility,
        startSyncRecording,
        updateSlideNext,
        updateSlidePrev,
        updateSlidePassThroughNext,
      };
    },
  }
)
;
</script>
