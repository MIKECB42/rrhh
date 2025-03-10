import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useDashboard = () => {
  const [deptDistribution, setDeptDistribution] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalSalary: 0,
    departmentCount: 0,
  });

  const fetchDeptDistribution = useCallback(async () => {
    try {
      const response = await fetchWithToken('http://localhost:3001/dashboard/dept-distribution');
      if (!response.ok) throw new Error('Error fetching dept distribution');
      const data = await response.json();
      setDeptDistribution(data);
    } catch (error) {
      console.error('Error fetching dept distribution:', error);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetchWithToken('http://localhost:3001/dashboard');
      if (!response.ok) throw new Error('Error fetching dashboard data');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

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

  return { deptDistribution, dashboardData, chartData };
};