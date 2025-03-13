import { useState, useCallback } from 'react';
import fetchWithToken from '../api/client';

export const useRecognitions = (token, setNotification) => {
  const [recognitions, setRecognitions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const limit = 10;

  const fetchRecognitions = useCallback(async (page = 1) => {
    if (!token) {
      setError('Token no proporcionado');
      return;
    }
    try {
      const response = await fetchWithToken(`http://localhost:3001/recognitions?page=${page}&limit=${limit}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al obtener reconocimientos');
      }
      const data = await response.json();
      setRecognitions(data.data);
      setTotalPages(Math.ceil(data.total / limit));
      setCurrentPage(page);
      setError(null);
      if (data.data.length === 0) {
        setNotification({ message: 'No se encontraron reconocimientos', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching recognitions:', error);
      setError(error.message);
      setNotification({ message: 'Error al obtener reconocimientos', type: 'error' });
    }
  }, [setNotification, limit]);

  return { recognitions, totalPages, currentPage, fetchRecognitions, error };
};