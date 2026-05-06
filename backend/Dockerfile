FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --omit=dev --workspace backend

COPY backend ./backend

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "run", "start", "--workspace", "backend"]
# services: