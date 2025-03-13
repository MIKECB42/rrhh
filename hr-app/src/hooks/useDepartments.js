import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useDepartments = (token, setNotification) => {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    if (!token) {
      setError('Token no proporcionado');
      return;
    }
    try {
      const response = await fetchWithToken('http://localhost:3001/departments');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching departments');
      }
      const data = await response.json();
      setDepartments(data);
      setError(null);
      if (data.length === 0) {
        setNotification({ message: 'No se encontraron departamentos', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError(error.message);
      setNotification({ message: error.message, type: 'error' });
    }
  }, [token, setNotification]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filteredDepartments = (departmentSearchTerm) => {
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
    );
  };

  return { departments, fetchDepartments, filteredDepartments, error };
};