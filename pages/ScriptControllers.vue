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
                <p style="font-size: 2.5rem;">
                  Press to start..
                </p>
              </v-col>
              <v-col>
                <v-btn
                  v-if="stateHandler.isSyncMode"
                  @click="onSyncBtnClicked"
                  :disabled="!stateHandler.showSyncBtn"
                >
                  Before start, press here to start media recording.
                </v-btn>
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
import {computed, defineComponent} from '@nuxtjs/composition-api'
import {getScriptIndex, getScriptLength} from "~/plugins/state_handler";

export default defineComponent({
    name: 'ScriptControllers',
    props: {
      stateHandler: {},
      userDataJson: {},
    },
    setup(props, {emit}) {
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
      };

      // compute progress bar value
      const progressBarValue = computed(() => {
        const idx = getScriptIndex(props.stateHandler) + 1;
        const len = getScriptLength(props.stateHandler, props.userDataJson);
        return (idx / len) * 100;
      });

      return {
        onPrev,
        onNext,
        onSyncBtnClicked,
        progressBarValue,
      }
    }
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
