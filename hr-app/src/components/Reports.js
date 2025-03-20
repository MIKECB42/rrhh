import React, { useState } from 'react';

const Reports = ({ salaryReport, exportToCSV }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({ date_start: '', date_end: '' });

  // Filtrar reportes por término de búsqueda (departamento)
  const filteredSalaryReport = salaryReport.filter(report =>
    report.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Reporte de Salarios por Departamento</h2>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Ocultar Filtros' : 'Búsqueda Avanzada'} 🔍
          </button>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
        >
          Exportar a CSV
        </button>
      </div>

      {/* Filtros Avanzados */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4">
          <input
            type="date"
            value={filters.date_start}
            onChange={(e) => setFilters({ ...filters, date_start: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Fecha inicio"
          />
          <input
            type="date"
            value={filters.date_end}
            onChange={(e) => setFilters({ ...filters, date_end: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Fecha fin"
          />
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por departamento"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Tabla de Reportes */}
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full max-w-full bg-white rounded-lg shadow-lg">
          <thead>
            <tr className="bg-primary text-white sticky top-0 z-10">
              <th className="p-3 text-left">Departamento</th>
              <th className="p-3 text-left">Empleados</th>
              <th className="p-3 text-left">Salario Total</th>
              <th className="p-3 text-left">Salario Promedio</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalaryReport.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3">{row.department_name}</td>
                <td className="p-3">{parseInt(row.employee_count, 10)}</td>
                <td className="p-3">{row.total_salary ? parseFloat(row.total_salary).toFixed(2) : '0.00'}</td>
                <td className="p-3">{row.avg_salary ? parseFloat(row.avg_salary).toFixed(2) : '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;