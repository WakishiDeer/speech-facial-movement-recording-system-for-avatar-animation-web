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


# Building a docker image
After installing [Docker](https://docs.docker.com/desktop/), you need to build an image and then start it.
The image needs a tag name that is added with the option `-t name`,
we use `avater-web` in the below example code, but you can name it however you want.
```
cd speech-facial-movement-recording-system-for-avatar-animation-web
docker build . -t avatar-web
```
After the build is complete, use the image to start a container.

##### First run
The web application is provided on port 3000 in the container.
To access it from your machine use the port option `--port` or for short `-p`,
specify the port you want to use on your machine and the port of the web application (always 3000).
We will be using port 80 on the host machine, this way accessing the web application works with [localhost](http://localhost)
instead of [localhost:3000](http://localhost:3000).
We also link a volume into the container with `-v` (short for `--volume`).
This is to keep user data mappings separate from the image (which allows sharing it) and storing the recorded data on the host computer,
even after the docker container or image are stopped or deleted.
We also add a name (`--name`) for the container, that will simplify stopping the container later.
We will use web as name, but feel free to use anything you like.
```
docker run -p 80:3000 -v ./assets/user_data/:/usr/src/app/assets/user_data --namne web -t avatar-web
```

If you get an error like:
```
docker: Error response from daemon: create ./assets/user_data/:
"./assets/user_data/" includes invalid characters for a local volume name,
only "[a-zA-Z0-9][a-zA-Z0-9_.-]" are allowed.
If you intended to pass a host directory, use absolute path.
```
you can try to change the . of ./assets to `$(pwd)` (linux/macos only):
```
docker run -p 80:3000 -v $(pwd)/assets/user_data/:/usr/src/app/assets/user_data --name web -t avatar-web
```

##### Repeated run
If a container with name (web) was created previously simply start using
```
docker start web
```

##### Stop a running docker container
To stop the application, open a new terminal and execute:
```
docker stop web
```
If you used a name different than web, please adjust accordingly.

If you forgot to use a name, you can list all running containers with:
```
docker ps
```
You will see a table similar to this:
CONTAINER ID   IMAGE        COMMAND                  CREATED         STATUS        PORTS                  NAMES
4be66d30e222   avatar-web   "docker-entrypoint.s…"   5 minutes ago   Up 1 second   0.0.0.0:80->3000/tcp   web

You can stop a container using its ID listed in the above table:
```
docker stop 4be66d30e222
```

For more detailed information on Docker please refer to the [documentation](https://docs.docker.com).


## Technical Details

This front-end components are based on Nuxt.js and Vuetify.
For now, we used `nuxt v2.15.18` and `vue v2.6.14` as a framework.
Please be careful when you customize your code, because we used `@nuxt/composition-api` as a plugin, which means you
should write neither Options API nor Vue 3 (pure Composition API).

For the another notable feature, we used `RecordRTC.js` for advanced recording, because default MediaRecorder API does
not support
WAVE format (see https://recordrtc.org/ and https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).

On the other hand, there is a back-end system, named `index.js`, localed in `api` directory.
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
