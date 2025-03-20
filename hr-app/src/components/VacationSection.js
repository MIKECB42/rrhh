// src/components/VacationSection.js
import React from 'react';
import { formatDate } from '../utils/utils';

const VacationSection = ({ vacations }) => {
  if (!vacations || vacations.length === 0) return <p>No hay solicitudes de vacaciones.</p>;

  return (
    <div className="vacation-section">
      <h2>Solicitudes de Vacaciones</h2>
      <table className="vacation-table">
        <thead>
          <tr>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {vacations.map((vacation, index) => (
            <tr key={index}>
              <td>{formatDate(vacation.start_date)}</td>
              <td>{formatDate(vacation.end_date)}</td>
              <td>{vacation.status || 'Pendiente'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VacationSection;