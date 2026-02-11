# frontend/Dockerfile
FROM node:22-slim as build
WORKDIR /app

# KRİTİK AYAR: Ortamı 'development' yapıyoruz ki typescript ve vite yüklensin
ENV NODE_ENV=development

COPY package*.json ./
ENV NODE_OPTIONS="--max-old-space-size=1024"
# 'npm ci' yerine 'npm install' kullanıyoruz (daha esnektir)
RUN npm ci --no-audit --no-fund

COPY . .

# Artık tsc komutu bulunacak
RUN npm run build

# --- Sunum Katmanı ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]