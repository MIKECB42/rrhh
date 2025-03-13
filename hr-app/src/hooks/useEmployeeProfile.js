import { useState, useEffect, useCallback } from 'react';
import fetchWithToken from '../api/client';

export const useEmployeeProfile = (employeeId, setNotification) => {
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployeeData = useCallback(async () => {
    if (!employeeId || isNaN(employeeId)) {
      console.log('ID de empleado inválido:', employeeId);
      setLoading(false);
      setError('ID de empleado inválido');
      return;
    }

    try {
      setLoading(true);
      console.log(`Haciendo petición a /employees/${employeeId}`);
      const employeeResponse = await fetchWithToken(`http://localhost:3001/employees/${employeeId}`);
      if (!employeeResponse.ok) throw new Error(`Error ${employeeResponse.status}: ${employeeResponse.statusText}`);
      const employeeData = await employeeResponse.json();
      if (!employeeData || !employeeData.id) {
        throw new Error('Datos del empleado no válidos');
      }

      console.log(`Haciendo petición a /employees/${employeeId}/history`);
      const historyResponse = await fetchWithToken(`http://localhost:3001/employees/${employeeId}/history`);
      if (!historyResponse.ok) throw new Error(`Error ${historyResponse.status}: ${historyResponse.statusText}`);
      const historyData = await historyResponse.json();

      setEmployee(employeeData);
      setHistory(historyData);
      setError(null);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError(err.message);
      setNotification({ message: `Error al cargar el perfil: ${err.message}`, type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } finally {
      setLoading(false);
    }
  }, [employeeId, setNotification]);

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId, fetchEmployeeData]);

  return { employee, history, loading, error, fetchEmployeeData };
};