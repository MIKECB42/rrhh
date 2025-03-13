import React, { useState } from 'react';
import fetchWithToken from '../api/client'; // Cambiar a fetchWithToken
import { formatDate } from '../utils/utils'; // Asumimos que existe esta utilidad

const RecognitionPanel = ({ 
  employees, 
  setNotification, 
  fetchRecognitions, 
  currentPage, 
  recognitions, 
  totalPages,
  userRole
}) => {
  const [newRecognition, setNewRecognition] = useState({ employeeId: '', message: '', badge: 'star', date: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recognitionToDelete, setRecognitionToDelete] = useState(null);

  const handleSubmitRecognition = async (e) => {
    e.preventDefault();
    try {
      const adjustedDate = new Date(newRecognition.date);
      adjustedDate.setUTCDate(adjustedDate.getUTCDate() + 1); // Corrección del día
      const year = adjustedDate.getUTCFullYear();
      const month = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(adjustedDate.getUTCDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const recognition = {
        employee_id: newRecognition.employeeId,
        message: newRecognition.message,
        badge: newRecognition.badge,
        date: formattedDate,
      };
      const response = await fetchWithToken('http://localhost:3001/recognitions', {
        method: 'POST',
        body: JSON.stringify(recognition),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear reconocimiento: ${errorText}`);
      }
      setNewRecognition({ employeeId: '', message: '', badge: 'star', date: '' });
      fetchRecognitions(1); // Refrescar desde la primera página
      setNotification({ message: 'Reconocimiento añadido con éxito', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error submitting recognition:', error);
      setNotification({ message: `Error al guardar el reconocimiento: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchRecognitions(newPage);
    }
  };

  const openDeleteModal = (recognitionId) => {
    if (userRole !== 'admin') {
      setNotification({ message: 'Solo los administradores pueden eliminar reconocimientos', type: 'error' });
      return;
    }
    setRecognitionToDelete(recognitionId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recognitionToDelete) return;

    try {
      const response = await fetchWithToken(`http://localhost:3001/recognitions/${recognitionToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al eliminar el reconocimiento: ${errorText}`);
      }
      fetchRecognitions(currentPage); // Refrescar la lista en la página actual
      setNotification({ message: 'Reconocimiento eliminado con éxito', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error deleting recognition:', error);
      setNotification({ message: `Error al eliminar el reconocimiento: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } finally {
      setShowDeleteModal(false);
      setRecognitionToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Muro de la Fama</h2>
      <form onSubmit={handleSubmitRecognition} className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={newRecognition.employeeId}
            onChange={(e) => setNewRecognition({ ...newRecognition, employeeId: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Selecciona un empleado</option>
            {employees && employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {`${emp.first_name} ${emp.last_name}`}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Mensaje de reconocimiento"
            value={newRecognition.message}
            onChange={(e) => setNewRecognition({ ...newRecognition, message: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="date"
            value={newRecognition.date}
            onChange={(e) => setNewRecognition({ ...newRecognition, date: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <select
            value={newRecognition.badge}
            onChange={(e) => setNewRecognition({ ...newRecognition, badge: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="star">Estrella</option>
            <option value="trophy">Trofeo</option>
            <option value="medal">Medalla</option>
          </select>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            Añadir Reconocimiento
          </button>
        </div>
      </form>

      <div className="recognition-wall max-h-[500px] overflow-y-auto">
        {recognitions && recognitions.length > 0 ? (
          recognitions.map((rec) => {
            const employee = employees.find(emp => emp.id === rec.employee_id);
            return (
              <div key={rec.id} className="bg-white p-4 rounded-lg shadow-lg mb-4 flex items-center justify-between">
                <div>
                  <div className={`badge ${rec.badge} w-8 h-8 rounded-full mr-4`}></div>
                  <p className="font-bold">{employee ? `${employee.first_name} ${employee.last_name}` : 'Desconocido'}</p>
                  <p>{rec.message}</p>
                  <small>{formatDate(rec.date)}</small>
                </div>
                <button 
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                  onClick={() => openDeleteModal(rec.id)}
                >
                  Eliminar
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-gray-700">No hay reconocimientos para mostrar.</p>
        )}
      </div>

      <div className="pagination flex justify-between items-center mt-6">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="text-gray-700">Página {currentPage} de {totalPages}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar este reconocimiento? Esta acción no se puede deshacer.</p>
            <div className="flex gap-4">
              <button 
                className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors"
                onClick={confirmDelete}
              >
                Sí, Eliminar
              </button>
              <button 
                className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecognitionPanel;