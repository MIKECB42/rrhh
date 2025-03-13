// src/components/EmployeeProfile.js
import React, { useState } from 'react';
import ProfileSection from './ProfileSection';
import HistorySection from './HistorySection';
import TimeTracking from './TimeTracking'; // Importamos el nuevo componente
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';

const EmployeeProfile = ({ employeeId, setNotification, departments, roles }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { employee, history, loading, error, fetchEmployeeData } = useEmployeeProfile(employeeId, setNotification);

  if (loading) return <p className="text-center text-gray-500">Cargando perfil...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Perfil del Empleado</h1>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'profile' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-opacity-80 transition-colors`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'history' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-opacity-80 transition-colors`}
        >
          Historial
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'time' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
          } hover:bg-opacity-80 transition-colors`}
        >
          Registro de Horas
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {activeTab === 'profile' && <ProfileSection employee={employee} departments={departments} roles={roles} />}
        {activeTab === 'history' && <HistorySection history={history} />}
        {activeTab === 'time' && <TimeTracking employeeId={employeeId} />}
      </div>
      <button
        onClick={fetchEmployeeData}
        className="mt-6 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
      >
        Recargar Datos
      </button>
    </div>
  );
};

export default EmployeeProfile;