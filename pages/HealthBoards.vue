<template>
  <v-card class="justify-center">
    <v-card-text class="text-center">
      <v-icon :color="oscServerActivityColor">
        mdi-server
      </v-icon>
      Server Activity: {{ stateHandler.serverStateJson["osc-server-active"] }}
    </v-card-text>
    <v-card-text class="text-center">
      <v-icon :color="oscRecordingColor">
        mdi-radiobox-marked
      </v-icon>
      Server Recording: {{ stateHandler.serverStateJson["is-recording"] }}
    </v-card-text>
    <v-card-text class="text-center">
      <v-icon :color="mediaRecordingColor">
        mdi-radiobox-marked
      </v-icon>
      Browser Recording: {{ stateHandler.isMediaRecording }}
    </v-card-text>
    <v-card-text class="text-center">
      {{ stateHandler.conditionProgress }}
    </v-card-text>
  </v-card>
</template>

<script>
import {defineComponent, watch} from "@nuxtjs/composition-api";
import {ref} from "vue";

export default defineComponent({
  name: "HealthBoard",
  props: {
    stateHandler: {},
  },
  setup(props, {emit}) {
    let oscServerActivityColor = ref("grey darken-3");
    let oscRecordingColor = ref("grey darken-3");
    let mediaRecordingColor = ref("grey darken-3");

    watch(() => props.stateHandler.serverStateJson["osc-server-active"], (isOscActive) => {
      // change color
      if (isOscActive) {
        oscServerActivityColor.value = "green darken-3"
      } else {
        oscServerActivityColor.value = "grey darken-3"
      }
    });

    watch(() => props.stateHandler.serverStateJson["is-recording"], (isRecording) => {
      // change color
      if (isRecording) {
        oscRecordingColor.value = "red darken-3"
      } else {
        oscRecordingColor.value = "grey darken-3"
      }
    });

    watch(() => props.stateHandler.isMediaRecording, (isRecording) => {
      // change color
      if (isRecording) {
        mediaRecordingColor.value = "red darken-3"
      } else {
        mediaRecordingColor.value = "grey darken-3"
      }
    })

    return {
      oscServerActivityColor,
      oscRecordingColor,
      mediaRecordingColor,
    };
  },
})
</script>

<style scoped>

</style>
