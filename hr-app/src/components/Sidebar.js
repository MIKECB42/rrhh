import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed left-0 top-0 w-64 h-full bg-gray-800 text-white p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-6">INGENIUS</h1>
      <ul className="space-y-4">
        {[
          { tab: 'employees', icon: '👤', label: 'Empleados' },
          { tab: 'departments', icon: '🏢', label: 'Departamentos' },
          { tab: 'roles', icon: '🎓', label: 'Cargos' },
          { tab: 'dashboard', icon: '📊', label: 'Dashboard' },
          { tab: 'reports', icon: '📊', label: 'Reportes' },
          { tab: 'recognitions', icon: '🏆', label: 'Reconocimientos' },
          { tab: 'employee-profile', icon: '👤', label: 'Perfil de Empleado' },
        ].map(({ tab, icon, label }) => (
          <li
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`p-4 cursor-pointer rounded-lg transition-colors ${
              activeTab === tab ? 'bg-primary' : 'hover:bg-gray-700'
            }`}
          >
            {icon} {label}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;