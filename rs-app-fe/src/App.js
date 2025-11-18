import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider, useAuth } from './auth/AuthContext';

// Komponen PrivateRoute untuk melindungi halaman
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // Saat loading, bisa tampilkan spinner, tapi untuk simpel kita cek token saja
  const token = localStorage.getItem('token');
  return isAuthenticated || token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Container>
    </AuthProvider>
  );
}

export default App;
