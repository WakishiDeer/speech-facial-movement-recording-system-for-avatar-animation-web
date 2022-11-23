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
        @click="onClickCalibrationMin"
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
        @click="onClickCalibrationMax"
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
import {getCalibrationMax, getCalibrationMin} from "~/plugins/audio_handler";
import {defineComponent} from '@nuxtjs/composition-api'

export default defineComponent({
    name: 'CalibrationControllers',
    props: {
      audioHandler: {},
      stateHandler: {},
    },
    setup(props, {emit}) {
      // when completing calibration, save data to local storage and to server
      const onCompletingCalibration = (updateTarget, calibratedRmsAvg) => {
        emit("update-calibration-user-data", updateTarget, calibratedRmsAvg);
      };
      const onClickCalibrationMin = () => {
        // first, update calibration count
        emit("update-calibration-count-min");
        const {
          calibrationCountMin,
          minRms,
          minRmsAvg,
          showMinBtn
        } = getCalibrationMin(props.audioHandler);
        emit("update-calibration-min", calibrationCountMin, minRms, minRmsAvg, showMinBtn);
        if (props.audioHandler.calibrationCountMin === props.audioHandler.calibrationCountTotal) {
          const updateTarget = "rms_min";
          onCompletingCalibration(updateTarget, minRmsAvg);
        }
      };
      const onClickCalibrationMax = () => {
        // first, update calibration count
        emit("update-calibration-count-max");
        const {
          calibrationCountMax,
          maxRms,
          maxRmsAvg,
          showMaxBtn
        } = getCalibrationMax(props.audioHandler);
        emit("update-calibration-max", calibrationCountMax, maxRms, maxRmsAvg, showMaxBtn);
        if (props.audioHandler.calibrationCountMax === props.audioHandler.calibrationCountTotal) {
          const updateTarget = "rms_max";
          onCompletingCalibration(updateTarget, maxRmsAvg);
        }
      };

      return {
        onClickCalibrationMin,
        onClickCalibrationMax,
      }
    },
  }
);
</script>
<style>
p {
  font-family: "UD Digi Kyokasho N-R", serif;
  line-height: 180%;
}
</style>
