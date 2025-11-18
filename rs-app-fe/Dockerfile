# --- STAGE 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: Serve ---
FROM nginx:1.25-alpine

# Salin hasil build dari stage 'builder'
COPY --from=builder /app/build /usr/share/nginx/html

# HAPUS config default Nginx
RUN rm /etc/nginx/conf.d/default.conf

# SALIN config kustom kita
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
