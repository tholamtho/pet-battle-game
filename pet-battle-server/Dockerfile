FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY . .
USER node
EXPOSE 3000
# Applies pending migrations, then starts the API.
CMD ["sh", "-c", "node scripts/migrate.js && node src/server.js"]
