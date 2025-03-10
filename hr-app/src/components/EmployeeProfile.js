// src/components/EmployeeProfile.js
import React, { useState } from 'react';
import ProfileSection from './ProfileSection';
import HistorySection from './HistorySection';
// import VacationSection from './VacationSection'; // Eliminamos esta importación
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';

const EmployeeProfile = ({ employeeId, setNotification, departments, roles }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { employee, history, loading, error, fetchEmployeeData } = useEmployeeProfile(employeeId, setNotification);

  if (loading) return <p>Cargando perfil...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="employee-profile">
      <h1>Perfil del Empleado</h1>
      <div className="tab-buttons">
        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'active' : ''}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'active' : ''}
        >
          Historial
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'profile' && <ProfileSection employee={employee} departments={departments} roles={roles} />}
        {activeTab === 'history' && <HistorySection history={history} />}
      </div>
      <button onClick={fetchEmployeeData}>Recargar Datos</button>
    </div>
  );
};

export default EmployeeProfile;