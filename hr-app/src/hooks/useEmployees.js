import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useEmployees = (token, showInactive, filters, departments, setNotification) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(filters.department_id && { department_id: filters.department_id }),
        ...(filters.hire_date_start && { hire_date_start: filters.hire_date_start }),
        ...(filters.hire_date_end && { hire_date_end: filters.hire_date_end }),
        ...(filters.salary_min && { salary_min: filters.salary_min }),
        ...(filters.salary_max && { salary_max: filters.salary_max }),
      }).toString();
      const url = showInactive
        ? `http://localhost:3001/employees/inactive?${queryParams}`
        : `http://localhost:3001/employees?${queryParams}`;
      const response = await fetchWithToken(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching employees');
      }
      const data = await response.json();
      const sortedEmployees = data.sort((a, b) => a.id - b.id);
      setEmployees(sortedEmployees);
      setError(null);
      if (sortedEmployees.length === 0) {
        setNotification({ message: 'No se encontraron empleados', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(error.message);
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, showInactive, filters, setNotification]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = (searchTerm, searchCriteria) => {
    return employees.filter(employee => {
      if (!searchTerm) return true;
      switch (searchCriteria) {
        case 'first_name':
          return employee.first_name.toLowerCase().includes(searchTerm.toLowerCase());
        case 'email':
          return employee.email.toLowerCase().includes(searchTerm.toLowerCase());
        case 'department':
          const deptName = departments.find(d => d.id === employee.department_id)?.name || '';
          return deptName.toLowerCase().includes(searchTerm.toLowerCase());
        default:
          return true;
      }
    });
  };

  return { employees, fetchEmployees, filteredEmployees, loading, error };
};