<template>
  <v-col cols="auto">
    <v-btn
      :disabled="!stateHandler.showMicBtn"
      class="mx-2"
      fab
      dark
      small
      color="primary"
      @click="onMicBtnClicked"
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
      @click="onVideoBtnClicked"
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
import {defineComponent} from '@nuxtjs/composition-api'


export default defineComponent({
    name: 'MediaControllers',
    props: {
      stateHandler: {},
      audioHandler: {},
      videoHandler: {},
      waveHandler: {},
    },
    setup(props, {emit}) {
      const onMicBtnClicked = async () => {
        // initialize stream audio
        const {
          stream,
          input,
          analyzer,
          showMicBtn,
          showMinBtn,
          showMaxBtn
        } = await setUpMic(props.audioHandler);
        // assign variables to state handler in parent component
        emit("update-mic-params", stream, input, analyzer, showMicBtn, showMinBtn, showMaxBtn);
        // start indicator animation in parent component
        emit("start-animation");
      };
      // set up media recorder
      const onVideoBtnClicked = async () => {
        const {videoStream, videoMimeType, videoExtension, videoRecorder} = await setUpMediaVideo(props.videoHandler);
        const {wavStream, wavMimeType, wavExtension, wavRecorder} = await setUpMediaWave(props.waveHandler);
        emit("update-media-params", videoStream, videoMimeType, videoExtension, videoRecorder,
          wavStream, wavMimeType, wavExtension, wavRecorder);
      }

      return {
        onMicBtnClicked,
        onVideoBtnClicked
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
