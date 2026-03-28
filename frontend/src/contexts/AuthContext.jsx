import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const navigate = useNavigate();

  useEffect(() => {
    // If token exists on mount, ensure local state aligns.
    // In a production app you'd verify the JWT expiry here.
    if (token) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('role');
    }
  }, [token, role]);

  const login = (newToken, newRole) => {
    setToken(newToken);
    setRole(newRole);
    navigate('/');
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
