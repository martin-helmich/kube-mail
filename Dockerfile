FROM node:8

WORKDIR /app

COPY package*.json /app/
COPY tsconfig* /app/
COPY src /app/src

RUN npm install -g npm@^6.1.0
RUN npm ci
RUN npm run compile

FROM node:8

WORKDIR /app
COPY package*.json /app/

RUN npm install -g npm@^6.1.0
RUN npm ci --production

FROM node:8-slim

WORKDIR /app

COPY config /app/config
COPY --from=1 /app/node_modules /app/node_modules
COPY --from=0 /app/dist /app/dist

CMD ["/usr/local/bin/node", "dist/server.js"]