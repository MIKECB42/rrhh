import { useState, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useDashboard = (token, setNotification, isAuthenticated, userRole) => {
  const [dashboardData, setDashboardData] = useState({
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalSalary: 0,
    departmentCount: 0,
  });
  const [chartData, setChartData] = useState([]); // Garantizar que sea un array por defecto
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    if (!isAuthenticated || userRole !== 'admin') {
      return;
    }
    try {
      const dashboardResponse = await fetchWithToken('http://localhost:3001/dashboard');
      if (!dashboardResponse.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }
      const dashboardResult = await dashboardResponse.json();

      const chartResponse = await fetchWithToken('http://localhost:3001/dashboard/dept-distribution');
      if (!chartResponse.ok) {
        throw new Error('Error al cargar distribución por departamentos');
      }
      const chartResult = await chartResponse.json();

      setDashboardData({
        activeEmployees: dashboardResult.activeEmployees || 0,
        inactiveEmployees: dashboardResult.inactiveEmployees || 0,
        totalSalary: dashboardResult.totalSalary || 0,
        departmentCount: dashboardResult.departmentCount || 0,
      });
      setChartData(Array.isArray(chartResult) ? chartResult : []); // Asegurar que chartData sea un array
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setNotification({ message: `Error al cargar el dashboard: ${err.message}`, type: 'error' });
      setChartData([]); // En caso de error, establecer chartData como array vacío
    }
  };

  useEffect(() => {
    if (isAuthenticated && userRole === 'admin') {
      fetchDashboardData();
    }
  }, [token, isAuthenticated, userRole]);

  return { dashboardData, chartData, error, fetchDashboardData };
};