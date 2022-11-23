<template>
  <v-col cols="3">
    <v-text-field
      label="Assigned ID" :value="stateHandler.participant" :rules="rules"
      @change="onUpdateID"></v-text-field>
    <v-select v-model="stateHandler.selectConditions.state" :items="stateHandler.conditions"
              @change="onUpdateCondition"></v-select>
    <v-select v-model="stateHandler.selectTasks.state" :items="stateHandler.tasks"
              @change="onUpdateTask"></v-select>
  </v-col>
</template>
<script>
import {defineComponent} from '@nuxtjs/composition-api'


export default defineComponent({
    name: 'Forms',
    props: {
      userDataJson: {},
      stateHandler: {},
    },
    setup(props, {emit}) {
      // data declaration
      // rules for text field
      const rules = [
        val => !!val || 'Name is required',
        val => (val && val.length <= 100) || 'Length must be less than 100 characters!',
      ];

      // methods declaration
      const onUpdateID = (participant) => {
        // pass variables to parent component
        emit("update-id", participant);
      };
      const onUpdateCondition = (condition) => {
        emit("update-condition", condition);
      };
      const onUpdateTask = (task) => {
        emit("update-task", task);
      }
      return {
        rules,
        onUpdateID,
        onUpdateCondition,
        onUpdateTask,
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
