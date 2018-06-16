FROM node:8-slim

WORKDIR /app

COPY node_modules /app/node_modules
COPY config /app/config
COPY dist /app/dist

CMD ["/usr/local/bin/node", "dist/server.js"]