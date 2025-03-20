import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/utils';

const HistoryModal = ({ employees, currentEmployeeId, showHistoryModal, setShowHistoryModal }) => {
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');

  const fetchEmployeeHistory = async (employeeId) => {
    try {
      const response = await fetch(`http://localhost:3001/employees/${employeeId}/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
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
    const employeeName = `${employees.find(e => e.id === history[0]?.employee_id)?.first_name || ''}_${employees.find(e => e.id === history[0]?.employee_id)?.last_name || ''}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `history_${employeeName}.csv`;
    link.click();
  };

  return (
    showHistoryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Historial de Cambios - {employees.find(e => e.id === currentEmployeeId)?.first_name || ''} {employees.find(e => e.id === currentEmployeeId)?.last_name || ''}
          </h2>
          <div className="mb-4">
            <select
              onChange={(e) => setHistoryFilter(e.target.value)}
              value={historyFilter}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full"
            >
              <option value="">Todos los cambios</option>
              <option value="hire_date">Fecha de Contratación</option>
              <option value="department_id">Departamento</option>
              <option value="role_id">Cargo</option>
            </select>
          </div>
          {filteredHistory.length > 0 ? (
            <div className="space-y-4">
              {filteredHistory.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-lg shadow-sm ${
                    entry.field_changed === 'hire_date' ? 'bg-blue-50' :
                    entry.field_changed === 'department_id' ? 'bg-green-50' :
                    entry.field_changed === 'role_id' ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center text-lg">
                    {entry.field_changed === 'hire_date' && '📅'}
                    {entry.field_changed === 'department_id' && '🏢'}
                    {entry.field_changed === 'role_id' && '👤'}
                  </div>
                  <div className="flex-1">
                    <span className="block text-sm text-gray-500">{formatDate(entry.change_date)}</span>
                    <p className="font-semibold text-gray-800">{entry.field_changed}</p>
                    <p className="text-gray-700">
                      De: <span className="line-through">{entry.field_changed === 'hire_date' ? formatDate(entry.old_value) : entry.old_value}</span> → 
                      A: <span className="font-bold">{entry.field_changed === 'hire_date' ? formatDate(entry.new_value) : entry.new_value}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 text-gray-500 italic">
              <p>Este empleado no tiene cambios registrados.</p>
            </div>
          )}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={exportHistoryToCSV}
              disabled={filteredHistory.length === 0}
              className={`p-3 rounded-lg transition-colors ${
                filteredHistory.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-secondary'
              }`}
            >
              Exportar a CSV
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default HistoryModal;