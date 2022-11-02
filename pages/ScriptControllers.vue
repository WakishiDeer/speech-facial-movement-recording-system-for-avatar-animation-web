<template>
  <v-spacer>
    <!-- for each sentence -->
    <v-window show-arrows show-arrows-on-hover v-if="targetJson!==null">

      <!-- buttons -->
      <template v-slot:prev="{ on, attrs }">
        <v-btn
          @click="onPrev($event, on)"
          :disabled="!stateHandler.showTransitionButton"
          fab
          dark
          large
          v-bind="attrs"
        >Prev
        </v-btn>
      </template>
      <template v-slot:next="{ on, attrs }">
        <v-btn
          @click="onNext($event, on)"
          :disabled="!stateHandler.showTransitionButton"
          fab
          dark
          large
          v-bind="attrs"
        >Next
        </v-btn>
      </template>

      <!-- items -->
      <v-window-item>
        <v-card color="gray" height="500">
          <v-row align="center" justify="center" class="fill-height">
            <div class="pa-16">
              <p style="font-size: 2.5rem;">
                Press to start..
              </p>
            </div>
          </v-row>
        </v-card>
      </v-window-item>

      <!-- todo: make window-item reactive -->
      <v-window-item v-for="(content, idx) in targetJson[stateHandler.selectConditions.state].content"
                     :key="idx">
        <v-card color="gray" height="500">
          <v-row align="center" justify="center" class="fill-height">
            <div class="pa-16">
              <p style="font-size: 1rem;"
                 class="white--text">
                {{ idx + 1 }}/{{ targetJson[stateHandler.selectConditions.state].content.length }}
              </p>
              <p style="font-size: 2.5rem;"
                 class="white--text"
                 v-html="content">
              </p>
            </div>
          </v-row>
          <v-progress-linear :value="idx + 1" color="primary" height="25">
          </v-progress-linear>
        </v-card>
      </v-window-item>

      <v-window-item>
        <v-card color="gray" height="500">
          <v-row align="center" justify="center" class="fill-height">
            <div class="pa-16">
              <p style="font-size: 2.5rem;">
                Finish..
              </p>
            </div>
          </v-row>
        </v-card>
      </v-window-item>
    </v-window>
  </v-spacer>
</template>
<script>
import {
  initializeScriptIndex,
  postSaveUserDataJson, setLocalStorage,
  updateScript, updateScriptIndex,
  updateSlide,
  updateTimeCodeData
} from "~/plugins/state_handler";
import {
  startVideoRecorder,
  startWaveRecorder,
  stopVideoRecorder,
  stopWaveRecorder
} from "~/plugins/media_stream_recorder";

export default {
  name: 'ScriptControllers',
  props: {
    stateHandler: {},
    videoHandler: {},
    waveHandler: {},
    timeHandler: {},
    targetJson: {},
    userDataJson: {},
  },
  methods: {
    async onPrev(event, on) {
      // first wait a second
      await this.sleep();
      // update index of script
      updateSlide(this.stateHandler, this.targetJson, false);

      // avoid first and last items
      // NOTE: NOT `currentScriptIndex` but `currentSlideIndex`
      if (this.stateHandler.currentSlideIndex === 0) {    // first item
        this.stopMediaRecorders();
      } else if (this.stateHandler.currentSlideIndex === this.stateHandler.slideLength - 2) {    // prev of last item
        this.startMediaRecorders();
      } else {    // within scripts
        this.stopMediaRecorders();
        updateScript(this.stateHandler, this.targetJson, false);
        this.startMediaRecorders();
      }

      // cache userJsonData to localStorage
      setLocalStorage("userDataJson", JSON.stringify(this.userDataJson));
      // save temp json file
      await postSaveUserDataJson(this.userDataJson, this.stateHandler, true);

      // transit
      on.click(event);
      console.log("current slide: " + this.stateHandler.currentSlideIndex);
    },
    async onNext(event, on) {
      // first wait a second
      await this.sleep();
      // update index of script
      updateSlide(this.stateHandler, this.targetJson, true);

      // avoid first and last items
      // NOTE: NOT `currentScriptIndex` but `currentSlideIndex`
      if (this.stateHandler.currentSlideIndex === 1) {    // next of first item
        initializeScriptIndex(this.stateHandler, this.targetJson);
        this.startMediaRecorders();
      } else if (this.stateHandler.currentSlideIndex === this.stateHandler.slideLength - 1) {    // last item
        this.stopMediaRecorders();
        // save data of json including time code
        await postSaveUserDataJson(this.userDataJson, this.stateHandler, false);
      } else {    // within scripts
        this.stopMediaRecorders();
        updateScriptIndex(this.stateHandler, this.targetJson, true);
        updateScript(this.stateHandler, this.targetJson);  // using `stateHandler.currentScriptIndex`
        this.startMediaRecorders();
      }

      // cache userJsonData to localStorage
      setLocalStorage("userDataJson", JSON.stringify(this.userDataJson));
      // save temp json file
      await postSaveUserDataJson(this.userDataJson, this.stateHandler, true);

      // transit
      on.click(event);
      console.log("current slide: " + this.stateHandler.currentSlideIndex);
    },
    async sleep() {
      // disable any button while sleeping
      this.$emit("on-sleep", false);
      // sleep
      await new Promise(res => setTimeout(res, 2000));
      this.$emit("finished-sleep", true);
    },
    startMediaRecorders() {
      if (this.videoHandler.videoRecorder !== null && this.waveHandler.waveRecorder !== null) {
        // update time code before starting media recorder
        updateTimeCodeData(this.userDataJson, this.stateHandler.selectConditions.state,
          this.stateHandler.selectTasks.state, this.stateHandler.currentScriptIndex, "start");
        // start media recorder
        startVideoRecorder(this.videoHandler, this.stateHandler);
        startWaveRecorder(this.waveHandler, this.stateHandler);
      }
    },
    stopMediaRecorders() {
      if (this.videoHandler.videoRecorder !== null && this.waveHandler.waveRecorder !== null) {
        // update time code before stopping media recorder
        updateTimeCodeData(this.userDataJson, this.stateHandler.selectConditions.state,
          this.stateHandler.selectTasks.state, this.stateHandler.currentScriptIndex, "stop");
        // stop media recorder
        stopVideoRecorder(this.videoHandler, this.stateHandler, this.timeHandler);
        stopWaveRecorder(this.waveHandler, this.stateHandler, this.timeHandler);
      }
    }
  }
}
</script>
<style>
p {
  font-family: "UD Digi Kyokasho N-R", serif;
  line-height: 180%;
}
</style>
