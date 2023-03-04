FROM node:16.19.1-alpine AS builder
WORKDIR /usr/src/app

# copy everything (except things listed in .dockerignore)
COPY ./ ./

# install dependencies
RUN yarn install

# and build page
RUN yarn build


# create a new image
FROM node:16.19.1-alpine AS application
WORKDIR /usr/src/app

# and copy compiled resources to run the app
COPY ./ ./
COPY --from=builder /usr/src/app/.nuxt/dist/server ./.nuxt/dist/server

# overwrite package json
COPY ./package.json.docker ./package.json

# install dependencies
RUN yarn install

# open port 3000
EXPOSE 3000

# set start command
CMD yarn start
