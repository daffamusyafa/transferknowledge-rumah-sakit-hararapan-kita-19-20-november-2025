🏥 RS App Deployment Guide

Panduan lengkap untuk men-deploy aplikasi Rumah Sakit (Frontend, Backend, & Database) menggunakan Docker Container.

📂 Struktur Folder

Pastikan Anda berada di root folder rs-app dan struktur direktori terlihat seperti ini:

rs-app/
├── rs-app-be/       # Backend (Node.js/Express + Dockerfile)
├── rs-app-fe/       # Frontend (React + Dockerfile)
└── README.md


🚀 Langkah Instalasi

1. Buat Docker Network

Kita perlu membuat jaringan virtual agar semua container (DB, Backend, Frontend) bisa saling berkomunikasi.

docker network create rs-net


2. Jalankan Database (PostgreSQL)

Jalankan container database terlebih dahulu agar siap menerima koneksi dari backend.

docker run -d \
  --name db \
  --network rs-net \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=rs_db \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine


3. Setup Backend

Masuk ke folder backend, build image, lalu jalankan. Backend akan menghubungi database menggunakan hostname db.

Build Image:

docker build -t rs-backend ./rs-app-be


Jalankan Container:

docker run -d \
  --name backend \
  --network rs-net \
  -p 5000:5000 \
  -e PGHOST=db \
  -e PGUSER=admin \
  -e PGPASSWORD=password123 \
  -e PGDATABASE=rs_db \
  -e PGPORT=5432 \
  rs-backend


4. Setup Frontend (PENTING ⚠️)

Sebelum melakukan build image frontend, Anda harus mengkonfigurasi file .env di dalam folder rs-app-fe agar aplikasi tahu ke mana harus mengirim request API.

Pilih salah satu skenario di bawah ini:

🅰️ Skenario A: Menjalankan di Laptop (Localhost)

Gunakan ini jika Anda menjalankan Docker di laptop dan membuka browser di laptop yang sama.

Buat/Edit file rs-app-fe/.env:

REACT_APP_API_URL=http://localhost:5000


🅱️ Skenario B: Menjalankan di VM / VPS / Server Kantor

Gunakan ini jika Docker berjalan di server (misal: Proxmox, AWS, DigitalOcean) dan Anda mengakses webnya dari komputer lain. Jangan gunakan localhost.

Buat/Edit file rs-app-fe/.env:

# Ganti 192.168.1.XX dengan IP Address VM Anda
REACT_APP_API_URL=[http://192.168.1.10:5000](http://192.168.1.10:5000)


Jalankan Frontend

Setelah .env disesuaikan, jalankan perintah berikut:

Build Image:

docker build -t rs-frontend ./rs-app-fe


Jalankan Container:

docker run -d \
  --name frontend \
  --network rs-net \
  -p 8080:80 \
  rs-frontend


✅ Ringkasan Akses

Setelah semua container berjalan, Anda bisa mengakses aplikasi melalui:

Service

URL Akses

Keterangan

Frontend UI

http://localhost:8080

Atau http://<IP-VM>:8080

Backend API

http://localhost:5000

Atau http://<IP-VM>:5000

Database

localhost:5432

Gunakan DBeaver/PgAdmin

🛠 Troubleshooting

Jika frontend tidak bisa mengambil data (Error Network/CORS):

Cek Console Browser (F12) -> Tab Network.

Pastikan request mengarah ke IP yang benar (bukan localhost jika akses beda device).

Jika Anda mengganti isi .env, Anda wajib melakukan Re-Build image frontend (docker build ...) dan menjalankan ulang containernya.
