// src/components/Sidebar.js
import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="sidebar">
      <h1>INGENIUS</h1>
      <ul>
        <li onClick={() => setActiveTab('employees')} className={activeTab === 'employees' ? 'active' : ''}>
          👤 Empleados
        </li>
        <li onClick={() => setActiveTab('departments')} className={activeTab === 'departments' ? 'active' : ''}>
          🏢 Departamentos
        </li>
        <li onClick={() => setActiveTab('roles')} className={activeTab === 'roles' ? 'active' : ''}>
          🎓 Cargos
        </li>
        <li onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
          📊 Dashboard
        </li>
        <li onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'active' : ''}>
          📊 Reportes
        </li>
        <li onClick={() => setActiveTab('recognitions')} className={activeTab === 'recognitions' ? 'active' : ''}>
          🏆 Reconocimientos
        </li>
        <li onClick={() => setActiveTab('employee-profile')} className={activeTab === 'employee-profile' ? 'active' : ''}>
          👤 Perfil de Empleado
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;