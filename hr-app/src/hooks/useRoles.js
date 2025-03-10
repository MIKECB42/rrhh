import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useRoles = () => {
  const [roles, setRoles] = useState([]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetchWithToken('http://localhost:3001/roles');
      if (!response.ok) throw new Error('Error fetching roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = (roleSearchTerm) => {
    return roles.filter(role =>
      role.title.toLowerCase().includes(roleSearchTerm.toLowerCase())
    );
  };

  return { roles, fetchRoles, filteredRoles };
};