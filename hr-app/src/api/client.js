// src/api/client.js
const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token inválido o expirado, redirigir al login
    localStorage.removeItem('token');
    window.location.href = '/'; // O maneja la redirección según tu app
  }

  return response;
};

export default fetchWithToken;