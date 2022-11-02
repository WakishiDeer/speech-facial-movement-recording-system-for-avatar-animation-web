<template>
  <v-col cols="3">
    <v-text-field
      label="Assigned ID" :value="stateHandler.participant" :rules="rules"
      @change="onNameChanged"></v-text-field>
    <v-select v-model="stateHandler.selectConditions.state" :items="stateHandler.conditions"
              @change="updateCondition"></v-select>
    <v-select v-model="stateHandler.selectTasks.state" :items="stateHandler.tasks"
              @change="updateTask"></v-select>
  </v-col>
</template>
<script>
import {
  getTargetJson, initializeScriptIndex, initializeSlideIndex,
  loadJsonScript,
  setLocalStorage,
  updateCondition,
  updateLength,
  updateTask
} from "~/plugins/state_handler";

export default {
  name: 'Forms',
  props: {
    rules: {},
    scriptJson: {},
    vowelJson: {},
    targetJson: {},
    stateHandler: {},
  },
  methods: {
    async onNameChanged(participant) {
      // update cache setting
      setLocalStorage("participant", participant);
      const scripts = await loadJsonScript(this.scriptJson, this.vowelJson, this.stateHandler.participant);
      this.scriptJson = scripts.scriptIta;
      this.vowelJson = scripts.scriptVowel;
      // change participant info
      this.stateHandler.participant = participant;
    },
    updateCondition(condition) {
      updateCondition(condition, this.stateHandler);
    },
    updateTask(task) {
      // update state of task
      updateTask(task, this.stateHandler);
      // switch target script {ita, vowel}
      const target = getTargetJson(this.stateHandler, this.scriptJson, this.vowelJson);
      updateLength(this.stateHandler, target);
      // initialize index
      initializeScriptIndex(this.stateHandler, target);
      initializeSlideIndex(this.stateHandler);
      // let parent update targetJson
      this.$emit("update-target-json", target);
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
