<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height class="mx-auto">
        <v-row align="center" justify="center" class="d-flex justify-space-around mx-auto text-center">
          <Forms :rules="rules" :script-json="scriptJson" :vowel-json="vowelJson"
                 :state-handler="stateHandler" @update-target-json="targetJson = $event"/>

          <MediaControllers :state-handler="stateHandler" :audio-handler="audioHandler" :video-handler="videoHandler"
                            :wave-handler="waveHandler" :time-handler="timeHandler"/>

          <v-spacer/>

          <ImageViewers :state-handler="stateHandler"/>

          <CalibrationControllers :audio-handler="audioHandler" :state-handler="stateHandler"
                                  :time-handler="timeHandler" :target-json="targetJson" :user-data-json="userDataJson"/>
        </v-row>

        <v-row>
          <VolumeMeter :audio-handler="audioHandler" :state-handler="stateHandler"/>
          {{ (audioHandler.rmsValue).toFixed(5) }}
        </v-row>

        <v-row>
          <ScriptControllers :state-handler="stateHandler" :video-handler="videoHandler" :wave-handler="waveHandler"
                             :time-handler="timeHandler" :target-json="targetJson" :user-data-json="userDataJson"
                             @on-sleep="stateHandler.showTransitionButton = $event"
                             @finished-sleep="stateHandler.showTransitionButton = $event"/>
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
import scriptJson from "~/assets/ita_scripts/ita_e72e6fba-8ed3-5cde-9ff6-36f062e1e51b.json";
import vowelJson from "~/assets/vowel_scripts/vowel_e72e6fba-8ed3-5cde-9ff6-36f062e1e51b.json";
import {
  getLocalStorage, getTargetJson,
  initializeJsonData,
  loadJsonScript, postSaveUserDataJson, updateLength,
} from "~/plugins/state_handler";
import Forms from "~/pages/Forms";
import MediaControllers from "~/pages/MediaControllers";
import ImageViewers from "~/pages/ImageViewers";
import CalibrationControllers from "~/pages/CalibrationControllers";
import VolumeMeter from "~/pages/VolumeMeter";
import ScriptControllers from "~/pages/ScriptControllers";

export default {
  name: 'IndexPage',
  components: {ScriptControllers, VolumeMeter, CalibrationControllers, ImageViewers, MediaControllers, Forms},
  data() {
    return {
      rules: [value => !!value || 'Required',
      ],
      scriptJson: scriptJson,
      vowelJson: vowelJson,
      targetJson: scriptJson,
      userDataJson: {},
      stateHandler: {
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
        // video
        isValidVideoRecorder: false,
        // wave
        isValidWaveRecorder: false,
        // scripts
        conditions: ["normal", "low", "high", "muffled"],
        selectConditions: {state: "normal"},
        tasks: ["ita", "vowel"],
        selectTasks: {state: "ita"},
        currentScriptIndex: 0,
        currentScriptContent: "",
        currentScriptNo: "",
        isFirstItem: true,
        isLastItem: false,
        scriptLength: 0,
        // slide
        currentSlideIndex: 0,
        slideLength: 0,
      },
      timeHandler: {
        hour: 0,
        min: 0,
        sec: 0,
        msec: 0,
        adjustedMsec: 0,
        timeCode: "00-00-00-00",
      },
      audioHandler: {
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
      },
      videoHandler: {
        // setting for video
        sampleRate: 48000,
        mimeType: "",
        extension: "",
        // video name
        clipNameCandidate: "",
        // objects
        stream: null,
        videoRecorder: null,
      },
      waveHandler: {
        sampleRate: 48000,
        mimeType: "",
        extension: "",
        clipNameCandidate: "",
        stream: null,
        waveRecorder: null,
      },
    }
  },
  methods: {
    // on update task, switch json
    // this is because child-component, `Forms.vue`, cannot change parent's value in its line
  },
  async mounted() {
    // name setting
    const participantCandidate = getLocalStorage("participant");
    // take over the existing data
    if (!(participantCandidate === null)) {
      // when cache is valid, set existing name
      this.stateHandler.participant = participantCandidate;
    }

    // load `scriptJson` and `vowelJson`
    const scripts = await loadJsonScript(this.scriptJson, this.vowelJson, this.stateHandler.participant);
    this.scriptJson = scripts.scriptIta;
    this.vowelJson = scripts.scriptVowel;

    // initialize targetJson
    this.targetJson = getTargetJson(this.stateHandler, this.scriptJson, this.vowelJson);
    // initialize length
    updateLength(this.stateHandler, this.targetJson);

    // set JSON data to `userDataJson`
    let hasPreviousData = false;
    await initializeJsonData(this.scriptJson, this.vowelJson, this.stateHandler)
      .then(ret => {
        this.userDataJson = ret.userDataJson;
        hasPreviousData = ret.hasPreviousData;
      });
    // if there is no data, create new one
    if (!hasPreviousData) {
      await postSaveUserDataJson(this.userDataJson, this.stateHandler, false);
    }

    // if having previous data, just take over
    this.audioHandler.minRmsAvg = this.userDataJson["rms_min"];
    this.audioHandler.maxRmsAvg = this.userDataJson["rms_max"];
    // update button
    this.audioHandler.showMinBtn = false;
    this.audioHandler.showMaxBtn = false;
  }
}
</script>
