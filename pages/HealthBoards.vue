<template>
  <v-row justify="center">
    <v-card max-width="100%">
      <v-card-text  v-for="(val, key) in stateHandler.serverStateJson" :key="key">
        <v-icon :color="oscServerColor">
          mdi-server
        </v-icon>
        {{ key }}: {{ val }}
      </v-card-text>
    </v-card>
  </v-row>
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
    let oscServerColor = ref("grey darken-3");
    let serverStatusMessage = ref("OSC server is not running");
    watch(() => props.stateHandler.serverStateJson["osc-server-active"], (isOscActive) => {
      // change color
      if (isOscActive) {
        oscServerColor.value = "green darken-3"
        serverStatusMessage.value = "OSC server is running"
      } else {
        oscServerColor.value = "grey darken-3"
        serverStatusMessage.value = "OSC server is not running"
      }
    });
    return {
      oscServerColor,
      serverStatusMessage,
    };
  },
})
</script>

<style scoped>

</style>
