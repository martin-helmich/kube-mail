FROM node:8

WORKDIR /app
RUN npm install
RUN npm run compile

FROM node:8

WORKDIR /app
RUN npm install --production

FROM node:8-slim

WORKDIR /app

COPY config /app/config
COPY --from=1 node_modules /app/node_modules
COPY --from=0 dist /app/dist

CMD ["/usr/local/bin/node", "dist/server.js"]