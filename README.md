RS App (Hospital Application) - Docker Deployment Guide

Panduan ini menjelaskan cara menjalankan aplikasi RS App (Frontend & Backend) beserta database PostgreSQL menggunakan Docker dan Docker Network.

Prasyarat

Pastikan struktur folder proyek Anda terlihat seperti ini:

rs-app/
├── rs-app-be/       # Source code Backend (terdapat Dockerfile)
├── rs-app-fe/       # Source code Frontend (terdapat Dockerfile)
└── ...


1. Buat Docker Network

Langkah pertama adalah membuat network agar container Database, Backend, dan Frontend dapat saling berkomunikasi.

docker network create rs-net


2. Setup Database (PostgreSQL)

Jalankan container database yang terhubung ke network rs-net.

docker run -d --name db --network rs-net \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=rs_db \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 postgres:15-alpine


3. Setup Backend

Masuk ke direktori root proyek, lalu build image backend dari folder rs-app-be dan jalankan containernya.

Build Image:

docker build -t rs-backend ./rs-app-be


Run Container:
Perhatikan PGHOST=db, ini memungkinkan backend menghubungi database menggunakan nama container dalam network yang sama.

docker run -d --name backend --network rs-net \
  -p 5000:5000 \
  -e PGHOST=db \
  -e PGUSER=admin \
  -e PGPASSWORD=password123 \
  -e PGDATABASE=rs_db \
  -e PGPORT=5432 \
  rs-backend


4. Setup Frontend

Build image frontend dari folder rs-app-fe dan jalankan containernya.

Build Image:

docker build -t rs-frontend ./rs-app-fe


Run Container:

docker run -d --name frontend --network rs-net \
  -p 8080:80 rs-frontend


5. Konfigurasi Koneksi Frontend ke Backend (.env)

Agar Frontend dapat menghubungi API Backend, Anda perlu mengatur file .env di dalam folder rs-app-fe sebelum melakukan docker build.

Terdapat dua cara konfigurasi tergantung strategi deployment Anda:

Opsi A: Menggunakan IP Host (Development/Direct Access)

Jika browser pengguna akan mengakses backend secara langsung via IP komputer/server Anda.

Ubah file .env di rs-app-fe:

# Ganti dengan IP Address laptop/server Anda (jangan gunakan localhost jika diakses dari device lain)
VITE_API_URL=[http://192.168.](http://192.168.)x.x:5000


Opsi B: Menggunakan Docker Network / Reverse Proxy

Jika Anda menggunakan Nginx di dalam container frontend untuk mem-proxy request ke backend (biasanya digunakan agar tidak terkena masalah CORS atau untuk single port access).

Ubah file .env di rs-app-fe menjadi path relatif:

# Request akan diteruskan ke backend via internal network (memerlukan konfigurasi Nginx)
VITE_API_URL=/api
