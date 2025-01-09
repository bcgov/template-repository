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

# Inject environment variables into the React app during the build
ARG REACT_APP_SSO_URL
ARG REACT_APP_KILN_PREVIEW_URL
ARG REACT_APP_KILN_URL
ARG REACT_APP_ENV
ENV REACT_APP_SSO_URL=${REACT_APP_SSO_URL}
ENV REACT_APP_KILN_PREVIEW_URL=${REACT_APP_KILN_PREVIEW_URL}
ENV REACT_APP_KILN_URL=${REACT_APP_KILN_URL}
ENV REACT_APP_ENV=${REACT_APP_ENV}

# Create a .env file for React to read environment variables during the build
RUN echo "REACT_APP_SSO_URL=${REACT_APP_SSO_URL}" >> .env && \
    echo "REACT_APP_KILN_PREVIEW_URL=${REACT_APP_KILN_PREVIEW_URL}" >> .env && \
    echo "REACT_APP_KILN_URL=${REACT_APP_KILN_URL}" >> .env && \
    echo "REACT_APP_ENV=${REACT_APP_ENV}" >> .env


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
