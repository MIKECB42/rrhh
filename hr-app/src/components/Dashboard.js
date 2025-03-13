import React from 'react';
import { Bar } from 'react-chartjs-2';

const Dashboard = ({ dashboardData, chartData }) => {
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
        <Bar data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default Dashboard;