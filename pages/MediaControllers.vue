<template>
  <v-col cols="1">
    <v-btn
      :disabled="!stateHandler.showMicBtn"
      class="mx-2"
      fab
      dark
      small
      color="primary"
      @click="setUpMic"
    >
      <v-icon dark>
        mdi-microphone
      </v-icon>
    </v-btn>

    <v-btn
      :disabled="!stateHandler.showVideoBtn"
      fab
      dark
      small
      color="primary"
      @click="setUpMedia"
    >
      <v-icon>
        mdi-video
      </v-icon>
    </v-btn>
  </v-col>
</template>
<script>
import {setUpMic} from "~/plugins/audio_handler";
import {setUpMediaVideo, setUpMediaWave} from "~/plugins/media_stream_recorder";

export default {
  name: 'MediaControllers',
  props: {
    stateHandler: {},
    audioHandler: {},
    videoHandler: {},
    waveHandler: {},
    timeHandler: {},
  },
  methods: {
    // for audio handler
    setUpMic() {
      setUpMic(this.audioHandler, this.stateHandler);
    },
    // for video handler
    async setUpMedia() {
      await setUpMediaVideo(this.videoHandler);
      await setUpMediaWave(this.waveHandler);
      // disable if both streams have been set
      if (this.videoHandler.stream !== null && this.waveHandler.stream !== null) {
        this.stateHandler.showVideoBtn = false;
      }
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
