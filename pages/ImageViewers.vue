<template>
  <v-col cols="5">
    <v-btn
      color="secondary"
      justify="center"
      v-if="!stateHandler.isDisplayed"
      @click="changeVisibility">
      <v-icon dark>
        mdi-eye
      </v-icon>
    </v-btn>
    <v-img
      src="/lecture_room.jpg"
      v-if="stateHandler.isDisplayed"
      @click="changeVisibility"></v-img>
  </v-col>
</template>
<script>
import {changeVisibility} from "~/plugins/state_handler";

export default {
  name: 'ImageViewers',
  props: {
    stateHandler: {},
  },
  methods: {
    changeVisibility() {
      changeVisibility(this.stateHandler);
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
