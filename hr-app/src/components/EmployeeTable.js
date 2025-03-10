// src/components/EmployeeTable.js
import React from 'react';
import { formatDate } from '../utils/utils';

const EmployeeTable = ({
  employeeForm,
  setEmployeeForm,
  departments,
  roles,
  editEmployeeId,
  setEditEmployeeId,
  showInactive,
  setShowInactive,
  showAdvancedFilters,
  setShowAdvancedFilters,
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  searchCriteria,
  setSearchCriteria,
  filteredEmployees,
  handleEmployeeSubmit,
  handleEdit,
  handleDelete,
  fetchEmployeeHistory,
  handleRestore,
  resetFilters,
  fetchEmployeeProfile,
}) => {
  return (
    <>
      <form onSubmit={handleEmployeeSubmit} className="employee-form">
        <input
          name="first_name"
          value={employeeForm.first_name}
          onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
          placeholder="Nombre"
          required
        />
        <input
          name="last_name"
          value={employeeForm.last_name}
          onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
          placeholder="Apellido"
          required
        />
        <input
          name="email"
          value={employeeForm.email}
          onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
          placeholder="Email"
          required
        />
        <input
          name="hire_date"
          type="date"
          value={employeeForm.hire_date}
          onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })}
          required
        />
        <select
          name="department_id"
          value={employeeForm.department_id}
          onChange={(e) => setEmployeeForm({ ...employeeForm, department_id: e.target.value })}
          required
        >
          <option value="">Selecciona Departamento</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        <select
          name="role_id"
          value={employeeForm.role_id}
          onChange={(e) => setEmployeeForm({ ...employeeForm, role_id: e.target.value })}
          required
        >
          <option value="">Selecciona Cargo</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.title}</option>
          ))}
        </select>
        <button type="submit">{editEmployeeId ? 'Actualizar' : 'Agregar'} Empleado</button>
        {editEmployeeId && (
          <button
            type="button"
            onClick={() => {
              setEmployeeForm({ first_name: '', last_name: '', email: '', hire_date: '', department_id: '', role_id: '' });
              setEditEmployeeId(null);
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="employee-controls">
        <div className="employee-toggle">
          <button
            className={`toggle-btn ${!showInactive ? 'active' : ''}`}
            onClick={() => {
              setShowInactive(false);
              resetFilters();
            }}
          >
            👤 Activos
          </button>
          <button
            className={`toggle-btn ${showInactive ? 'active' : ''}`}
            onClick={() => {
              setShowInactive(true);
              resetFilters();
            }}
          >
            🗑️ Inactivos
          </button>
        </div>

        <button
          className="toggle-filters-btn"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? 'Ocultar Filtros' : 'Búsqueda Avanzada'} 🔍
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="filters">
          <select
            value={filters.department_id}
            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
          >
            <option value="">Todos los Departamentos</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.hire_date_start}
            onChange={(e) => setFilters({ ...filters, hire_date_start: e.target.value })}
            placeholder="Fecha Inicio"
          />
          <input
            type="date"
            value={filters.hire_date_end}
            onChange={(e) => setFilters({ ...filters, hire_date_end: e.target.value })}
            placeholder="Fecha Fin"
          />
          <input
            type="number"
            value={filters.salary_min}
            onChange={(e) => setFilters({ ...filters, salary_min: e.target.value })}
            placeholder="Salario Mínimo"
          />
          <input
            type="number"
            value={filters.salary_max}
            onChange={(e) => setFilters({ ...filters, salary_max: e.target.value })}
            placeholder="Salario Máximo"
          />
          <button
            className="reset-filters-btn"
            onClick={resetFilters}
          >
            Cancelar Filtros ❌
          </button>
        </div>
      )}

      <div className="search-bar">
        <select value={searchCriteria} onChange={(e) => setSearchCriteria(e.target.value)}>
          <option value="first_name">Nombre</option>
          <option value="email">Email</option>
          <option value="department">Departamento</option>
        </select>
        <input
          type="text"
          placeholder={`Buscar por ${searchCriteria === 'first_name' ? 'nombre' : searchCriteria === 'email' ? 'email' : 'departamento'}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Fecha Contratación</th>
            <th>Departamento</th>
            <th>Cargo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(employee => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.first_name}</td>
              <td>{employee.last_name}</td>
              <td>{employee.email}</td>
              <td>{formatDate(employee.hire_date)}</td>
              <td>{departments.find(d => d.id === employee.department_id)?.name || employee.department_id}</td>
              <td>{roles.find(r => r.id === employee.role_id)?.title || employee.role_id}</td>
              <td>
                {showInactive ? (
                  <button className="restore-btn" onClick={() => handleRestore(employee.id)}>
                    🔄 Reactivar
                  </button>
                ) : (
                  <>
                    <button className="edit" onClick={() => handleEdit('employees', employee)}>✏️ Editar</button>
                    <button className="delete" onClick={() => handleDelete('employees', employee.id)}>🗑️ Eliminar</button>
                    <button className="history" onClick={() => fetchEmployeeHistory(employee.id)}>📜 Historial</button>
                    <button className="profile" onClick={() => fetchEmployeeProfile(employee.id)}>👤 Ver Perfil</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default EmployeeTable;