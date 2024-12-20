FROM node:18

WORKDIR /usr/app

#Express app
COPY ./app/src/package*.json ./src/
RUN npm install --prefix ./src

COPY ./app/src ./src

#React app
WORKDIR /usr/app/client

COPY ./app/client/package*.json ./package.json
COPY ./app/client/package-lock.json ./package-lock.json
RUN npm install

COPY ./app/client/ .

RUN npm run build

WORKDIR /usr/app/src

ARG APP_PORT
ENV APP_PORT=${APP_PORT}
EXPOSE ${APP_PORT}

CMD ["sh", "-c", "npx knex migrate:latest && node index.js"]
