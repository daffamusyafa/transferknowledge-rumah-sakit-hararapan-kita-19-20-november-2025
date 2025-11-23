const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const app = express();
app.use(cors());
app.use(express.json());

// =====================================================================
// 🔥 TIDAK ADA PEMBLOKIRAN HOST HEADER LAGI
// Docker network sudah cukup aman, jadi middleware custom dilepas.
// =====================================================================

// =====================================================================
// Database Connection Pool
// =====================================================================
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// =====================================================================
// Middleware Autentikasi JWT
// =====================================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// =====================================================================
// Helper: Tambahkan kolom jika belum ada
// =====================================================================
async function addColumnIfNotExists(column, type) {
  try {
    await pool.query(`ALTER TABLE pasien ADD COLUMN ${column} ${type}`);
    console.log(`Kolom '${column}' berhasil ditambahkan ke tabel 'pasien'.`);
  } catch (e) {
    if (e.code !== '42701') {
      console.error(`Gagal menambah kolom '${column}':`, e);
    }
  }
}

// =====================================================================
// Database Initialization
// =====================================================================
async function initDb() {
  try {
    await pool.query('SELECT 1');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pasien (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(100),
        umur INT
      );
    `);

    await addColumnIfNotExists('alamat', 'VARCHAR(255)');
    await addColumnIfNotExists('diagnosis', 'VARCHAR(100)');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tagihan (
        id SERIAL PRIMARY KEY,
        pasien_id INT NOT NULL,
        deskripsi VARCHAR(255) NOT NULL,
        jumlah NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'belum_dibayar',
        tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pasien_id) REFERENCES pasien(id) ON DELETE CASCADE
      );
    `);

    console.log("Tabel berhasil disiapkan.");
  } catch (err) {
    console.error("Gagal inisialisasi database:", err);
    setTimeout(initDb, 5000);
  }
}

// =====================================================================
// Endpoint User Register
// =====================================================================
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username dan password harus diisi.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User berhasil didaftarkan', user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).send('Username sudah terdaftar.');
    console.error(err);
    res.status(500).send('Terjadi kesalahan server saat registrasi.');
  }
});

// =====================================================================
// Endpoint Login
// =====================================================================
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];
    if (!user) return res.status(400).send('Username atau password salah.');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).send('Username atau password salah.');

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login berhasil', token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan server saat login.');
  }
});

// =====================================================================
// Endpoint Pasien
// =====================================================================
app.get('/pasien', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pasien ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error server');
  }
});

app.post('/pasien', authenticateToken, async (req, res) => {
  try {
    const { nama, umur, alamat, diagnosis } = req.body;
    if (!nama || !umur) return res.status(400).send('Nama dan umur tidak boleh kosong');

    const { rows } = await pool.query(
      'INSERT INTO pasien (nama, umur, alamat, diagnosis) VALUES ($1, $2, $3, $4) RETURNING *',
      [nama, umur, alamat, diagnosis]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error server');
  }
});

app.put('/pasien/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, umur, alamat, diagnosis } = req.body;

    if (!nama || !umur) return res.status(400).send('Nama dan umur tidak boleh kosong');

    const { rows } = await pool.query(
      'UPDATE pasien SET nama = $1, umur = $2, alamat = $3, diagnosis = $4 WHERE id = $5 RETURNING *',
      [nama, umur, alamat, diagnosis, id]
    );

    if (rows.length === 0) return res.status(404).send('Pasien tidak ditemukan.');

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error server');
  }
});

app.delete('/pasien/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM pasien WHERE id = $1', [id]);

    if (rowCount === 0) return res.status(404).send('Pasien tidak ditemukan.');

    res.status(200).json({ message: 'Pasien berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error server');
  }
});

// =====================================================================
// Endpoint Tagihan
// =====================================================================
app.post('/tagihan', authenticateToken, async (req, res) => {
  try {
    const { pasien_id, deskripsi, jumlah } = req.body;
    if (!pasien_id || !deskripsi || !jumlah) {
      return res.status(400).send('Input tidak lengkap.');
    }

    const { rows } = await pool.query(
      'INSERT INTO tagihan (pasien_id, deskripsi, jumlah) VALUES ($1, $2, $3) RETURNING *',
      [pasien_id, deskripsi, jumlah]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error saat membuat tagihan:', err);
    res.status(500).send('Error server');
  }
});

app.get('/pasien/:id/tagihan', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM tagihan WHERE pasien_id = $1 ORDER BY tanggal_dibuat DESC',
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error mengambil tagihan:', err);
    res.status(500).send('Error server');
  }
});

app.put('/tagihan/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).send('Status tidak boleh kosong.');

    const { rows } = await pool.query(
      'UPDATE tagihan SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (rows.length === 0) return res.status(404).send('Tagihan tidak ditemukan.');

    res.json(rows[0]);
  } catch (err) {
    console.error('Error update tagihan:', err);
    res.status(500).send('Error server');
  }
});

// =====================================================================
// Start Server — WAJIB pakai 0.0.0.0 untuk Docker
// =====================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server backend berjalan di port ${PORT}`);
  initDb();
});
