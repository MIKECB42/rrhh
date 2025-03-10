// src/components/Dashboard.js
import React from 'react';
import { Bar } from 'react-chartjs-2';

const Dashboard = ({ dashboardData, chartData }) => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="dashboard-cards">
        <div className="card">
          <h3>👤 Empleados Activos</h3>
          <p>{dashboardData.activeEmployees || 0}</p>
        </div>
        <div className="card">
          <h3>🗑️ Empleados Inactivos</h3>
          <p>{dashboardData.inactiveEmployees || 0}</p>
        </div>
        <div className="card">
          <h3>💰 Salario Total</h3>
          <p>${(dashboardData.totalSalary || 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>🏢 Departamentos</h3>
          <p>{dashboardData.departmentCount || 0}</p>
        </div>
      </div>
      <div className="chart-container">
        <Bar data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default Dashboard;