// src/components/RecognitionPanel.js
import React, { useState } from 'react';

const RecognitionPanel = ({ 
  employees, 
  setNotification, 
  fetchRecognitions, 
  currentPage, 
  recognitions, 
  totalPages
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
      const response = await fetch('http://localhost:3001/recognitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setRecognitionToDelete(recognitionId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recognitionToDelete) return;

    try {
      const response = await fetch(`http://localhost:3001/recognitions/${recognitionToDelete}`, {
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
    <div className="recognition-panel">
      <h2>Muro de la Fama</h2>
      <form onSubmit={handleSubmitRecognition} className="recognition-form">
        <select
          value={newRecognition.employeeId}
          onChange={(e) => setNewRecognition({ ...newRecognition, employeeId: e.target.value })}
          required
        >
          <option value="">Selecciona un empleado</option>
          {employees.map(emp => (
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
          required
        />
        <input
          type="date"
          value={newRecognition.date}
          onChange={(e) => setNewRecognition({ ...newRecognition, date: e.target.value })}
          required
        />
        <select
          value={newRecognition.badge}
          onChange={(e) => setNewRecognition({ ...newRecognition, badge: e.target.value })}
        >
          <option value="star">Estrella</option>
          <option value="trophy">Trofeo</option>
          <option value="medal">Medalla</option>
        </select>
        <button type="submit">Añadir Reconocimiento</button>
      </form>

      <div className="recognition-wall">
        {recognitions.length > 0 ? (
          recognitions.map((rec) => {
            const employee = employees.find(emp => emp.id === rec.employee_id);
            return (
              <div key={rec.id} className="recognition-card">
                <div className={`badge ${rec.badge}`}></div>
                <p>{employee ? `${employee.first_name} ${employee.last_name}` : 'Desconocido'}</p>
                <p>{rec.message}</p>
                <small>{rec.date}</small>
                <button 
                  className="delete-btn" 
                  onClick={() => openDeleteModal(rec.id)}
                >
                  🗑️ Eliminar
                </button>
              </div>
            );
          })
        ) : (
          <p>No hay reconocimientos para mostrar.</p>
        )}
      </div>

      <div className="pagination">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>

      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirmar Eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar este reconocimiento? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button 
                className="confirm-btn" 
                onClick={confirmDelete}
              >
                Sí, Eliminar
              </button>
              <button 
                className="cancel-btn" 
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