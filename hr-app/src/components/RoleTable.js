// src/components/RoleTable.js
import React from 'react';

const RoleTable = ({
  roleForm,
  setRoleForm,
  editRoleId,
  setEditRoleId,
  roleSearchTerm,
  setRoleSearchTerm,
  filteredRoles,
  handleRoleSubmit,
  handleEdit,
  handleDelete,
}) => {
  return (
    <>
      <form onSubmit={handleRoleSubmit} className="employee-form">
        <input
          name="title"
          value={roleForm.title}
          onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })}
          placeholder="Título del cargo"
          required
        />
        <input
          name="salary"
          type="number"
          value={roleForm.salary}
          onChange={(e) => setRoleForm({ ...roleForm, salary: e.target.value })}
          placeholder="Salario"
          required
        />
        <button type="submit">{editRoleId ? 'Actualizar' : 'Agregar'} Cargo</button>
        {editRoleId && (
          <button
            type="button"
            onClick={() => {
              setRoleForm({ title: '', salary: '' });
              setEditRoleId(null);
            }}
            className="cancel-btn"
          >
            Cancelar
          </button>
        )}
      </form>
      <input
        type="text"
        placeholder="Buscar por título"
        value={roleSearchTerm}
        onChange={(e) => setRoleSearchTerm(e.target.value)}
        className="search-input"
      />
      <table className="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Salario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredRoles.map(role => (
            <tr key={role.id}>
              <td>{role.id}</td>
              <td>{role.title}</td>
              <td>{role.salary}</td>
              <td>
                <button className="edit" onClick={() => handleEdit('roles', role)}>Editar</button>
                <button className="delete" onClick={() => handleDelete('roles', role.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default RoleTable;