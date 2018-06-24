FROM node:8

WORKDIR /app

COPY package*.json /app/
COPY tsconfig* /app/
COPY src /app/src

RUN npm install
RUN npm run compile

FROM node:8

WORKDIR /app
COPY package*.json /app/
RUN npm install --production
RUN ls -al

FROM node:8-slim

WORKDIR /app

COPY config /app/config
COPY --from=1 /app/node_modules /app/node_modules
COPY --from=0 /app/dist /app/dist

CMD ["/usr/local/bin/node", "dist/server.js"]