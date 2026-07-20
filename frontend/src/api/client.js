import axios from 'axios';

// Keep the localhost fallback so local development still works perfectly!
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every outgoing request once the user has logged in.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('snip_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token expires or is rejected, drop it and send the user back to login.
client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('snip_token');
        localStorage.removeItem('snip_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
);

export const authApi = {
  register: (data) => client.post('/api/auth/register', data),
  login: (data) => client.post('/api/auth/login', data),
};

export const urlApi = {
  // Matches the /api/urls endpoint mapping for generation and retrieval
  shorten: (data) => client.post('/api/urls/shorten', data),
  list: () => client.get('/api/urls'),
  deactivate: (shortCode) => client.delete(`/api/urls/${shortCode}`),
  analytics: (shortCode) => client.get(`/api/urls/${shortCode}/analytics`),
};

export default client;