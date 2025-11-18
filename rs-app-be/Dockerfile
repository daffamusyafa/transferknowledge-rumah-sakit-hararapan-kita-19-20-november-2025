# 1. Gunakan base image Node.js
FROM node:18-alpine

# 2. Tentukan direktori kerja di dalam container
WORKDIR /app

# 3. Salin package.json dan package-lock.json (jika ada)
COPY package*.json ./

# 4. Install dependensi
RUN npm install

# 5. Salin file .env
COPY .env ./.env

# 6. Salin sisa kode aplikasi
COPY . .

# 7. Expose port yang digunakan aplikasi
EXPOSE 5000

# 8. Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]
