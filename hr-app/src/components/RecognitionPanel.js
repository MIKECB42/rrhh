import React from 'react';

const RecognitionPanel = ({ employees, setNotification, fetchRecognitions, currentPage, setCurrentPage, recognitions, totalPages, userRole, error }) => {
  const [formData, setFormData] = React.useState({ employee_id: '', message: '', badge: '', date: '' });

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
      <h2 className="text-2xl font-bold text-primary mb-6">Reconocimientos</h2>

      {/* Formulario para administradores */}
      {userRole === 'admin' && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Insignia"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="mt-4 bg-primary text-white p-2 rounded-lg hover:bg-opacity-90">
            Añadir Reconocimiento
          </button>
        </form>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Lista de reconocimientos como tarjetas */}
      <div className="grid gap-6">
        {recognitions.length > 0 ? (
          recognitions.map(rec => {
            const employee = employees.find(emp => emp.id === rec.employee_id) || {};
            return (
              <div key={rec.id} className="bg-white p-6 rounded-lg shadow-md flex items-start space-x-4 hover:shadow-lg transition-shadow">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🏆</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-gray-600 mt-1">{rec.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Insignia: <span className="font-medium">{rec.badge}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(rec.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-8">No hay reconocimientos registrados.</p>
        )}
      </div>

      {/* Paginación */}
      <div className="mt-6 flex justify-between items-center max-w-md mx-auto">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-gray-200 text-gray-700 p-2 rounded-lg disabled:opacity-50 hover:bg-gray-300"
        >
          Anterior
        </button>
        <span className="text-gray-600 truncate">Página {currentPage} de {totalPages || 1}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-gray-200 text-gray-700 p-2 rounded-lg disabled:opacity-50 hover:bg-gray-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default RecognitionPanel;