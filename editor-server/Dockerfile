FROM node:20-alpine AS packages-build

WORKDIR /app/packages/parser
COPY packages/parser/package.json packages/parser/tsconfig.json ./
RUN npm install
COPY packages/parser/ .
RUN npm run build

WORKDIR /app/packages/renderer-svg
COPY packages/renderer-svg/package.json packages/renderer-svg/tsconfig.json ./
RUN npm install
COPY packages/renderer-svg/ .
RUN npm run build

FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
COPY --from=packages-build /app/packages /app/packages
RUN npm install --legacy-peer-deps

COPY client/ .
COPY --from=packages-build /app/packages /app/packages
RUN npm run build

FROM node:20-alpine AS server-build

WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package.json ./server/package.json
COPY --from=client-build /app/client/dist ./client/dist

RUN mkdir -p /app/workspace && \
    echo "# SolarWire Workspace" > /app/workspace/README.md

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

WORKDIR /app/server

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]