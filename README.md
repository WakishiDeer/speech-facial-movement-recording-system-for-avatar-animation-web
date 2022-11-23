# WEB-based system to record multi-modal data with Japanese scripts at the different volume levels

## Setup and Run

Please make sure you have already
cloned [parent repository](https://github.com/WakishiDeer/speech-facial-movement-recording-system-for-avatar-animation)
and
its
subcomponents ([ITA-corpus](https://github.com/WakishiDeer/ita-corpus) and this WEB implementation) and run
the `src/script_randomizer/script_random_generator_ita.py`.

If you haven't installed Node.js, please install it first.
In addition, `yarn` is also required.

After installing them, run the following command in the root directory of the project to install dependencies.

```bash
$ yarn install
```

To run the both server and client, select one for your purpose.

```zsh
# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

We recommend using Chrome for the desired experience due to browser compatibility for the recording features.

Recorded data will be saved in the `assets/user_data` directory.

We note that we assume facial movement data is recorded with the external iOS
app, [Live Link Face](https://apps.apple.com/us/app/live-link-face/id1495370836).
This app is specially designed for UnrealEngine for live animation, but it also generates CSV files that includes 52
ARKit blendshapes-based facial movement and nine head and eyes rotation values.
You can synchronize speech audio, facial video, and facial movement data by using the timecode.

## Technical Details

This front-end components are based on Nuxt.js and Vuetify.
For now, we used `nuxt v2.15.18` and `vue v2.6.14` as a framework.
Please be careful when you customize your code, because we used `@nuxt/composition-api` as a plugin, which means you
should write neither Options API nor Vue 3 (pure Composition API).

For the another notable feature, we used `RecordRTC.js` for advanced recording, because default MediaRecorder API does
not support
WAVE format (see https://recordrtc.org/ and https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).

On the other hand, there is a back-end system, named `server.js`, localed in `api` directory.
This is written in Node.js with Express.js.
Basically, this provides APIs for the incoming requests from front-end.

## Coding Policy

To make easier to maintain or customize the code, we follow some rules:

- Do not change values outside the parent component.
- Value calculation or inevitable change should be done in the external JavaScript function, located in the `plugins`
  folder.
- Vue files are divided into each type of components.

## Contribution

Any questions, suggestions, and contributions are welcome.
Please use the issue page of this repository.

## License

This project is licensed under the MIT License.
