# backend/Dockerfile
# Alpine yerine Debian tabanlı 'slim' imajını kullanıyoruz. Ağ sorunlarını çözer.
FROM node:22-slim

WORKDIR /app

COPY package*.json ./

# İnternet/DNS takılmalarını önlemek için standart install kullanıyoruz
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3001

CMD ["npm", "start"]