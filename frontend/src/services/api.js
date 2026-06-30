import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial to send HttpOnly cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle authorization errors or token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, we can dispatch logout event or clear credentials
      console.warn('Session expired or unauthorized request. User must log in.');
    }
    return Promise.reject(error);
  }
);

export default API;
