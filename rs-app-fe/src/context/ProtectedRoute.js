// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import hook kita

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Jika tidak login, redirect ke /login
    // 'replace' berarti pengguna tidak bisa menekan "back" untuk kembali
    // 'state' menyimpan halaman terakhir yang ingin dia kunjungi
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Jika sudah login, tampilkan halaman yang diminta
  return children;
};

export default ProtectedRoute;
