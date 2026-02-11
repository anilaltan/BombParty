# backend/Dockerfile
# DNS hatalarına karşı en dayanıklı olan Debian tabanlı imaj
FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

# Artık garip ayarlara, yarn'a veya timeout'lara gerek yok. Temiz kurulum.
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]