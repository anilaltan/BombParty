FROM node:20-bookworm-slim
WORKDIR /app

# Sadece paket listelerini kopyala
COPY package*.json ./

# Bağımlılıkları tertemiz kur
RUN npm install --include=dev

# Proje dosyalarını kopyala
COPY . .

# Uygulamayı başlat
CMD ["npm", "start"]