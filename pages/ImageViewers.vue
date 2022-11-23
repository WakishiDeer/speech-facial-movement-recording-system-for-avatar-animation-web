<template>
  <v-col cols="5">
    <v-btn
      color="secondary"
      justify="center"
      v-if="!stateHandler.isDisplayed"
      @click="onClickLectureHall">
      <v-icon dark>
        mdi-eye
      </v-icon>
    </v-btn>
    <v-img
      src="/lecture_room.jpg"
      v-if="stateHandler.isDisplayed"
      @click="onClickLectureHall"></v-img>
  </v-col>
</template>
<script>
import {changeVisibility} from "~/plugins/state_handler";
import {defineComponent} from '@nuxtjs/composition-api'


export default defineComponent({
    name: 'ImageViewers',
    props: {
      stateHandler: {},
    },
    setup(props, {emit}) {
      const onClickLectureHall = () => {
        // invert visibility
        const isDisplayed = changeVisibility(props.stateHandler);
        emit("change-visibility", isDisplayed);
      };
      return {
        onClickLectureHall,
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
