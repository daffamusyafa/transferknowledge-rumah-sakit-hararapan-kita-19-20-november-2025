import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const storedUsername = localStorage.getItem('username');
      setUser({ username: storedUsername || 'Pengguna' });
    }
  }, []);

  const login = async (username, password) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const { token, username: loggedInUsername } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('username', loggedInUsername);
      setIsAuthenticated(true);
      setUser({ username: loggedInUsername });
      return { success: true };
    } catch (error) {
      console.error('Login gagal:', error.response?.data || error.message);
      return { success: false, message: error.response?.data || 'Login gagal.' };
    }
  };

  const register = async (username, password) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await axios.post(`${API_URL}/register`, { username, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Registrasi gagal:', error.response?.data || error.message);
      return { success: false, message: error.response?.data || 'Registrasi gagal.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
