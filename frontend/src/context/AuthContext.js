import React, { createContext, useState, useEffect } from 'react';
import API, { setAuthToken } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setAuthToken(parsedUser.token); // set token for API requests
    }
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const loggedInUser = { ...res.data.user, token: res.data.token };
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setAuthToken(res.data.token); // globally set token
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  // Signup
  const signup = async (name, email, password, role = 'student') => {
    try {
      const res = await API.post('/auth/signup', { name, email, password, role });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Signup failed' };
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
