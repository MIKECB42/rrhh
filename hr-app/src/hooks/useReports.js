import { useState, useCallback, useEffect } from 'react';
import fetchWithToken from '../api/client';

export const useReports = (token, setNotification) => {
  const [salaryReport, setSalaryReport] = useState([]);
  const [error, setError] = useState(null);

  const fetchSalaryReport = useCallback(async () => {
    if (!token) {
      setError('Token no proporcionado');
      return;
    }
    try {
      const response = await fetchWithToken('http://localhost:3001/reports/salaries-by-department');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching salary report');
      }
      const data = await response.json();
      setSalaryReport(data);
      setError(null);
      if (data.length === 0) {
        setNotification({ message: 'No se encontraron datos de reportes', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching salary report:', error);
      setError(error.message);
      setNotification({ message: error.message, type: 'error' });
    }
  }, [token, setNotification]);

  useEffect(() => {
    fetchSalaryReport();
  }, [fetchSalaryReport]);

  const exportToCSV = () => {
    const headers = 'Departamento,Empleados,Salario Total,Salario Promedio\n';
    const rows = salaryReport.map(row =>
      `${row.department_name},${parseInt(row.employee_count, 10)},${row.total_salary ? parseFloat(row.total_salary).toFixed(2) : '0.00'},${row.avg_salary ? parseFloat(row.avg_salary).toFixed(2) : '0.00'}`
    ).join('\n');
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'salaries_by_department.csv';
    link.click();
  };

  return { salaryReport, exportToCSV, error };
};