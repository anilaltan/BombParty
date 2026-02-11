# frontend/Dockerfile
# 1. Aşama: Build (Ağ kopmalarına karşı sağlam Debian slim imajı)
FROM node:20-bookworm-slim as build
WORKDIR /app

# TypeScript'in kurulması için Geliştirme Ortamı (development) zorunludur
ENV NODE_ENV=development

COPY package*.json ./

# Temiz kurulum
RUN npm install --include=dev

COPY . .

# Oyunu derle (HTML/CSS/JS dosyalarını oluştur)
RUN npm run build

# 2. Aşama: Sunum (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]