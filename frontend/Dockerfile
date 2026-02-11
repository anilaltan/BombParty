# 1. Aşama: Build
FROM node:20-bookworm-slim as build
WORKDIR /app

# KESİN ÇÖZÜM: TypeScript'i sistemin kendisine (global) kuruyoruz.
# Böylece COPY komutu onu asla bozamaz.
RUN npm install -g typescript vite

COPY package*.json ./

# Sadece bağımlılıkları kur
RUN npm install

COPY . .

# Oyunu derle
RUN npm run build

# 2. Aşama: Sunum (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]