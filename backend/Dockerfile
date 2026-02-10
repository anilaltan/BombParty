# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Backend genelde 3000 veya 3001 portunda çalışır
EXPOSE 3001

CMD ["npm", "start"]