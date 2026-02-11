# backend/Dockerfile
FROM node:22-slim

WORKDIR /app

COPY package*.json ./

# KRİTİK DEĞİŞİKLİK: Ağ yapılandırmasını zorluyoruz.
# fetch-retry: Bağlantı koparsa pes etme, tekrar dene.
# dns-result-order=ipv4first: IPv6 DNS sorunlarını kesin olarak aşar.
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --no-audit --no-fund --dns-result-order=ipv4first

COPY . .

EXPOSE 3001

CMD ["npm", "start"]