<template>
  <v-col cols="2">
    <v-row class="d-flex justify-space-around pa-1 text-center">
      <v-btn
        :disabled="!stateHandler.showMinBtn"
        class="mx-2"
        fab
        dark
        small
        color="secondary"
        @click="updateCalibrationMin"
      >
        {{ audioHandler.minRmsAvg }}
        <v-icon dark>
          mdi-volume-medium
        </v-icon>
      </v-btn>
    </v-row>

    <v-row class="d-flex justify-space-around pa-1 text-center">

      <v-btn
        :disabled="!stateHandler.showMaxBtn"
        class="mx-2"
        fab
        dark
        small
        color="secondary"
        @click="updateCalibrationMax"
      >
        {{ audioHandler.maxRmsAvg }}
        <v-icon dark>
          mdi-volume-high
        </v-icon>
      </v-btn>
    </v-row>
  </v-col>
</template>
<script>
import {updateCalibrationMax, updateCalibrationMin} from "~/plugins/audio_handler";
import {postSaveUserDataJson, setLocalStorage, updateCalibrationData} from "~/plugins/state_handler";

export default {
  name: 'CalibrationControllers',
  props: {
    audioHandler: {},
    stateHandler: {},
    timeHandler: {},
    targetJson: {},
    userDataJson: {},
  },
  methods: {
    updateCalibrationMin() {
      updateCalibrationMin(this.audioHandler, this.stateHandler);
      updateCalibrationData(this.targetJson, this.userDataJson, "rms_min", this.audioHandler.minRmsAvg);
      if (this.audioHandler.calibrationCountMin === this.audioHandler.calibrationCountTotal) {
        this.completeCalibration();
      }
    },
    updateCalibrationMax() {
      updateCalibrationMax(this.audioHandler, this.stateHandler);
      updateCalibrationData(this.targetJson, this.userDataJson, "rms_max", this.audioHandler.maxRmsAvg);
      if (this.audioHandler.calibrationCountMax === this.audioHandler.calibrationCountTotal) {
        this.completeCalibration();
      }
    },
    completeCalibration() {
      setLocalStorage("userDataJson", JSON.stringify(this.userDataJson));
      postSaveUserDataJson(this.userDataJson, this.stateHandler, false);

    },
  }
}
</script>
<style>
p {
  font-family: "UD Digi Kyokasho N-R", serif;
  line-height: 180%;
}
</style>
