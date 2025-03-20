import React, { useState, useRef, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import ReactDOM from 'react-dom';
import { formatDate } from '../utils/utils';

const RoleTable = ({
  roleForm,
  setRoleForm,
  editRoleId,
  setEditRoleId,
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
  filteredRoles,
  handleRoleSubmit,
  handleEdit,
  handleDelete,
  fetchRoleHistory,
  handleRestore,
  resetFilters,
  fetchRoleProfile,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [actionType, setActionType] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, direction: 'bottom' });
  const [currentMenuIndex, setCurrentMenuIndex] = useState(null);

  const menuButtons = useRef([]);
  const menuRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditRoleId(null);
    setRoleForm({ title: '', salary: '' }); // Solo 'title' y 'salary' basado en la estructura de la tabla
  };

  const openActionModal = (role, type) => {
    setSelectedRole(role);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedRole(null);
    setActionType('');
  };

  const confirmAction = () => {
    if (actionType === 'delete') {
      handleDelete('roles', selectedRole.id);
    } else if (actionType === 'restore') {
      handleRestore(selectedRole.id);
    } else if (actionType === 'history') {
      fetchRoleHistory(selectedRole.id);
    } else if (actionType === 'edit') {
      handleEdit('roles', selectedRole);
      setIsActionModalOpen(false);
      setIsModalOpen(true);
    } else if (actionType === 'profile') {
      fetchRoleProfile(selectedRole.id);
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
      {/* Botón Flotante para Añadir Cargo */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-secondary transition-colors z-50"
      >
        + Añadir Cargo
      </button>

      {/* Modal para Añadir/Editar Cargo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold text-primary mb-6">{editRoleId ? 'Editar Cargo' : 'Añadir Cargo'}</h2>
            <form onSubmit={handleRoleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <input
                  name="title"
                  value={roleForm.title}
                  onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })}
                  placeholder="Título"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  name="salary"
                  type="number"
                  step="0.01"
                  value={roleForm.salary}
                  onChange={(e) => setRoleForm({ ...roleForm, salary: e.target.value })}
                  placeholder="Salario"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  {editRoleId ? 'Actualizar' : 'Agregar'} Cargo
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
              {actionType === 'delete' ? `¿Estás seguro de que deseas eliminar el cargo ${selectedRole.title}?` :
               actionType === 'restore' ? `¿Estás seguro de que deseas restaurar el cargo ${selectedRole.title}?` :
               actionType === 'history' ? `Abriendo historial del cargo ${selectedRole.title}` :
               actionType === 'edit' ? `Editando el cargo ${selectedRole.title}` : 
               actionType === 'profile' ? `Ver perfil del cargo ${selectedRole.title}` : ''}
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmAction}
                className={`${actionType === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-secondary'} text-white p-3 rounded-lg transition-colors`}
              >
                {actionType === 'delete' ? 'Eliminar' : 
                 actionType === 'restore' ? 'Restaurar' : 
                 actionType === 'history' ? 'Abrir' : 
                 actionType === 'edit' ? 'Editar' : 
                 actionType === 'profile' ? 'Ver' : 'Confirmar'}
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

      {/* Controles de Cargos */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-lg border ${!showInactive ? 'bg-primary text-white border-primary' : 'bg-gray-100 border-gray-300'} hover:bg-opacity-80 transition-colors`}
            onClick={() => { setShowInactive(false); resetFilters(); }}
          >
            🎩 Activos
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
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            value={filters.salary_min || ''}
            onChange={(e) => setFilters({ ...filters, salary_min: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Salario mínimo"
          />
          <input
            type="number"
            value={filters.salary_max || ''}
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
        <input
          type="text"
          placeholder="Buscar por título"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Tabla de Cargos */}
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full max-w-full bg-white rounded-lg shadow-lg">
          <thead>
            <tr className="bg-primary text-white sticky top-0 z-10">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Título</th>
              <th className="p-3 text-left">Salario</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role, index) => (
              <tr
                key={role.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">{role.id}</td>
                <td className="p-3">{role.title}</td>
                <td className="p-3">{role.salary}</td>
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
                                  openActionModal(role, 'edit');
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
                                  openActionModal(role, 'delete');
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
                                  openActionModal(role, 'history');
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
                                    openActionModal(role, 'restore');
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
                                  openActionModal(role, 'profile');
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

export default RoleTable;