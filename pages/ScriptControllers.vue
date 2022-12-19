<template v-if="userDataJson">
  <v-spacer>
    <!-- for each sentence -->
    <v-window show-arrows show-arrows-on-hover>

      <!-- buttons -->
      <template v-slot:prev="{ on, attrs }">
        <v-btn
          class="transparent"
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
          class="transparent"
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
              <v-col class="text-center">
                <p
                  v-if="!stateHandler.isSyncMode"
                  style="font-size: 2.5rem;">
                  Press to start..
                </p>
              </v-col>

              <v-col class="text-center">
                <v-btn
                  width="100%"
                  v-if="stateHandler.isSyncMode"
                  @click="onSyncBtnClicked"
                  :disabled="!stateHandler.showSyncBtn"
                >
                  <v-icon :color="mediaRecordingColor">
                    mdi-radiobox-marked
                  </v-icon>
                  Start Sync
                </v-btn>
              </v-col>

              <v-col class="text-center">
                <v-dialog
                  v-model="stateHandler.showDialogSmartphone"
                  max-width="70%"
                >
                  <template v-slot:activator="{ on }">
                    <v-btn
                      width="100%"
                      v-if="stateHandler.isSyncMode"
                      @click="onBeepSyncBtnClicked"
                      :disabled="!stateHandler.showBeepSyncBtn"
                      v-on="on"
                    >
                      <v-icon color="primary">
                        mdi-cellphone
                      </v-icon>
                      Smartphone Sync
                    </v-btn>
                  </template>
                  <v-card>
                    <v-card-text class="text-h4">
                      <v-icon color="secondary">
                        mdi-play
                      </v-icon>
                      <v-icon color="secondary">
                        mdi-cellphone
                      </v-icon>
                      Play and place your smartphone in front of the camera!
                    </v-card-text>
                    <v-btn
                      @click="onBeepSyncConfirmBtnClicked"
                      color="primary"
                      width="100%"
                    >
                      Done!
                    </v-btn>
                  </v-card>
                </v-dialog>
              </v-col>

              <v-col>
                <v-dialog
                  v-model="stateHandler.showDialogVideo"
                  max-width="70%"
                  hight="70%"
                >
                  <template v-slot:activator="{ on }">
                    <v-btn
                      width="100%"
                      v-if="stateHandler.isSyncMode"
                      :disabled="!stateHandler.showVideoSyncBtn"
                      @click="onVideoSyncBtnClicked"
                      v-on="on"
                    >
                      <v-icon color="primary">
                        mdi-face-recognition
                      </v-icon>
                      Video Sync
                    </v-btn>
                  </template>
                  <iframe width="720" height="480" src="https://www.youtube.com/embed/_66SaA2luMY"
                          title="YouTube video player" frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen></iframe>

                </v-dialog>
              </v-col>
            </div>
          </v-row>
        </v-card>
      </v-window-item>

      <v-window-item
        v-for="idx in stateHandler.scriptLength" :key="idx">
        <v-card color="gray" height="500">
          <v-row align="center" justify="center" class="fill-height">
            <div class="pa-16">
              <p style="font-size: 1rem;"
                 class="white--text">
                {{ idx }}/{{ stateHandler.scriptLength }}
              </p>
              <p style="font-size: 2.5rem;"
                 class="white--text"
                 v-html="stateHandler.currentScriptContent">
              </p>
            </div>
          </v-row>
          <v-progress-linear :value="progressBarValue" color="primary" height="25">
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
import {computed, defineComponent, onMounted, ref} from '@nuxtjs/composition-api';
import {getScriptIndex, getScriptLength} from "~/plugins/state_handler";

export default defineComponent({
    name: 'ScriptControllers',
    props: {
      stateHandler: {},
      userDataJson: {},
    },
    components: {},
    setup(props, {emit}) {
      let mediaRecordingColor = ref("red darken-3");

      const onPrev = async (event, on) => {
        await sleep(props.stateHandler.sleepTimeMs);
        if (props.stateHandler.isSyncMode) {
          // do nothing
        } else {
          emit("on-prev", event, on);
        }
      };

      const onNext = async (event, on) => {
        // first wait 2 seconds
        await sleep(props.stateHandler.sleepTimeMs);
        if (props.stateHandler.isSyncMode) {
          emit("on-next-pass-through", event, on);
        } else {
          emit("on-next", event, on);
        }
      };

      const sleep = async (ms) => {
        // disable any button while sleeping
        emit("on-sleep", false);
        // sleep
        await new Promise(res => setTimeout(res, ms));
        // enable the buttons after sleeping
        emit("on-sleep", true);
      };

      const onSyncBtnClicked = () => {
        emit("on-sync-btn-clicked");
        props.stateHandler.showBeepSyncBtn = true;
      };

      const onBeepSyncBtnClicked = () => {
        emit("on-beep-sync-btn-clicked");
      };

      const onBeepSyncConfirmBtnClicked = () => {
        emit("on-beep-sync-confirm-btn-clicked");
      };

      const onVideoSyncBtnClicked = () => {
        emit("on-video-sync-btn-clicked");
      };

      const onVideoSyncClosed= () => {
        emit("on-video-sync-closed");
      };

      // compute progress bar value
      const progressBarValue = computed(() => {
        const idx = getScriptIndex(props.stateHandler) + 1;
        const len = getScriptLength(props.stateHandler, props.userDataJson);
        return (idx / len) * 100;
      });

      // specify the location of the video

      return {
        onPrev,
        onNext,
        onSyncBtnClicked,
        onBeepSyncBtnClicked,
        onBeepSyncConfirmBtnClicked,
        onVideoSyncBtnClicked,
        onVideoSyncClosed,
        progressBarValue,
        mediaRecordingColor,
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

.transparent {
  background-color: transparent !important;
}
</style>
