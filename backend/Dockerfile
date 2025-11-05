# Backend Dockerfile

# Base stage for shared environment setup
FROM node:18-alpine AS base

RUN apk add --no-cache curl

RUN npm i -g @nestjs/cli

WORKDIR /app

COPY package*.json .npmrc* ./

# RUN npm install
RUN npm ci






#Development build
FROM base AS development

COPY . .


# RUN npm run build

# RUN mkdir -p /app/dist/src/config

# COPY src/config/serviceAccountKey.json /app/dist/src/config/serviceAccountKey.json
# COPY src/config/serviceAccountKey.json /app/src/config/serviceAccountKey.json


CMD ["npm", "run", "start:debug"]







#Production build
FROM base AS production

COPY . .

COPY src/config/serviceAccountKey.json /app/src/config/serviceAccountKey.json

RUN npm run build

CMD ["npm", "run", "start:prod"]
