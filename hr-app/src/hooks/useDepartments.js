import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useDepartments = (token, setNotification, isAuthenticated, userRole) => {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    if (!isAuthenticated || !token || userRole !== 'admin') {
      setDepartments([]); // No cargar si no es admin
      setError(null);
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
  }, [token, setNotification, isAuthenticated, userRole]);

  useEffect(() => {
    if (isAuthenticated && userRole === 'admin') {
      fetchDepartments();
    }
  }, [fetchDepartments, isAuthenticated, userRole]);

  const filteredDepartments = useCallback((departmentSearchTerm) => {
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
    );
  }, [departments]);

  return { departments, fetchDepartments, filteredDepartments, error };
};