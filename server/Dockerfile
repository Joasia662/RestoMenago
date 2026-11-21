FROM node:22-alpine

WORKDIR /app

# dependencies first, so Docker can cache this layer
COPY package*.json ./
RUN npm ci --omit=dev

COPY knexfile.js ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# migrations (+ demo data on an empty database), then the API
CMD ["sh", "-c", "node src/db/prepare.js && node src/server.js"]
