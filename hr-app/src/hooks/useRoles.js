import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useRoles = (token, setNotification) => {
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);

  const fetchRoles = useCallback(async () => {
    if (!token) {
      setError('Token no proporcionado');
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
  }, [token, setNotification]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = (roleSearchTerm) => {
    return roles.filter(role =>
      role.title.toLowerCase().includes(roleSearchTerm.toLowerCase())
    );
  };

  return { roles, fetchRoles, filteredRoles, error };
};