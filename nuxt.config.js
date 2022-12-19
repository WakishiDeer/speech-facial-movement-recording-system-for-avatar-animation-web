import colors from 'vuetify/es5/util/colors'

export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - speech-facial-movement-recording-system-for-avatar-animation-web',
    title: 'speech-facial-movement-recording-system-for-avatar-animation-web',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [{charset: 'utf-8'}, {name: 'viewport', content: 'width=device-width, initial-scale=1'}, {
      hid: 'description',
      name: 'description',
      content: ''
    }, {name: 'format-detection', content: 'telephone=no'},],
    script: [
      {src: "https://www.WebRTC-Experiment.com/RecordRTC.js", defer: true},
    ],
    link: [{rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'}],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    "~/plugins/utils.js",
    "~/plugins/api_functions.js",
    "~/plugins/state_handler.js",
    "~/plugins/audio_handler.js",
    "~/plugins/time_handler.js",
    "~/plugins/media_stream_recorder.js"
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [// https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
    '@nuxtjs/composition-api/module',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    "@nuxtjs/axios",
    "@nuxtjs/proxy",
    "nuxt-webfontloader"
  ],
  webfontloader: {
    google: {
      families: ["Lato:400,700", "Noto+Sans+JP:400,700"]
    }
  },
  serverMiddleware: ["~/server/index.js"],
  axios: {
    proxy: true
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'], theme: {
      dark: true, themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
      },
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend(config, {isDev, isClient}) {
      // disable fs in client side
      config.node = {
        fs: 'empty',
        net: 'empty'
      }
    }
  },
};
