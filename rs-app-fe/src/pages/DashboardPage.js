import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, TextField, Button, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Alert, IconButton, Modal, Fade, Backdrop, 
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

const API_URL = process.env.REACT_APP_API_URL;

// Style untuk Modal
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 600, 
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

// Fungsi untuk format mata uang
const formatRupiah = (angka) => {
  if (!angka) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka);
};

function DashboardPage() {
  const [pasien, setPasien] = useState([]);
  const [newPasien, setNewPasien] = useState({
    nama: '',
    umur: '',
    alamat: '',
    diagnosis: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State untuk Modal Edit Pasien
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    nama: '',
    umur: '',
    alamat: '',
    diagnosis: ''
  });

  // State untuk Modal Tagihan
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [selectedPasien, setSelectedPasien] = useState(null);
  const [tagihanList, setTagihanList] = useState([]);
  const [newTagihan, setNewTagihan] = useState({ deskripsi: '', jumlah: '' });

  // --- Fungsi API Pasien ---
  const fetchPasien = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/pasien`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasien(response.data);
    } catch (err) {
      console.error("Gagal mengambil data pasien:", err);
      setError('Gagal mengambil data pasien. Silakan login kembali.');
    }
  };

  useEffect(() => {
    fetchPasien();
  }, []);

  // --- Handler Form 'Tambah Pasien' ---
  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewPasien(prev => ({ ...prev, [name]: value }));
  };

  const handleNewSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newPasien.nama || !newPasien.umur) {
      setError("Nama dan umur harus diisi");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/pasien`, newPasien, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewPasien({ nama: '', umur: '', alamat: '', diagnosis: '' });
      setSuccess('Pasien berhasil ditambahkan!');
      fetchPasien();
    } catch (err) {
      console.error("Gagal menambah pasien:", err);
      setError('Gagal menambah pasien. Pastikan Anda sudah login.');
    }
  };

  // --- Handler Edit Pasien (Modal) ---
  const handleOpenEditModal = (p) => {
    setEditForm(p);
    setEditModalOpen(true);
  };
  const handleCloseEditModal = () => setEditModalOpen(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/pasien/${editForm.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Data pasien berhasil diperbarui!');
      handleCloseEditModal();
      fetchPasien();
    } catch (err) {
      console.error("Gagal update pasien:", err);
      setError('Gagal update pasien.');
    }
  };

  // --- Handler Delete Pasien ---
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pasien ini?")) {
      setError('');
      setSuccess('');
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/pasien/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Pasien berhasil dihapus.');
        fetchPasien();
      } catch (err) {
        console.error("Gagal menghapus pasien:", err);
        setError('Gagal menghapus pasien.');
      }
    }
  };

  // --- Handler Modal Tagihan ---
  const fetchTagihan = async (pasienId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/pasien/${pasienId}/tagihan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTagihanList(response.data);
    } catch (err) {
      console.error("Gagal mengambil tagihan:", err);
      setError('Gagal mengambil tagihan.');
    }
  };

  const handleOpenBillingModal = (pasien) => {
    setSelectedPasien(pasien);
    fetchTagihan(pasien.id);
    setBillingModalOpen(true);
  };

  const handleCloseBillingModal = () => {
    setBillingModalOpen(false);
    setSelectedPasien(null);
    setTagihanList([]);
    setNewTagihan({ deskripsi: '', jumlah: '' });
  };

  const handleNewTagihanChange = (e) => {
    const { name, value } = e.target;
    setNewTagihan(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTagihan = async (e) => {
    e.preventDefault();
    if (!newTagihan.deskripsi || !newTagihan.jumlah) {
      alert("Deskripsi dan Jumlah tidak boleh kosong.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/tagihan`, {
        pasien_id: selectedPasien.id,
        deskripsi: newTagihan.deskripsi,
        jumlah: newTagihan.jumlah
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTagihan({ deskripsi: '', jumlah: '' }); // Reset form
      fetchTagihan(selectedPasien.id);
    } catch (err) {
      console.error("Gagal menambah tagihan:", err);
      alert('Gagal menambah tagihan.');
    }
  };

  const handleMarkAsPaid = async (tagihanId) => {
    if (window.confirm("Apakah Anda yakin ingin menandai tagihan ini sebagai LUNAS?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/tagihan/${tagihanId}`, {
          status: 'sudah_dibayar'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTagihan(selectedPasien.id);
      } catch (err) {
        console.error("Gagal update status tagihan:", err);
        alert('Gagal update status tagihan.');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Manajemen Pasien
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Tambah Pasien Baru
        </Typography>
        <form onSubmit={handleNewSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField label="Nama Pasien" name="nama" variant="outlined" value={newPasien.nama} onChange={handleNewChange} />
            <TextField label="Umur" name="umur" variant="outlined" type="number" value={newPasien.umur} onChange={handleNewChange} />
            <TextField label="Alamat" name="alamat" variant="outlined" value={newPasien.alamat} onChange={handleNewChange} />
            <TextField label="Diagnosis" name="diagnosis" variant="outlined" value={newPasien.diagnosis} onChange={handleNewChange} />
          </Box>
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            Tambah
          </Button>
        </form>
      </Paper>

      <Typography variant="h5" component="h2" gutterBottom>
        Daftar Pasien Saat Ini
      </Typography>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Umur</TableCell>
              <TableCell>Alamat</TableCell>
              <TableCell>Diagnosis</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pasien.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Belum ada data pasien</TableCell>
              </TableRow>
            ) : (
              pasien.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.nama}</TableCell>
                  <TableCell>{p.umur}</TableCell>
                  <TableCell>{p.alamat}</TableCell>
                  <TableCell>{p.diagnosis}</TableCell>
                  <TableCell align="center">
                    <IconButton color="success" onClick={() => handleOpenBillingModal(p)}>
                      <MonetizationOnIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleOpenEditModal(p)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(p.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Edit Pasien */}
      <Modal open={editModalOpen} onClose={handleCloseEditModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={editModalOpen}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2">Edit Data Pasien</Typography>
            <form onSubmit={handleEditSubmit}>
              <TextField label="Nama Pasien" name="nama" variant="outlined" value={editForm.nama} onChange={handleEditChange} fullWidth margin="normal" />
              <TextField label="Umur" name="umur" variant="outlined" type="number" value={editForm.umur} onChange={handleEditChange} fullWidth margin="normal" />
              <TextField label="Alamat" name="alamat" variant="outlined" value={editForm.alamat} onChange={handleEditChange} fullWidth margin="normal" />
              <TextField label="Diagnosis" name="diagnosis" variant="outlined" value={editForm.diagnosis} onChange={handleEditChange} fullWidth margin="normal" />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleCloseEditModal}>Batal</Button>
                <Button type="submit" variant="contained">Simpan</Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* --- Modal untuk Tagihan --- */}
      <Modal open={billingModalOpen} onClose={handleCloseBillingModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={billingModalOpen}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2" gutterBottom>
              Tagihan untuk: {selectedPasien?.nama}
            </Typography>
            
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">Tambah Tagihan Baru</Typography>
              <form onSubmit={handleAddTagihan}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField label="Deskripsi" name="deskripsi" variant="standard" value={newTagihan.deskripsi} onChange={handleNewTagihanChange} fullWidth />
                  <TextField label="Jumlah (Rp)" name="jumlah" variant="standard" type="number" value={newTagihan.jumlah} onChange={handleNewTagihanChange} />
                  <Button type="submit" variant="contained" size="small">Add</Button>
                </Box>
              </form>
            </Paper>

            <Typography variant="subtitle1" gutterBottom>Daftar Tagihan</Typography>
            <List dense>
              {tagihanList.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Belum ada tagihan." />
                </ListItem>
              ) : (
                tagihanList.map((tagihan) => (
                  <React.Fragment key={tagihan.id}>
                    <ListItem>
                      <ListItemText 
                        primary={tagihan.deskripsi} 
                        secondary={formatRupiah(tagihan.jumlah)} 
                      />
                      
                      {/* --- INI ADALAH BAGIAN YANG DIUBAH --- */}
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* 1. Chip status sekarang di kanan */}
                          <Chip 
                            label={tagihan.status} 
                            color={tagihan.status === 'sudah_dibayar' ? 'success' : 'warning'}
                            size="small"
                          />
                          {/* 2. Tombol "Tandai Lunas" hanya muncul jika belum dibayar */}
                          {tagihan.status === 'belum_dibayar' && (
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => handleMarkAsPaid(tagihan.id)}
                            >
                              Tandai Lunas
                            </Button>
                          )}
                        </Box>
                      </ListItemSecondaryAction>
                      {/* --- AKHIR DARI BAGIAN YANG DIUBAH --- */}

                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
            <Button onClick={handleCloseBillingModal} sx={{ mt: 2 }}>Tutup</Button>
          </Box>
        </Fade>
      </Modal>

    </Box>
  );
}

export default DashboardPage;
