<template>
  <v-row>
    <v-col>
      <v-switch
        :label="`Use video and audio sync`"
        inset
        v-model="stateHandler.isSyncMode"
      />
    </v-col>
    <v-col>
      <v-switch
        :label="`Show health board`"
        inset
        v-model="stateHandler.showHealthBoard"
      />
    </v-col>
    <v-col>
      <v-switch
        :label="`Live Recording`"
        inset
        v-model="stateHandler.isLiveRecording"
      />
    </v-col>
  </v-row>
</template>

<script>
import {defineComponent} from "@nuxtjs/composition-api";

export default defineComponent({
  name: "Configurations",
  props: {
    stateHandler: {},
  },
  setup(props, {emit}) {
    return {};
  },
});
</script>

<style scoped>

</style>
