const fetchWithToken = async (url, options = {}, navigate) => {
  const token = localStorage.getItem('token');
  console.log('Token enviado en fetchWithToken:', token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const attemptFetch = async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (response.status === 403) {
        const errorData = await response.json();
        console.log('Forbidden access:', errorData);
        // No reintentar para errores 403 en historial o reportes
        if (url.includes('/history') || url.includes('/reports/salaries-by-department')) {
          return response; // Devolver respuesta sin reintentar
        }
        throw new Error(`Acceso denegado: ${JSON.stringify(errorData)}`);
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 0 && !url.includes('/history') && !url.includes('/reports/salaries-by-department')) {
        console.log(`Fetch error: ${error.message}. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptFetch(url, options, retries - 1, delay);
      }
      throw error;
    }
  };

  try {
    const response = await attemptFetch(url, { ...options, headers });
    return response;
  } catch (error) {
    if (error.message.includes('Token inválido') || error.message.includes('Token no proporcionado')) {
      localStorage.removeItem('token');
      if (navigate) navigate('/');
    }
    throw error;
  }
};

export default fetchWithToken;