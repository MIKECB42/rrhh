// src/components/ProfileSection.js
import React from 'react';
import { formatDate } from '../utils/utils';

const ProfileSection = ({ employee, departments, roles }) => {
  if (!employee) return <p>Cargando perfil...</p>;

  return (
    <div className="profile-section">
      <h2>Perfil del Empleado</h2>
      <div className="profile-details">
        <p><strong>Nombre:</strong> {employee.first_name} {employee.last_name}</p>
        <p><strong>Email:</strong> {employee.email}</p>
        <p><strong>Departamento:</strong> {employee.department_id ? departments.find(d => d.id === employee.department_id)?.name || 'Sin asignar' : 'Sin asignar'}</p>
        <p><strong>Cargo:</strong> {employee.role_id ? roles.find(r => r.id === employee.role_id)?.title || 'Sin asignar' : 'Sin asignar'}</p>
        <p><strong>Fecha de Contratación:</strong> {formatDate(employee.hire_date)}</p>
        <p><strong>Salario:</strong> ${employee.role_id ? roles.find(r => r.id === employee.role_id)?.salary?.toLocaleString() || 'N/A' : 'N/A'}</p>
      </div>
    </div>
  );
};

export default ProfileSection;