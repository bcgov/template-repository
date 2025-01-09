FROM node:20

# Set working directory and prepare permissions
WORKDIR /usr/app

# Copy and install backend dependencies
COPY ./app/src/package*.json ./src/
RUN npm install --prefix ./src

COPY ./app/src ./src

# React app setup
WORKDIR /usr/app/client

# Copy and install React app dependencies
COPY ./app/client/package*.json ./package.json
COPY ./app/client/package-lock.json ./package-lock.json
RUN npm install

COPY ./app/client/ .

# Inject REACT_APP_SSO_URL into the React app during the build
ARG REACT_APP_SSO_URL
ENV REACT_APP_SSO_URL=${REACT_APP_SSO_URL}
RUN echo "REACT_APP_SSO_URL=${REACT_APP_SSO_URL}" > .env

# Build the React app
RUN npm run build

# Adjust directory and file permissions for OpenShift
WORKDIR /usr/app/src
RUN chgrp -R 0 /usr/app && \
    chmod -R g=u /usr/app

# Set the app port
ARG APP_PORT
ENV APP_PORT=${APP_PORT}
EXPOSE ${APP_PORT}

CMD ["node", "index.js"]
