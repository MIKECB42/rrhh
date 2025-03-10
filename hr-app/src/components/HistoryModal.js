// src/components/HistoryModal.js
import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/utils';

const HistoryModal = ({ employees, currentEmployeeId, showHistoryModal, setShowHistoryModal }) => {
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');

  const fetchEmployeeHistory = async (employeeId) => {
    try {
      const response = await fetch(`http://localhost:3001/employees/${employeeId}/history`);
      const data = await response.json();
      setHistory(data);
      setHistoryFilter('');
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    if (showHistoryModal && currentEmployeeId) {
      fetchEmployeeHistory(currentEmployeeId);
    }
  }, [showHistoryModal, currentEmployeeId]);

  const filteredHistory = history.filter(entry => {
    let oldValue = entry.old_value;
    let newValue = entry.new_value;

    if (entry.field_changed === 'hire_date') {
      oldValue = formatDate(entry.old_value);
      newValue = formatDate(entry.new_value);
    }

    const isRealChange = oldValue !== newValue;
    if (!isRealChange) {
      console.log('Entrada filtrada por no cambio:', entry);
    }

    return (!historyFilter || entry.field_changed === historyFilter) && isRealChange;
  });

  const exportHistoryToCSV = () => {
    const headers = 'Campo,Valor Anterior,Nuevo Valor,Fecha\n';
    const rows = filteredHistory.map(entry =>
      `${entry.field_changed},${entry.old_value},${entry.new_value},${formatDate(entry.change_date)}`
    ).join('\n');
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const employeeName = `${employees.find(e => e.id === history[0]?.employee_id)?.first_name || ''}_${employees.find(e => e.id === history[0]?.employee_id)?.last_name || ''}`;
    link.href = url;
    link.download = `history_${employeeName}.csv`;
    link.click();
  };

  return (
    showHistoryModal && (
      <div className="modal">
        <div className="modal-content">
          <h2>Historial de Cambios - {employees.find(e => e.id === currentEmployeeId)?.first_name || ''} {employees.find(e => e.id === currentEmployeeId)?.last_name || ''}</h2>
          <div className="history-filter">
            <select onChange={(e) => setHistoryFilter(e.target.value)} value={historyFilter}>
              <option value="">Todos los cambios</option>
              <option value="hire_date">Fecha de Contratación</option>
              <option value="department_id">Departamento</option>
              <option value="role_id">Cargo</option>
            </select>
          </div>
          {filteredHistory.length > 0 ? (
            <div className="timeline">
              {filteredHistory.map((entry, index) => (
                <div key={index} className={`timeline-item timeline-${entry.field_changed}`}>
                  <div className="timeline-icon">
                    {entry.field_changed === 'hire_date' && '📅'}
                    {entry.field_changed === 'department_id' && '🏢'}
                    {entry.field_changed === 'role_id' && '👤'}
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-date">{formatDate(entry.change_date)}</span>
                    <p><strong>{entry.field_changed}</strong></p>
                    <p>
                      De: <s>{entry.field_changed === 'hire_date' ? formatDate(entry.old_value) : entry.old_value}</s> → 
                      A: <strong>{entry.field_changed === 'hire_date' ? formatDate(entry.new_value) : entry.new_value}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-changes">
              <p>Este empleado no tiene cambios registrados.</p>
            </div>
          )}
          <div className="modal-actions">
            <button onClick={() => setShowHistoryModal(false)}>Cerrar</button>
            <button onClick={exportHistoryToCSV} disabled={filteredHistory.length === 0}>Exportar a CSV</button>
          </div>
        </div>
      </div>
    )
  );
};

export default HistoryModal;