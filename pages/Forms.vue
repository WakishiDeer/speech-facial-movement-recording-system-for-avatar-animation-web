<template>
  <v-col cols="3">
    <v-text-field
      label="Assigned ID" :value="stateHandler.participant" :rules="rulesName"
      @change="onUpdateID"></v-text-field>
    <v-text-field
      label="iOS IP address" :value="stateHandler.iosIP" :rules="rulesIP"
      @change="onUpdateIosIP">
      >
    </v-text-field>
    <v-select
      label="Server IP address"
      :items=stateHandler.serverIPList @change="onUpdateServerIP"
    ></v-select>
    <v-select
      label="Condition"
      v-model="stateHandler.selectConditions.state" :items="stateHandler.conditions"
      @change="onUpdateCondition"></v-select>
    <v-select
      label="Task"
      v-model="stateHandler.selectTasks.state" :items="stateHandler.tasks"
      @change="onUpdateTask"></v-select>
  </v-col>
</template>
<script>
import {defineComponent} from '@nuxtjs/composition-api'
import {isValidIPv4} from "~/plugins/utils";

export default defineComponent({
    name: 'Forms',
    props: {
      userDataJson: {},
      stateHandler: {},
    },
    setup(props, {emit}) {
      // data declaration
      // rules for text field
      const rulesName = [
        val => !!val || 'Name is required',
        val => (val && val.length <= 100) || 'Length must be less than 100 characters!',
      ];
      const rulesIP = [
        val => !!val || 'IP is required',
        val => (val && isValidIPv4(val)) || 'IP is not valid!',
      ];

      // methods declaration
      const onUpdateID = (participant) => {
        // pass variables to parent component
        emit("update-id", participant);
      };
      const onUpdateIosIP = (iosIP) => {
        // pass variables to parent component
        emit("update-ios-ip", iosIP);
      };
      const onUpdateServerIP = (serverIP) => {
        emit("update-server-ip", serverIP);
      };
      const onUpdateCondition = (condition) => {
        emit("update-condition", condition);
      };
      const onUpdateTask = (task) => {
        emit("update-task", task);
      }
      return {
        rulesName,
        rulesIP,
        onUpdateID,
        onUpdateIosIP,
        onUpdateServerIP,
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
