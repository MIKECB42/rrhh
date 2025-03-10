// src/components/Reports.js
import React from 'react';

const Reports = ({ salaryReport, exportToCSV }) => {
  return (
    <div className="reports-section">
      <h2>Reporte de Salarios por Departamento</h2>
      <div className="report-actions">
        <button onClick={exportToCSV} className="btn-export">
          Exportar a CSV
        </button>
      </div>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Departamento</th>
            <th>Empleados</th>
            <th>Salario Total</th>
            <th>Salario Promedio</th>
          </tr>
        </thead>
        <tbody>
          {salaryReport.map((row, index) => (
            <tr key={index}>
              <td>{row.department_name}</td>
              <td>{parseInt(row.employee_count, 10)}</td>
              <td>{row.total_salary ? parseFloat(row.total_salary).toFixed(2) : '0.00'}</td>
              <td>{row.avg_salary ? parseFloat(row.avg_salary).toFixed(2) : '0.00'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;