import React, { useState, useRef, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import ReactDOM from 'react-dom';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionType, setActionType] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, direction: 'bottom' });
  const [currentMenuIndex, setCurrentMenuIndex] = useState(null);

  const menuButtons = useRef([]);
  const menuRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditEmployeeId(null);
    setEmployeeForm({ first_name: '', last_name: '', email: '', hire_date: '', department_id: '', role_id: '' });
  };

  const openActionModal = (employee, type) => {
    setSelectedEmployee(employee);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedEmployee(null);
    setActionType('');
  };

  const confirmAction = () => {
    if (actionType === 'delete') {
      handleDelete('employees', selectedEmployee.id);
    } else if (actionType === 'restore') {
      handleRestore(selectedEmployee.id);
    } else if (actionType === 'history') {
      fetchEmployeeHistory(selectedEmployee.id);
    } else if (actionType === 'edit') {
      handleEdit('employees', selectedEmployee);
      setIsActionModalOpen(false);
      setIsModalOpen(true);
    }
    closeActionModal();
  };

  const handleMenuOpen = (index) => {
    const button = menuButtons.current[index];
    if (button) {
      const rect = button.getBoundingClientRect();
      const menuHeight = 200; // Aproximación de la altura del menú (8 ítems * 25px)
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;

      // Forzar apertura hacia abajo por defecto en la parte superior, hacia arriba justo por encima en la parte inferior
      let direction = 'bottom';
      let y = rect.bottom + 8; // Posición justo debajo del botón

      // Si estamos en la mitad inferior o cerca del borde inferior, abrir hacia arriba justo por encima
      if (rect.top > viewportHeight / 2 || spaceBelow < menuHeight) {
        direction = 'top';
        y = rect.top - 8; // Posición justo por encima del botón
      }

      const x = rect.right - 192; // 192px es el ancho del menú (w-48)

      setMenuPosition({ x, y, direction });
      setCurrentMenuIndex(index);
    }
  };

  const handleMenuClose = () => {
    setCurrentMenuIndex(null);
  };

  // Cierre del menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && currentMenuIndex !== null) {
        handleMenuClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentMenuIndex]);

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* Botón Flotante para Añadir Empleado */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-secondary transition-colors z-50"
      >
        + Añadir Empleado
      </button>

      {/* Modal para Añadir/Editar Empleado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold text-primary mb-6">{editEmployeeId ? 'Editar Empleado' : 'Añadir Empleado'}</h2>
            <form onSubmit={handleEmployeeSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="first_name"
                  value={employeeForm.first_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                  placeholder="Nombre"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  name="last_name"
                  value={employeeForm.last_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                  placeholder="Apellido"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  name="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  placeholder="Email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  name="hire_date"
                  type="date"
                  value={employeeForm.hire_date}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <select
                  name="department_id"
                  value={employeeForm.department_id}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, department_id: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Selecciona Cargo</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  {editEmployeeId ? 'Actualizar' : 'Agregar'} Empleado
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Confirmar Acciones */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">
              {actionType === 'delete' ? 'Confirmar Eliminación' : 
               actionType === 'restore' ? 'Confirmar Restauración' : 
               actionType === 'history' ? 'Ver Historial' : 'Confirmar Acción'}
            </h2>
            <p className="text-gray-700 mb-6">
              {actionType === 'delete' ? `¿Estás seguro de que deseas eliminar a ${selectedEmployee.first_name} ${selectedEmployee.last_name}?` :
               actionType === 'restore' ? `¿Estás seguro de que deseas restaurar a ${selectedEmployee.first_name} ${selectedEmployee.last_name}?` :
               actionType === 'history' ? `Abriendo historial de ${selectedEmployee.first_name} ${selectedEmployee.last_name}` :
               actionType === 'edit' ? `Editando a ${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmAction}
                className={`${actionType === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-secondary'} text-white p-3 rounded-lg transition-colors`}
              >
                {actionType === 'delete' ? 'Eliminar' : 
                 actionType === 'restore' ? 'Restaurar' : 
                 actionType === 'history' ? 'Abrir' : 
                 actionType === 'edit' ? 'Editar' : 'Confirmar'}
              </button>
              <button
                onClick={closeActionModal}
                className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controles de Empleados */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-lg border ${!showInactive ? 'bg-primary text-white border-primary' : 'bg-gray-100 border-gray-300'} hover:bg-opacity-80 transition-colors`}
            onClick={() => { setShowInactive(false); resetFilters(); }}
          >
            👤 Activos
          </button>
          <button
            className={`px-4 py-2 rounded-lg border ${showInactive ? 'bg-primary text-white border-primary' : 'bg-gray-100 border-gray-300'} hover:bg-opacity-80 transition-colors`}
            onClick={() => { setShowInactive(true); resetFilters(); }}
          >
            🗑️ Inactivos
          </button>
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? 'Ocultar Filtros' : 'Búsqueda Avanzada'} 🔍
        </button>
      </div>

      {/* Filtros Avanzados */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4">
          <select
            value={filters.department_id}
            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los departamentos</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.hire_date_start}
            onChange={(e) => setFilters({ ...filters, hire_date_start: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Fecha inicio"
          />
          <input
            type="date"
            value={filters.hire_date_end}
            onChange={(e) => setFilters({ ...filters, hire_date_end: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Fecha fin"
          />
          <input
            type="number"
            value={filters.salary_min}
            onChange={(e) => setFilters({ ...filters, salary_min: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Salario mínimo"
          />
          <input
            type="number"
            value={filters.salary_max}
            onChange={(e) => setFilters({ ...filters, salary_max: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Salario máximo"
          />
          <button
            onClick={resetFilters}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="flex gap-4 mb-6">
        <select
          value={searchCriteria}
          onChange={(e) => setSearchCriteria(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="first_name">Nombre</option>
          <option value="last_name">Apellido</option>
          <option value="email">Email</option>
        </select>
        <input
          type="text"
          placeholder={`Buscar por ${searchCriteria === 'first_name' ? 'nombre' : searchCriteria === 'last_name' ? 'apellido' : 'email'}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Tabla de Empleados */}
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full max-w-full bg-white rounded-lg shadow-lg">
          <thead>
            <tr className="bg-primary text-white sticky top-0 z-10">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Apellido</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Fecha Contratación</th>
              <th className="p-3 text-left">Departamento</th>
              <th className="p-3 text-left">Cargo</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr
                key={employee.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">{employee.id}</td>
                <td className="p-3">{employee.first_name}</td>
                <td className="p-3">{employee.last_name}</td>
                <td className="p-3">{employee.email}</td>
                <td className="p-3">{formatDate(employee.hire_date)}</td>
                <td className="p-3">
                  {employee.department_id ? departments.find(d => d.id === employee.department_id)?.name || 'Sin asignar' : 'Sin asignar'}
                </td>
                <td className="p-3">
                  {employee.role_id ? roles.find(r => r.id === employee.role_id)?.title || 'Sin asignar' : 'Sin asignar'}
                </td>
                <td className="p-3">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button
                      ref={el => (menuButtons.current[index] = el)}
                      onClick={() => handleMenuOpen(index)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ...
                    </Menu.Button>
                    {currentMenuIndex === index && ReactDOM.createPortal(
                      <Menu.Items
                        static
                        ref={menuRef}
                        className="fixed bg-white rounded-lg shadow-lg z-50 w-48"
                        style={{
                          top: menuPosition.y,
                          left: menuPosition.x,
                          transform: menuPosition.direction === 'top' ? 'translateY(-100%)' : 'none',
                        }}
                      >
                        <div className="py-1">
                          <Menu.Item>
                            {({ active, close }) => (
                              <button
                                onClick={() => {
                                  openActionModal(employee, 'edit');
                                  close();
                                }}
                                className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-blue-500 text-white' : 'text-gray-700'} hover:bg-blue-500 hover:text-white`}
                              >
                                Editar
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active, close }) => (
                              <button
                                onClick={() => {
                                  openActionModal(employee, 'delete');
                                  close();
                                }}
                                className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-red-500 text-white' : 'text-gray-700'} hover:bg-red-500 hover:text-white`}
                              >
                                Eliminar
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active, close }) => (
                              <button
                                onClick={() => {
                                  openActionModal(employee, 'history');
                                  close();
                                }}
                                className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-green-500 text-white' : 'text-gray-700'} hover:bg-green-500 hover:text-white`}
                              >
                                Historial
                              </button>
                            )}
                          </Menu.Item>
                          {showInactive && (
                            <Menu.Item>
                              {({ active, close }) => (
                                <button
                                  onClick={() => {
                                    openActionModal(employee, 'restore');
                                    close();
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-green-500 text-white' : 'text-gray-700'} hover:bg-green-500 hover:text-white`}
                                >
                                  Restaurar
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active, close }) => (
                              <button
                                onClick={() => {
                                  fetchEmployeeProfile(employee.id);
                                  close();
                                }}
                                className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-primary text-white' : 'text-gray-700'} hover:bg-primary hover:text-white`}
                              >
                                Perfil
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>,
                      document.body
                    )}
                  </Menu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;