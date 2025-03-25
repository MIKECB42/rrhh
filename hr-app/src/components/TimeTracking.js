import React, { useState } from 'react';

const TimeTracking = ({ employeeId }) => {
  const [entryId, setEntryId] = useState(null);

  const handleClockIn = async () => {
    const response = await fetch('http://localhost:3001/time/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ employee_id: employeeId }),
    });
    const data = await response.json();
    setEntryId(data.id);
  };

  const handleClockOut = async () => {
    await fetch(`http://localhost:3001/time/clock-out/${entryId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    setEntryId(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-primary mb-4">Registro de Horas</h2>
      {!entryId ? (
        <button
          onClick={handleClockIn}
          className="bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
        >
          Marcar Entrada
        </button>
      ) : (
        <button
          onClick={handleClockOut}
          className="bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
        >
          Marcar Salida
        </button>
      )}
    </div>
  );
};

export default TimeTracking;