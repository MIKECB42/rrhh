import { useState, useEffect, useCallback } from 'react';
import fetchWithToken from '../api/client';

export const useEmployeeProfile = (employeeId, setNotification, isAuthenticated, userRole) => {
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployeeData = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Usuario no autenticado');
      return;
    }
    if (!employeeId || isNaN(employeeId)) {
      console.log('ID de empleado inválido:', employeeId);
      setError('ID de empleado inválido');
      return;
    }

    try {
      setLoading(true);
      
      // Obtener datos del empleado
      const employeeResponse = await fetchWithToken(`http://localhost:3001/employees/${employeeId}`);
      if (!employeeResponse.ok) {
        const errorText = await employeeResponse.text();
        throw new Error(`Error ${employeeResponse.status}: ${errorText || employeeResponse.statusText}`);
      }
      const employeeData = await employeeResponse.json();
      if (!employeeData || !employeeData.id) {
        throw new Error('Datos del empleado no válidos');
      }
      setEmployee(employeeData);

      // Obtener historial de manera asíncrona sin retrasar la carga principal
      setTimeout(async () => {
        try {
          const historyResponse = await fetchWithToken(`http://localhost:3001/employees/${employeeId}/history`);
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            setHistory(historyData);
          }
        } catch (historyErr) {
          console.log('Historial no disponible:', historyErr.message);
        }
      }, 0);

      setError(null);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError(err.message);
      setNotification({ message: `Error al cargar el perfil: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [employeeId, setNotification, isAuthenticated, userRole]);

  useEffect(() => {
    if (isAuthenticated && employeeId) {
      fetchEmployeeData();
    } else {
      setLoading(false);
      if (!employeeId) setError('No se proporcionó un ID de empleado');
    }
  }, [fetchEmployeeData, isAuthenticated, employeeId]);

  return { employee, history, loading, error, fetchEmployeeData };
};