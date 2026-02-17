# Backend Dockerfile
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/
RUN npm install --workspace=backend --production=false

COPY backend/ backend/
COPY tsconfig.base.json ./
RUN npx tsc --project backend/tsconfig.json

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY backend/src/prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000
CMD ["node", "dist/app.js"]
