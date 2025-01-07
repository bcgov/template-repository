FROM node:20

# Set working directory and prepare permissions
WORKDIR /usr/app

# Copy files and adjust permissions for OpenShift
COPY ./app/src/package*.json ./src/
RUN npm install --prefix ./src

COPY ./app/src ./src

# React app setup
WORKDIR /usr/app/client

COPY ./app/client/package*.json ./package.json
COPY ./app/client/package-lock.json ./package-lock.json
RUN npm install

COPY ./app/client/ .

RUN npm run build

# Adjust directory and file permissions for OpenShift
WORKDIR /usr/app/src
RUN chgrp -R 0 /usr/app && \
    chmod -R g=u /usr/app

ARG APP_PORT
ENV APP_PORT=${APP_PORT}
EXPOSE ${APP_PORT}

# Entry point
CMD ["sh", "-c", "npx knex migrate:latest && node index.js"]
