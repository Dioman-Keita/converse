# Node 24 LTS ("Krypton") for both build and runtime.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-slim
# ffmpeg converts voice notes to a format every browser plays (server/utils/voice.ts).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV UPLOADS_DIR=/app/data/uploads
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/db/migrations ./server/db/migrations
# Owned by `node` so the uploads volume starts writable (a named volume copies this ownership).
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
