import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null,
  );
  const [loading, setLoading] = useState(true);

  // Setup Axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("adminToken", token);
      checkAuth();
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("adminToken");
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const res = await axios.get(
        "https://violet-quetzal-133812.hostingersite.com/api/v1/auth/me",
      );
      setUser(res.data.data);
    } catch (error) {
      console.error("Auth check failed", error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(
      "https://violet-quetzal-133812.hostingersite.com/api/v1/auth/login",
      { email, password },
    );
    if (res.data.data.accessToken) {
      setToken(res.data.data.accessToken);
      setUser(res.data.data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
