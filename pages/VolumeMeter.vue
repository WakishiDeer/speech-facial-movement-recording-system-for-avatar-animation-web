<template>
  <v-col cols="12">
    <v-progress-linear height="100" :value="audioHandler.adjustedRmsValue" id="volume-meter"
                       :color="stateHandler.barColor">
      <p>
        {{ (audioHandler.adjustedRmsValue).toFixed() }}
      </p>
    </v-progress-linear>
  </v-col>
</template>
<script>
export default {
  name: 'VolumeMeter',
  props: {
    audioHandler: {},
    stateHandler: {}
  }
}
</script>
<style>
p {
  font-family: "UD Digi Kyokasho N-R", serif;
  line-height: 180%;
}
</style>
