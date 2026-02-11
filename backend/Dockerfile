# backend/Dockerfile
# Daha kararlı olan Node 20 LTS (Uzun Süreli Destek) sürümünü kullanıyoruz
FROM node:20-alpine

WORKDIR /app

# Sadece package.json'ı alıyoruz (npm'in lock dosyasını almamak için)
COPY package.json ./

# NPM'i devreden çıkarıp YARN ile kuruyoruz
# network-timeout: Her ihtimale karşı bağlantı kopmalarına tolerans tanıyoruz
RUN yarn install --network-timeout 1000000

COPY . .

EXPOSE 3001

CMD ["yarn", "start"]