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
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('employeeId');
    window.location.href = '/';
  } else if (response.status === 403) {
    const data = await response.json();
    if (data.message === 'Debes cambiar tu contraseña') {
      window.location.href = '/change-password';
    } else {
      console.error('Forbidden access:', data.error);
    }
  }

  return response;
};

export default fetchWithToken;