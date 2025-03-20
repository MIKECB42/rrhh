// src/components/HistorySection.js
import React from 'react';
import { formatDate } from '../utils/utils';

const HistorySection = ({ history }) => {
  if (!history || history.length === 0) return <p>No hay historial disponible.</p>;

  return (
    <div className="history-section">
      <h2>Historial de Cambios</h2>
      <div className="timeline">
        {history.map((entry, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-date">{formatDate(entry.change_date)}</div>
            <p><strong>{entry.field_changed}</strong>: De {entry.old_value} a {entry.new_value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;