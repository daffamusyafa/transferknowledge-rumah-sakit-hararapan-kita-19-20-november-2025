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

Konfigurasi .env (PENTING)

Sebelum melakukan build, sesuaikan file .env di dalam folder rs-app-fe.

Skenario 1: Menjalankan di Laptop Sendiri (Localhost)
Jika Anda menjalankan docker di laptop dan membukanya di browser laptop yang sama:

# File: rs-app-fe/.env
REACT_APP_API_URL=http://localhost:5000


Skenario 2: Menjalankan di VM / Server
Jika docker berjalan di VM/Server dan Anda mengaksesnya dari browser komputer lain, Anda wajib menggunakan IP Address VM tersebut, bukan localhost.

# File: rs-app-fe/.env
# Ganti 192.168.x.x dengan IP Public atau IP Private VM Anda
REACT_APP_API_URL=[http://192.168.1.10:5000](http://192.168.1.10:5000)


Build & Run Frontend

Build Image:

docker build -t rs-frontend ./rs-app-fe


Run Container:

docker run -d --name frontend --network rs-net \
  -p 8080:80 rs-frontend


Ringkasan Port

Service

Internal Port (Container)

External Port (Host/VM)

Database

5432

5432

Backend

5000

5000

Frontend

80

8080

Akses aplikasi frontend melalui browser di: http://localhost:8080 (atau http://<IP-VM>:8080)
