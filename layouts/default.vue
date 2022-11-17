<template>
  <v-app dark>
    <v-app-bar fixed app>
      <v-toolbar-title v-text="title"/>
    </v-app-bar>
    <v-main>
      <v-container>
        <Nuxt/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'DefaultLayout',
  data() {
    return {
      items: [
        {
          icon: 'mdi-apps',
          title: 'Main',
          to: '/',
        }
      ],
      title: 'Recording with Script',
    }
  },
}
</script>
