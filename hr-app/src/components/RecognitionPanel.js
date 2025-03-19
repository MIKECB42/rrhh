import React, { useState } from 'react';

const RecognitionPanel = ({ employees, setNotification, fetchRecognitions, currentPage, setCurrentPage, recognitions, totalPages, userRole, error }) => {
  const [formData, setFormData] = useState({ employee_id: '', message: '', badge: '', date: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/recognitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al añadir reconocimiento');
      }
      setNotification({ message: 'Reconocimiento añadido con éxito', type: 'success' });
      fetchRecognitions(currentPage);
      setFormData({ employee_id: '', message: '', badge: '', date: '' });
    } catch (err) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchRecognitions(newPage);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Reconocimientos</h2>

      {userRole === 'admin' && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">Selecciona un empleado</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Mensaje"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Insignia"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="border p-2 rounded"
            />
          </div>
          <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Añadir Reconocimiento
          </button>
        </form>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Empleado</th>
              <th className="border p-2">Mensaje</th>
              <th className="border p-2">Insignia</th>
              <th className="border p-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recognitions.length > 0 ? (
              recognitions.map(rec => (
                <tr key={rec.id}>
                  <td className="border p-2">
                    {employees.find(emp => emp.id === rec.employee_id)?.first_name || 'Desconocido'} 
                    {employees.find(emp => emp.id === rec.employee_id)?.last_name}
                  </td>
                  <td className="border p-2">{rec.message}</td>
                  <td className="border p-2">{rec.badge}</td>
                  <td className="border p-2">{new Date(rec.date).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="border p-2 text-center">No hay reconocimientos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center max-w-md mx-auto">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-gray-300 p-2 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="truncate">Página {currentPage} de {totalPages || 1}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-gray-300 p-2 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default RecognitionPanel;