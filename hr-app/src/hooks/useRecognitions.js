import { useState, useCallback } from 'react';
import fetchWithToken from '../api/client';

export const useRecognitions = (setNotification) => {
  const [recognitions, setRecognitions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const fetchRecognitions = useCallback(async (page = 1) => {
    try {
      const response = await fetchWithToken(`http://localhost:3001/recognitions?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Error al obtener reconocimientos');
      const data = await response.json();
      setRecognitions(data.data);
      setTotalPages(Math.ceil(data.total / limit));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching recognitions:', error);
      setNotification({ message: 'Error al obtener reconocimientos', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  }, [setNotification, limit]);

  return { recognitions, totalPages, currentPage, fetchRecognitions };
};