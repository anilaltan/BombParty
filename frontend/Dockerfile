# frontend/Dockerfile
FROM node:18-alpine as build
WORKDIR /app

# 1. Dosyaları kopyala (package.json VE diğer her şey)
COPY package*.json ./
COPY . .

# 2. ŞİMDİ yükleme yap (Garanti Yöntem: Üzerine yazma riskini yok eder)
# 'npm ci' kullanıyoruz çünkü daha temiz ve güvenilir bir kurulum yapar
RUN npm ci

# 3. Derle
RUN npm run build

# --- Sunum Katmanı ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]