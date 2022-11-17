<template v-if="userDataJson">
  <v-spacer>
    <!-- for each sentence -->
    <v-window show-arrows show-arrows-on-hover>

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

      {{ userDataJson }}
      <!-- todo: make window-item reactive -->
      <!--      <v-window-item-->
      <!--        v-for="(content, idx) in userDataJson[stateHandler.selectTasks.state][stateHandler.selectConditions.state]['content']"-->
      <!--        :key="idx">-->
      <!--        <v-card color="gray" height="500">-->
      <!--          <v-row align="center" justify="center" class="fill-height">-->
      <!--            <div class="pa-16">-->
      <!--              <p style="font-size: 1rem;"-->
      <!--                 class="white&#45;&#45;text">-->
      <!--                {{ idx + 1 }}/{{ stateHandler.scriptLength }}-->
      <!--              </p>-->
      <!--              <p style="font-size: 2.5rem;"-->
      <!--                 class="white&#45;&#45;text"-->
      <!--                 v-html="stateHandler.currentScript">-->
      <!--              </p>-->
      <!--            </div>-->
      <!--          </v-row>-->
      <!--          <v-progress-linear :value="idx + 1" color="primary" height="25">-->
      <!--          </v-progress-linear>-->
      <!--        </v-card>-->
      <!--      </v-window-item>-->

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
import {defineComponent, onMounted, toRef, watchEffect} from '@nuxtjs/composition-api'
import {isReactive, toRefs} from "vue";


export default defineComponent({
    name: 'ScriptControllers',
    props: {
      stateHandler: {},
      userDataJson: {},
    },
    setup(props, {emit}) {
      onMounted(() => {
      });
      const onPrev = async (event, on) => {
        await sleep(props.stateHandler.sleepTimeMs);
        emit("on-prev", event, on);
      };

      const onNext = async (event, on) => {
        // first wait 2 seconds
        await sleep(props.stateHandler.sleepTimeMs);
        emit("on-next", event, on);
      };

      const sleep = async (ms) => {
        // disable any button while sleeping
        emit("on-sleep", false);
        // sleep
        await new Promise(res => setTimeout(res, ms));
        // enable the buttons after sleeping
        emit("on-sleep", true);
      };

      return {
        onPrev,
        onNext,
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
</style>
