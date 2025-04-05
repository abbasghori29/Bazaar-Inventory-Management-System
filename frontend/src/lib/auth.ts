// Authentication utility functions
import api from './api';

export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return !!token;
  }
  return false;
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }
  return null;
};

export const setUserData = (userData: any) => {
  if (typeof window !== 'undefined') {
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    
    const user = {
      id: userData.user_id || userData.id,
      email: userData.email,
    };
    
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const clearUserData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Validate token by making a request to an authenticated endpoint
export const validateToken = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  try {
    const response = await api.get('/api/stock/');
    return response.status === 200;
  } catch (error) {
    console.error('Token validation failed:', error);
    // If token is invalid, clear user data
    clearUserData();
    return false;
  }
}; 