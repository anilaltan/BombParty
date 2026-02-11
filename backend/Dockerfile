# backend/Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Backend genelde 3000 veya 3001 portunda çalışır
EXPOSE 3001

CMD ["npm", "start"]