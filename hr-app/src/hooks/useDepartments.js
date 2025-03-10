import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetchWithToken('http://localhost:3001/departments');
      if (!response.ok) throw new Error('Error fetching departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filteredDepartments = (departmentSearchTerm) => {
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
    );
  };

  return { departments, fetchDepartments, filteredDepartments };
};