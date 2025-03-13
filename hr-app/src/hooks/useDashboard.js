import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useDashboard = (token, setNotification) => {
  const [deptDistribution, setDeptDistribution] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalSalary: 0,
    departmentCount: 0,
  });
  const [error, setError] = useState(null);

  const fetchDeptDistribution = useCallback(async () => {
    if (!token) {
      setError('Token no proporcionado');
      return;
    }
    try {
      const response = await fetchWithToken('http://localhost:3001/dashboard/dept-distribution');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching dept distribution');
      }
      const data = await response.json();
      setDeptDistribution(data);
      setError(null);
      if (data.length === 0) {
        setNotification({ message: 'No se encontraron datos de distribución de departamentos', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching dept distribution:', error);
      setError(error.message);
      setNotification({ message: error.message, type: 'error' });
    }
  }, [token, setNotification]);

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setError('Token no proporcionado');
      return;
    }
    try {
      const response = await fetchWithToken('http://localhost:3001/dashboard');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      setNotification({ message: error.message, type: 'error' });
    }
  }, [token, setNotification]);

  useEffect(() => {
    fetchDashboardData();
    fetchDeptDistribution();
  }, [fetchDashboardData, fetchDeptDistribution]);

  const chartData = {
    labels: deptDistribution.map(d => d.name),
    datasets: [{
      label: 'Empleados por Departamento',
      data: deptDistribution.map(d => d.employee_count),
      backgroundColor: '#007bff',
    }],
  };

  return { deptDistribution, dashboardData, chartData, error };
};