FROM --platform=linux/amd64 node:20-bullseye-slim AS base
RUN npm install -g npm@10.5.1

EXPOSE 3010
ENTRYPOINT ["/tini", "--"]

RUN apt-get update -y && apt-get install -y curl

# Add Tini
# Docker has the --init flag now but figured this is more portable for now since it init is platform specific 
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

USER node
WORKDIR /home/node/app

FROM base AS development
ENV NODE_ENV=development
COPY --chown=node:node package*.json ./
RUN npm install
COPY . .
# Use root in dev for installing packages/debugging
USER root
CMD ["npm", "run", "server"]

FROM development AS build
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci

COPY app/build ./app/build
COPY --from=build /home/node/app/build/ .
CMD ["node", "web/server.js"]
