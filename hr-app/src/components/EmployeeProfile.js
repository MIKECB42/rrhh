import React from 'react';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';

const EmployeeProfile = ({ employeeId, setNotification, userRole, isAuthenticated }) => {
  const { employee, history, loading, error } = useEmployeeProfile(employeeId, setNotification, isAuthenticated, userRole);

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
    } catch (err) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  const handleClockOut = async () => {
    try {
      // Esto asume que tienes un ID de entrada reciente; necesitarías lógica para obtener el ID correcto
      const response = await fetch('http://localhost:3001/time/clock-out/1', { // Reemplazar "1" con el ID real
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Error al marcar salida');
      setNotification({ message: 'Salida marcada con éxito', type: 'success' });
    } catch (err) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!employee) return <p>No se encontraron datos del empleado.</p>;

  const salaryFormatted = employee.salary != null && !isNaN(employee.salary)
    ? `$${parseFloat(employee.salary).toFixed(2)}`
    : '$N/A';

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Perfil del Empleado</h2>
      <div className="bg-white p-4 rounded shadow">
        <p><strong>Nombre:</strong> {employee.first_name} {employee.last_name}</p>
        <p><strong>Email:</strong> {employee.email}</p>
        <p><strong>Departamento:</strong> {employee.department_name || 'Sin asignar'}</p>
        <p><strong>Cargo:</strong> {employee.role_title || 'Sin asignar'}</p>
        <p><strong>Fecha de Contratación:</strong> {new Date(employee.hire_date).toLocaleDateString()}</p>
        <p><strong>Salario:</strong> {salaryFormatted}</p>
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={handleClockIn}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Marcar Entrada
        </button>
        <button
          onClick={handleClockOut}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Marcar Salida
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-semibold">Historial</h3>
        {history.length > 0 ? (
          <ul className="list-disc pl-5">
            {history.map((entry) => (
              <li key={entry.id}>
                {entry.field_changed} cambiado de {entry.old_value || 'N/A'} a {entry.new_value || 'N/A'} el {new Date(entry.change_date).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay cambios registrados.</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;