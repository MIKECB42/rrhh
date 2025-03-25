import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useRoles = (token, setNotification, isAuthenticated, userRole) => {
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);

  const fetchRoles = useCallback(async () => {
    if (!isAuthenticated || !token || userRole !== 'admin') {
      setRoles([]); // No cargar si no es admin
      setError(null);
      return;
    }
    try {
      const response = await fetchWithToken('http://localhost:3001/roles');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching roles');
      }
      const data = await response.json();
      setRoles(data);
      setError(null);
      if (data.length === 0) {
        setNotification({ message: 'No se encontraron cargos', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(error.message);
      setNotification({ message: error.message, type: 'error' });
    }
  }, [token, setNotification, isAuthenticated, userRole]);

  useEffect(() => {
    if (isAuthenticated && userRole === 'admin') {
      fetchRoles();
    }
  }, [fetchRoles, isAuthenticated, userRole]);

  const filteredRoles = useCallback((roleSearchTerm) => {
    return roles.filter(role =>
      role.title.toLowerCase().includes(roleSearchTerm.toLowerCase())
    );
  }, [roles]);

  return { roles, fetchRoles, filteredRoles, error };
};