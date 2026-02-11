# 1. Aşama: Build
FROM node:20-bookworm-slim as build
WORKDIR /app

# Geliştirme bağımlılıklarının (TypeScript vb.) kurulmasını garantileyelim
ENV NODE_ENV=development

COPY package*.json ./

# Sadece npm install yerine dev paketlerini zorla kurmasını söylüyoruz
RUN npm install --include=dev

COPY . .

# Oyunu derle
RUN npm run build

# 2. Aşama: Sunum (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]