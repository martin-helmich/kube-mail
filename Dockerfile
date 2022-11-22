FROM node:18

WORKDIR /app

COPY package*.json /app/

RUN npm install -g npm@^6.1.0 && npm install

COPY tsconfig* /app/
COPY src /app/src

RUN npm run compile

FROM node:18

WORKDIR /app
COPY package*.json /app/

RUN npm install -g npm@^6.1.0 && npm install --production

FROM node:18-slim

WORKDIR /app

COPY config /app/config
COPY --from=1 /app/node_modules /app/node_modules
COPY --from=0 /app/dist /app/dist

CMD ["/usr/local/bin/node", "dist/server.js"]
