import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from './components/Sidebar';
import EmployeeTable from './components/EmployeeTable';
import DepartmentTable from './components/DepartmentTable';
import RoleTable from './components/RoleTable';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import RecognitionPanel from './components/RecognitionPanel';
import HistoryModal from './components/HistoryModal';
import EmployeeProfile from './components/EmployeeProfile';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import fetchWithToken from './api/client';
import { useEmployees } from './hooks/useEmployees';
import { useDepartments } from './hooks/useDepartments';
import { useRoles } from './hooks/useRoles';
import { useDashboard } from './hooks/useDashboard';
import { useReports } from './hooks/useReports';
import { useRecognitions } from './hooks/useRecognitions';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1 className="text-center text-red-500">Algo salió mal. Por favor, recarga la página.</h1>;
    }
    return this.props.children;
  }
}

const Header = ({ userRole, userRoles, setUserRole, onLogout }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('employeeId');
    onLogout();
    navigate('/');
  };

  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
    localStorage.setItem('userRole', newRole);
    navigate(newRole === 'employee' ? '/profile' : '/dashboard');
    setIsDropdownOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-primary text-white p-4 shadow-md z-10">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo o Título */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">HR System</h1>
        </div>

        {/* Barra de Búsqueda */}
        <div className="flex-1 mx-4">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full max-w-md p-2 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        {/* Opciones de Usuario */}
        <div className="flex items-center gap-4">
          {/* Cambio de Rol */}
          {userRoles && userRoles.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white text-primary p-2 rounded-lg hover:bg-gray-100"
              >
                <span>{userRole === 'admin' ? '👑 Admin' : '👤 Empleado'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20">
                  {userRoles.map(role => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      {role === 'admin' ? '👑 Admin' : '👤 Empleado'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-lg">{userRole === 'admin' ? '👑 Admin' : '👤 Empleado'}</span>
          )}

          {/* Notificaciones */}
          <button className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
          </button>

          {/* Avatar de Usuario */}
          <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">👤</span>
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [employeeId, setEmployeeId] = useState(null);
  const [token, setToken] = useState(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [email, setEmail] = useState('');
  const [employeeForm, setEmployeeForm] = useState({ first_name: '', last_name: '', email: '', hire_date: '', department_id: '', role_id: '' });
  const [departmentForm, setDepartmentForm] = useState({ name: '' });
  const [roleForm, setRoleForm] = useState({ title: '', salary: '' });
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [editDepartmentId, setEditDepartmentId] = useState(null);
  const [editRoleId, setEditRoleId] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState('first_name');
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showInactive, setShowInactive] = useState(false);
  const [filters, setFilters] = useState({
    department_id: '',
    hire_date_start: '',
    hire_date_end: '',
    salary_min: '',
    salary_max: '',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [recognitionPage, setRecognitionPage] = useState(1);

  const showNotification = useCallback((message, type) => {
    const messageString = typeof message === 'string' ? message : (message.message || JSON.stringify(message));
    setNotification({ message: messageString, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setIsAuthenticated(false);
        navigate('/');
        setIsInitialLoad(false);
        return;
      }

      try {
        const response = await fetchWithToken('http://localhost:3001/auth/verify', {}, navigate);
        if (!response.ok) {
          throw new Error('Token inválido o expirado');
        }
        await response.json();
        const decodedToken = JSON.parse(atob(savedToken.split('.')[1]));
        setIsAuthenticated(true);
        setToken(savedToken);
        const role = localStorage.getItem('userRole') || decodedToken.roles[0] || 'employee';
        setUserRole(role);
        setUserRoles(JSON.parse(localStorage.getItem('userRoles')) || decodedToken.roles || ['employee']);
        setEmployeeId(decodedToken.employee_id || localStorage.getItem('employeeId'));
        setEmail(localStorage.getItem('rememberedEmail') || '');
        setForcePasswordChange(false);
        setActiveTab(role === 'employee' ? 'employee-profile' : 'dashboard');
        setSelectedEmployeeId(role === 'employee' ? decodedToken.employee_id : null);
      } catch (error) {
        console.error('Token verification failed:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('employeeId');
        setIsAuthenticated(false);
        setToken(null);
        setUserRole(null);
        setUserRoles([]);
        setEmployeeId(null);
        setForcePasswordChange(false);
        navigate('/');
      } finally {
        setIsInitialLoad(false);
      }
    };

    verifyToken();
  }, [navigate]);

  const { departments, fetchDepartments, filteredDepartments, error: deptError } = useDepartments(token, showNotification, isAuthenticated, userRole);
  const { roles, fetchRoles, filteredRoles, error: rolesError } = useRoles(token, showNotification, isAuthenticated, userRole);
  const { employees, fetchEmployees, filteredEmployees, error: empError } = useEmployees(token, showInactive, filters, departments, showNotification, isAuthenticated, userRole);
  const { dashboardData, chartData, error: dashError, fetchDashboardData } = useDashboard(token, showNotification, isAuthenticated, userRole);
  const { salaryReport, exportToCSV, error: reportError } = useReports(token, showNotification, isAuthenticated, userRole);
  const { recognitions, totalPages, fetchRecognitions, error: recError } = useRecognitions(token, showNotification, isAuthenticated, userRole);

  useEffect(() => {
    if (activeTab === 'recognitions' && isAuthenticated) {
      fetchRecognitions(recognitionPage);
    }
  }, [recognitionPage, fetchRecognitions, activeTab, isAuthenticated]);

  const resetFilters = () => {
    setFilters({
      department_id: '',
      hire_date_start: '',
      hire_date_end: '',
      salary_min: '',
      salary_max: '',
    });
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const employeeData = {
        first_name: employeeForm.first_name,
        last_name: employeeForm.last_name,
        email: employeeForm.email,
        hire_date: employeeForm.hire_date,
        department_id: parseInt(employeeForm.department_id) || null,
        role_id: parseInt(employeeForm.role_id) || null,
      };

      let url = 'http://localhost:3001/employees';
      let method = 'POST';
      let successMessage = 'Empleado añadido con éxito';

      if (editEmployeeId) {
        url = `http://localhost:3001/employees/${editEmployeeId}`;
        method = 'PUT';
        successMessage = 'Empleado actualizado con éxito';
      }

      const response = await fetchWithToken(url, {
        method: method,
        body: JSON.stringify(employeeData),
      }, navigate);

      const data = await response.json();

      fetchEmployees();
      setEmployeeForm({ first_name: '', last_name: '', email: '', hire_date: '', department_id: '', role_id: '' });
      setEditEmployeeId(null);
      if (method === 'POST' && data.tempPassword) {
        showNotification(
          `${successMessage}. Contraseña temporal: ${data.tempPassword} (enviada por correo a ${employeeData.email})`,
          'success'
        );
      } else {
        showNotification(successMessage, 'success');
      }
    } catch (error) {
      console.error('Error submitting employee:', error.message);
      showNotification(`Error al guardar el empleado: ${error.message}`, 'error');
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editDepartmentId ? `http://localhost:3001/departments/${editDepartmentId}` : 'http://localhost:3001/departments';
      const method = editDepartmentId ? 'PUT' : 'POST';
      const response = await fetchWithToken(url, {
        method,
        body: JSON.stringify(departmentForm),
      });
      if (!response.ok) throw new Error('Error en la solicitud');
      await fetchDepartments(token);
      setDepartmentForm({ name: '' });
      setEditDepartmentId(null);
      showNotification(editDepartmentId ? 'Departamento actualizado con éxito' : 'Departamento añadido con éxito', 'success');
    } catch (error) {
      console.error('Error submitting department:', error);
      showNotification('Error al guardar el departamento', 'error');
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editRoleId ? `http://localhost:3001/roles/${editRoleId}` : 'http://localhost:3001/roles';
      const method = editRoleId ? 'PUT' : 'POST';
      const response = await fetchWithToken(url, {
        method,
        body: JSON.stringify(roleForm),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      await fetchRoles(token);
      setRoleForm({ title: '', salary: '' });
      setEditRoleId(null);
      showNotification(editRoleId ? 'Cargo actualizado con éxito' : 'Cargo añadido con éxito', 'success');
    } catch (error) {
      console.error('Error submitting role:', error);
      showNotification('Error al guardar el cargo', 'error');
    }
  };

  const handleDelete = async (type, id) => {
    try {
      const response = await fetchWithToken(`http://localhost:3001/${type}/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error en la solicitud';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      if (type === 'employees') {
        await fetchEmployees(token);
        if (editEmployeeId === id) {
          setEmployeeForm({ first_name: '', last_name: '', email: '', hire_date: '', department_id: '', role_id: '' });
          setEditEmployeeId(null);
        }
        if (userRole === 'admin') {
          await fetchDashboardData();
        }
      }
      if (type === 'departments') await fetchDepartments(token);
      if (type === 'roles') await fetchRoles(token);
      showNotification(
        `${type === 'employees' ? 'Empleado' : type === 'departments' ? 'Departamento' : 'Cargo'} eliminado con éxito`,
        'success'
      );
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showNotification(
        `Error al eliminar el ${type === 'employees' ? 'empleado' : type === 'departments' ? 'departamento' : 'cargo'}: ${error.message}`,
        'error'
      );
    }
  };

  const handleEdit = (type, item) => {
    if (type === 'employees') {
      const hireDate = new Date(item.hire_date);
      hireDate.setUTCDate(hireDate.getUTCDate() + 1);
      const year = hireDate.getUTCFullYear();
      const month = String(hireDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(hireDate.getUTCDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      setEmployeeForm({
        ...item,
        department_id: item.department_id?.toString() || '',
        role_id: item.role_id?.toString() || '',
        hire_date: formattedDate,
      });
      setEditEmployeeId(item.id);
      showNotification('Editando empleado', 'info');
    } else if (type === 'departments') {
      setDepartmentForm(item);
      setEditDepartmentId(item.id);
      showNotification('Editando departamento', 'info');
    } else if (type === 'roles') {
      setRoleForm({ title: item.title, salary: item.salary.toString() });
      setEditRoleId(item.id);
      showNotification('Editando cargo', 'info');
    }
  };

  const handleRestore = async (id) => {
    try {
      const response = await fetchWithToken(`http://localhost:3001/employees/${id}/restore`, { method: 'PUT' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al restaurar el empleado');
      }
      await fetchEmployees(token);
      if (userRole === 'admin') {
        await fetchDashboardData();
      }
      showNotification('Empleado restaurado con éxito', 'success');
    } catch (error) {
      console.error('Error restoring employee:', error);
      showNotification(`Error al restaurar: ${error.message}`, 'error');
    }
  };

  const fetchEmployeeProfile = (id) => {
    if (userRole === 'employee' && id !== employeeId) {
      showNotification('Solo puedes ver tu propio perfil', 'error');
      return;
    }
    setSelectedEmployeeId(id);
    setActiveTab('employee-profile');
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) setEmail(rememberedEmail);
  }, []);

  useEffect(() => {
    if (activeTab !== 'employees') {
      setShowAdvancedFilters(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'employees') {
      resetFilters();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'recognitions' && isAuthenticated) {
      fetchRecognitions(recognitionPage);
    }
  }, [activeTab, recognitionPage, fetchRecognitions, token, isAuthenticated]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && showHistoryModal) {
        setShowHistoryModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showHistoryModal]);

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500 text-lg">Cargando...</p>
      </div>
    );
  }

  if (forcePasswordChange) {
    return (
      <ChangePassword
        user={{ token, id: employeeId, email }}
        setUser={(updatedUser) => {
          setForcePasswordChange(updatedUser.force_password_change);
          setToken(updatedUser.token || token);
          if (updatedUser.token) {
            localStorage.setItem('token', updatedUser.token);
            const newDecodedToken = JSON.parse(atob(updatedUser.token.split('.')[1]));
            setEmployeeId(newDecodedToken.employee_id);
            setUserRole(newDecodedToken.roles[0] || 'employee');
            setUserRoles(newDecodedToken.roles || ['employee']);
            localStorage.setItem('employeeId', newDecodedToken.employee_id);
            localStorage.setItem('userRole', newDecodedToken.roles[0] || 'employee');
            localStorage.setItem('userRoles', JSON.stringify(newDecodedToken.roles || ['employee']));
          }
          if (!updatedUser.force_password_change) {
            setIsAuthenticated(true);
            setActiveTab((userRole || 'employee') === 'employee' ? 'employee-profile' : 'dashboard');
          }
        }}
        setNotification={showNotification}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Login
        setIsAuthenticated={setIsAuthenticated}
        setUserRole={setUserRole}
        setUserRoles={setUserRoles}
        setEmployeeId={setEmployeeId}
        setEmail={setEmail}
        setToken={setToken}
        setForcePasswordChange={setForcePasswordChange}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Header
        userRole={userRole}
        userRoles={userRoles}
        setUserRole={setUserRole}
        onLogout={() => {
          setIsAuthenticated(false);
          setToken(null);
          setUserRole(null);
          setUserRoles([]);
          setEmployeeId(null);
          setForcePasswordChange(false);
        }}
      />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      <div className="flex-1 pt-16 px-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'change-password' && (
            <ChangePassword
              user={{ token, id: employeeId, email }}
              setUser={(updatedUser) => {
                setForcePasswordChange(updatedUser.force_password_change);
                setToken(updatedUser.token || token);
                if (updatedUser.token) {
                  localStorage.setItem('token', updatedUser.token);
                  const newDecodedToken = JSON.parse(atob(updatedUser.token.split('.')[1]));
                  setEmployeeId(newDecodedToken.employee_id);
                  setUserRole(newDecodedToken.roles[0] || 'employee');
                  setUserRoles(newDecodedToken.roles || ['employee']);
                  localStorage.setItem('employeeId', newDecodedToken.employee_id);
                  localStorage.setItem('userRole', newDecodedToken.roles[0] || 'employee');
                  localStorage.setItem('userRoles', JSON.stringify(newDecodedToken.roles || ['employee']));
                }
                if (!updatedUser.force_password_change) {
                  setIsAuthenticated(true);
                  setActiveTab((userRole || 'employee') === 'employee' ? 'employee-profile' : 'dashboard');
                }
              }}
              setNotification={showNotification}
            />
          )}
          {activeTab === 'employees' && userRole === 'admin' && (
            <EmployeeTable
              employeeForm={employeeForm}
              setEmployeeForm={setEmployeeForm}
              departments={departments}
              roles={roles}
              editEmployeeId={editEmployeeId}
              setEditEmployeeId={setEditEmployeeId}
              showInactive={showInactive}
              setShowInactive={setShowInactive}
              showAdvancedFilters={showAdvancedFilters}
              setShowAdvancedFilters={setShowAdvancedFilters}
              filters={filters}
              setFilters={setFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              searchCriteria={searchCriteria}
              setSearchCriteria={setSearchCriteria}
              filteredEmployees={filteredEmployees(searchTerm, searchCriteria)}
              handleEmployeeSubmit={handleEmployeeSubmit}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              fetchEmployeeHistory={(id) => {
                setCurrentEmployeeId(id);
                setShowHistoryModal(true);
              }}
              handleRestore={handleRestore}
              resetFilters={resetFilters}
              fetchEmployeeProfile={fetchEmployeeProfile}
              userRole={userRole}
              error={empError}
            />
          )}
          {activeTab === 'departments' && userRole === 'admin' && (
            <DepartmentTable
              departmentForm={departmentForm}
              setDepartmentForm={setDepartmentForm}
              editDepartmentId={editDepartmentId}
              setEditDepartmentId={setEditDepartmentId}
              departmentSearchTerm={departmentSearchTerm}
              setDepartmentSearchTerm={setDepartmentSearchTerm}
              filteredDepartments={filteredDepartments(departmentSearchTerm)}
              handleDepartmentSubmit={handleDepartmentSubmit}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              error={deptError}
            />
          )}
          {activeTab === 'roles' && userRole === 'admin' && (
            <RoleTable
              roleForm={roleForm}
              setRoleForm={setRoleForm}
              editRoleId={editRoleId}
              setEditRoleId={setEditRoleId}
              roleSearchTerm={roleSearchTerm}
              setRoleSearchTerm={setRoleSearchTerm}
              filteredRoles={filteredRoles(roleSearchTerm)}
              handleRoleSubmit={handleRoleSubmit}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              error={rolesError}
            />
          )}
          {activeTab === 'dashboard' && userRole === 'admin' && (
            <Dashboard
              dashboardData={dashboardData}
              chartData={chartData}
              error={dashError}
            />
          )}
          {activeTab === 'reports' && userRole === 'admin' && (
            <Reports
              salaryReport={salaryReport}
              exportToCSV={exportToCSV}
              error={reportError}
            />
          )}
          {activeTab === 'recognitions' && (
            <RecognitionPanel
              employees={employees}
              setNotification={showNotification}
              fetchRecognitions={() => fetchRecognitions(recognitionPage)}
              currentPage={recognitionPage}
              setCurrentPage={setRecognitionPage}
              recognitions={recognitions}
              totalPages={totalPages}
              userRole={userRole}
              error={recError}
            />
          )}
          {activeTab === 'employee-profile' && (
            <EmployeeProfile
              employeeId={selectedEmployeeId || (userRole === 'employee' ? employeeId : null)}
              setNotification={showNotification}
              departments={departments}
              roles={roles}
              setSelectedEmployeeId={setSelectedEmployeeId}
              userRole={userRole}
              isAuthenticated={isAuthenticated}
            />
          )}
          <HistoryModal
            employees={employees}
            currentEmployeeId={currentEmployeeId}
            showHistoryModal={showHistoryModal}
            setShowHistoryModal={setShowHistoryModal}
          />
        </div>
      </div>
      {notification.message && (
        <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'info' ? 'bg-blue-500' : 'bg-red-500'} text-white animate-slide-in`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

const AppWrapper = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
);

export default AppWrapper;