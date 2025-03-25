import React, { useState, useEffect } from 'react';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';

const EmployeeProfile = ({ employeeId, setNotification, departments, roles, userRole, isAuthenticated }) => {
  const { employee, history, loading, error } = useEmployeeProfile(employeeId, setNotification, isAuthenticated, userRole);
  const [timeEntries, setTimeEntries] = useState([]); // Estado para almacenar fichajes anteriores
  const [latestEntryId, setLatestEntryId] = useState(null); // ID de la entrada más reciente sin salida

  // Obtener fichajes anteriores
  const fetchTimeEntries = async () => {
    try {
      const response = await fetch(`http://localhost:3001/time/entries/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Error al cargar fichajes');
      const data = await response.json();
      setTimeEntries(data);
      // Encontrar la entrada más reciente sin salida
      const latest = data.find(entry => !entry.clock_out);
      setLatestEntryId(latest ? latest.id : null);
    } catch (err) {
      setNotification({ message: `Error al cargar fichajes: ${err.message}`, type: 'error' });
      setTimeEntries([]); // En caso de error, establecer una lista vacía
    }
  };

  // Cargar fichajes al montar el componente
  useEffect(() => {
    if (employeeId) {
      fetchTimeEntries();
    }
  }, [employeeId, fetchTimeEntries]); // Añadido fetchTimeEntries al array de dependencias

  const handleClockIn = async () => {
    try {
      const response = await fetch('http://localhost:3001/time/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      if (!response.ok) throw new Error('Error al marcar entrada');
      setNotification({ message: 'Entrada marcada con éxito', type: 'success' });
      fetchTimeEntries(); // Actualizar fichajes después de marcar entrada
    } catch (err) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  const handleClockOut = async () => {
    if (!latestEntryId) {
      setNotification({ message: 'No hay una entrada reciente para marcar salida', type: 'error' });
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/time/clock-out/${latestEntryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Error al marcar salida');
      setNotification({ message: 'Salida marcada con éxito', type: 'success' });
      fetchTimeEntries(); // Actualizar fichajes después de marcar salida
    } catch (err) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  if (loading) return <p className="text-center text-gray-500">Cargando perfil...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!employee) return <p className="text-center text-gray-500">No se encontraron datos del empleado.</p>;

  const department = departments?.find(dept => dept.id === employee.department_id) || {};
  const role = roles?.find(r => r.id === employee.role_id) || {};

  const salaryFormatted = employee.salary != null && !isNaN(employee.salary)
    ? `$${parseFloat(employee.salary).toFixed(2)}`
    : '$N/A';

  // Calcular tiempo transcurrido entre entrada y salida
  const calculateTimeDifference = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Perfil del Empleado</h2>

      {/* Encabezado con foto y datos básicos */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex items-start space-x-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            {/* Placeholder para la foto */}
            <span className="text-gray-500 text-2xl">📷</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-primary">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-gray-600 mt-1"><strong>Email:</strong> {employee.email}</p>
          <p className="text-gray-600"><strong>Departamento:</strong> {department.name || 'Sin asignar'}</p>
          <p className="text-gray-600"><strong>Cargo:</strong> {role.title || 'Sin asignar'}</p>
          <p className="text-gray-600"><strong>Fecha de Contratación:</strong> {new Date(employee.hire_date).toLocaleDateString()}</p>
          <p className="text-gray-600"><strong>Salario:</strong> {salaryFormatted}</p>
        </div>
      </div>

      {/* Sección de Fichaje */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Fichaje</h3>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleClockIn}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Marcar Entrada
          </button>
          <button
            onClick={handleClockOut}
            disabled={!latestEntryId}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            Marcar Salida
          </button>
        </div>

        {/* Tabla de Fichajes Anteriores */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Entrada</th>
                <th className="border p-2 text-left">Salida</th>
                <th className="border p-2 text-left">Tiempo Transcurrido</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.length > 0 ? (
                timeEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-100">
                    <td className="border p-2">{new Date(entry.clock_in).toLocaleString()}</td>
                    <td className="border p-2">{entry.clock_out ? new Date(entry.clock_out).toLocaleString() : '-'}</td>
                    <td className="border p-2">{calculateTimeDifference(entry.clock_in, entry.clock_out)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="border p-2 text-center text-gray-500">No hay fichajes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-primary mb-4">Historial de Cambios</h3>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Campo</th>
                  <th className="border p-2 text-left">Valor Anterior</th>
                  <th className="border p-2 text-left">Valor Nuevo</th>
                  <th className="border p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-100">
                    <td className="border p-2">{entry.field_changed}</td>
                    <td className="border p-2">{entry.old_value || 'N/A'}</td>
                    <td className="border p-2">{entry.new_value || 'N/A'}</td>
                    <td className="border p-2">{new Date(entry.change_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No hay cambios registrados.</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;