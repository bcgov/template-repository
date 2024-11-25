FROM node:16

WORKDIR /usr/app

# Express App
COPY ./app/src/package*.json ./src/
RUN npm install --prefix ./src

COPY ./app/src ./src

# React App
COPY ./app/client/build ./client/build

WORKDIR /usr/app/src

ARG APP_PORT

ENV APP_PORT=${APP_PORT}

EXPOSE ${APP_PORT}

CMD ["node", "index.js"]
