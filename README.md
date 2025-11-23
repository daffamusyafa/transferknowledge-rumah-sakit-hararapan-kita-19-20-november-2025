RS App Deployment GuidePanduan ini berisi instruksi deployment untuk aplikasi Rumah Sakit (Frontend & Backend) menggunakan Docker.Daftar IsiPrasyaratInstalasi NetworkSetup DatabaseSetup BackendSetup FrontendTroubleshootingPrasyaratPastikan struktur direktori proyek Anda sesuai dengan skema berikut:rs-app/
├── rs-app-be/       # Direktori Backend
├── rs-app-fe/       # Direktori Frontend
└── README.md
1. Buat Docker NetworkBuat network rs-net agar container backend, frontend, dan database dapat berkomunikasi melalui hostname.docker network create rs-net
2. Setup DatabaseJalankan container PostgreSQL.docker run -d \
  --name db \
  --network rs-net \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=rs_db \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
3. Setup BackendBuild dan jalankan backend. Container ini akan terhubung ke database menggunakan hostname db.# Build Image
docker build -t rs-backend ./rs-app-be

# Run Container
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
4. Setup Frontend[!IMPORTANT]Konfigurasi Environment VariableSebelum mem-build frontend, Anda wajib menyesuaikan file .env di dalam folder rs-app-fe. Jangan lewati langkah ini agar frontend dapat menghubungi backend.Konfigurasi .envEdit file rs-app-fe/.env sesuai dengan lingkungan deployment Anda:Opsi A: Local Development (Laptop)Gunakan ini jika browser berjalan di mesin yang sama dengan Docker.REACT_APP_API_URL=http://localhost:5000
Opsi B: Server / VM DeploymentGunakan ini jika aplikasi diakses dari komputer lain. Ganti IP dengan IP Address VM Anda.REACT_APP_API_URL=[http://192.168.1.10:5000](http://192.168.1.10:5000)
Build & RunSetelah .env disimpan, jalankan perintah berikut:# Build Image
docker build -t rs-frontend ./rs-app-fe

# Run Container
docker run -d \
  --name frontend \
  --network rs-net \
  -p 8080:80 \
  rs-frontend
Ringkasan PortServiceHost PortContainer PortURL AksesFrontend808080http://localhost:8080Backend50005000http://localhost:5000Database54325432localhost:5432Troubleshooting[!TIP]Jika data tidak muncul di Frontend, periksa hal berikut:Buka Developer Tools di browser (Tekan F12), lalu cek tab Network.Jika request ke API merah (Error), pastikan URL yang dipanggil bukan localhost jika Anda mengakses dari device berbeda.Jika mengubah .env, pastikan untuk menghapus image lama dan mem-build ulang:docker rmi rs-frontend
docker build -t rs-frontend ./rs-app-fe
