import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useRecognitions = (token, setNotification, isAuthenticated, userRole) => {
  const [recognitions, setRecognitions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // Inicializar en 1
  const [error, setError] = useState(null);

  const fetchRecognitions = useCallback(async (page = 1) => {
    if (!isAuthenticated || !token) {
      setError('No autenticado o token no proporcionado');
      return;
    }
    try {
      const response = await fetchWithToken(`http://localhost:3001/recognitions?page=${page}&limit=10`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching recognitions');
      }
      const data = await response.json();
      setRecognitions(data.data);
      setTotalPages(Math.ceil(data.total / 10));
      setCurrentPage(page);
      setError(null);
      if (data.data.length === 0) {
        setNotification({ message: 'No se encontraron reconocimientos', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching recognitions:', error);
      setError(error.message);
      setNotification({ message: error.message, type: 'error' });
    }
  }, [token, setNotification, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecognitions(currentPage);
    }
  }, [fetchRecognitions, isAuthenticated, currentPage]);

  return { recognitions, totalPages, currentPage, setCurrentPage, fetchRecognitions, error };
};