// src/components/DepartmentTable.js
import React from 'react';

const DepartmentTable = ({
  departmentForm,
  setDepartmentForm,
  editDepartmentId,
  setEditDepartmentId,
  departmentSearchTerm,
  setDepartmentSearchTerm,
  filteredDepartments,
  handleDepartmentSubmit,
  handleEdit,
  handleDelete,
}) => {
  return (
    <>
      <form onSubmit={handleDepartmentSubmit} className="employee-form">
        <input
          name="name"
          value={departmentForm.name}
          onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
          placeholder="Nombre del Departamento"
          required
        />
        <button type="submit">{editDepartmentId ? 'Actualizar' : 'Agregar'} Departamento</button>
        {editDepartmentId && (
          <button
            type="button"
            onClick={() => {
              setDepartmentForm({ name: '' });
              setEditDepartmentId(null);
            }}
            className="cancel-btn"
          >
            Cancelar
          </button>
        )}
      </form>
      <input
        type="text"
        placeholder="Buscar por nombre"
        value={departmentSearchTerm}
        onChange={(e) => setDepartmentSearchTerm(e.target.value)}
        className="search-input"
      />
      <table className="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.map(dept => (
            <tr key={dept.id}>
              <td>{dept.id}</td>
              <td>{dept.name}</td>
              <td>
                <button className="edit" onClick={() => handleEdit('departments', dept)}>Editar</button>
                <button className="delete" onClick={() => handleDelete('departments', dept.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default DepartmentTable;