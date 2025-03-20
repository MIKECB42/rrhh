import { useState, useEffect, useCallback } from 'react'; // Añadir useCallback
import fetchWithToken from '../api/client';

export const useReports = (token, setNotification, isAuthenticated, userRole) => {
  const [salaryReport, setSalaryReport] = useState([]);
  const [error, setError] = useState(null);

  const fetchSalaryReport = useCallback(async () => {
    if (!isAuthenticated || userRole !== 'admin') {
      return; // No intentar fetch si no es admin
    }
    try {
      const response = await fetchWithToken('http://localhost:3001/reports/salaries-by-department');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }
      const data = await response.json();
      setSalaryReport(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching salary report:', err);
      setError(err.message);
      if (!err.message.includes('Acceso denegado')) {
        setNotification({ message: `Error al cargar el reporte: ${err.message}`, type: 'error' });
      }
    }
  }, [isAuthenticated, userRole, setNotification]); // Dependencias de fetchSalaryReport

  useEffect(() => {
    if (isAuthenticated && userRole === 'admin') {
      fetchSalaryReport();
    }
  }, [token, isAuthenticated, userRole, fetchSalaryReport]);

  const exportToCSV = () => {
    if (!salaryReport.length) return;
    const headers = ['Departamento', 'Cantidad de Empleados', 'Salario Total', 'Salario Promedio'];
    const rows = salaryReport.map(row => [
      row.department_name,
      row.employee_count,
      row.total_salary ? row.total_salary.toFixed(2) : '0.00',
      row.avg_salary ? row.avg_salary.toFixed(2) : '0.00',
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'salary_report.csv';
    link.click();
  };

  return { salaryReport, exportToCSV, error };
};