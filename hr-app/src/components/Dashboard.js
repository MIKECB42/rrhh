import React from 'react';
import { Bar } from 'react-chartjs-2';

const Dashboard = ({ dashboardData, chartData }) => {
  // Configuración del gráfico
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Distribución de Empleados por Departamento' },
    },
  };

  // Transformar chartData al formato requerido por Chart.js
  const chartConfig = {
    labels: Array.isArray(chartData) && chartData.length > 0 ? chartData.map(item => item.name) : [],
    datasets: [
      {
        label: 'Cantidad de Empleados',
        data: Array.isArray(chartData) && chartData.length > 0 ? chartData.map(item => item.employee_count) : [],
        backgroundColor: '#1E40AF', // Color text-primary (azul oscuro, similar a blue-900 en Tailwind)
        borderColor: '#1E40AF', // Borde igual al fondo para uniformidad
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">👤 Empleados Activos</h3>
          <p className="text-2xl font-bold text-primary">{dashboardData.activeEmployees || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🗑️ Empleados Inactivos</h3>
          <p className="text-2xl font-bold text-primary">{dashboardData.inactiveEmployees || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">💰 Salario Total</h3>
          <p className="text-2xl font-bold text-primary">${(dashboardData.totalSalary || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🏢 Departamentos</h3>
          <p className="text-2xl font-bold text-primary">{dashboardData.departmentCount || 0}</p>
        </div>
      </div>
      <div className="mt-6 max-w-2xl mx-auto">
        {Array.isArray(chartData) && chartData.length > 0 ? (
          <Bar data={chartConfig} options={chartOptions} />
        ) : (
          <p className="text-gray-500 text-center">No hay datos disponibles para la gráfica.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;