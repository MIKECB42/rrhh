import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('employeeId');
    onLogout();
    navigate('/');
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setUserRole(newRole);
    localStorage.setItem('userRole', newRole);
    navigate(newRole === 'employee' ? '/profile' : '/dashboard');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-primary text-white p-4 shadow-md z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {userRoles && userRoles.length > 1 ? (
            <select
              value={userRole}
              onChange={handleRoleChange}
              className="bg-white text-primary p-2 rounded-lg"
            >
              {userRoles.map(role => (
                <option key={role} value={role}>
                  {role === 'admin' ? '👑 Admin' : '👤 Empleado'}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-lg">
              {userRole === 'admin' ? '👑 Admin' : '👤 Empleado'}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-secondary hover:bg-opacity-80 text-white px-4 py-2 rounded-lg"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Sincronizar estado con localStorage al montar el componente
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const decodedToken = JSON.parse(atob(savedToken.split('.')[1]));
        setIsAuthenticated(true);
        setToken(savedToken);
        setUserRole(localStorage.getItem('userRole') || decodedToken.roles[0] || 'employee');
        setUserRoles(JSON.parse(localStorage.getItem('userRoles')) || decodedToken.roles || ['employee']);
        setEmployeeId(localStorage.getItem('employeeId') || decodedToken.id || null);
        setEmail(localStorage.getItem('rememberedEmail') || '');
        setForcePasswordChange(false);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/');
      }
    }
    setIsInitialLoad(false);
  }, [navigate]);

  const { departments, fetchDepartments, filteredDepartments, error: deptError } = useDepartments(token, setNotification);
  const { roles, fetchRoles, filteredRoles, error: rolesError } = useRoles(token, setNotification);
  const { employees, fetchEmployees, filteredEmployees, error: empError } = useEmployees(token, showInactive, filters, departments, setNotification);
  const { dashboardData, chartData, error: dashError } = useDashboard(token, setNotification);
  const { salaryReport, exportToCSV, error: reportError } = useReports(token, setNotification);
  const { recognitions, totalPages, currentPage, fetchRecognitions, error: recError } = useRecognitions(token, setNotification);

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
      const url = editEmployeeId ? `http://localhost:3001/employees/${editEmployeeId}` : 'http://localhost:3001/employees';
      const method = editEmployeeId ? 'PUT' : 'POST';
      const response = await fetchWithToken(url, {
        method,
        body: JSON.stringify(employeeForm),
      });
      if (!response.ok) throw new Error('Error en la solicitud');
      await fetchEmployees(token);
      setEmployeeForm({ first_name: '', last_name: '', email: '', hire_date: '', department_id: '', role_id: '' });
      setEditEmployeeId(null);
      setNotification({
        message: editEmployeeId ? 'Empleado actualizado con éxito' : 'Empleado añadido con éxito',
        type: 'success',
      });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error submitting employee:', error);
      setNotification({ message: 'Error al guardar el empleado', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
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
      setNotification({
        message: editDepartmentId ? 'Departamento actualizado con éxito' : 'Departamento añadido con éxito',
        type: 'success',
      });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error submitting department:', error);
      setNotification({ message: 'Error al guardar el departamento', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
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
      setNotification({
        message: editRoleId ? 'Cargo actualizado con éxito' : 'Cargo añadido con éxito',
        type: 'success',
      });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error submitting role:', error);
      setNotification({ message: 'Error al guardar el cargo', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
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
      }
      if (type === 'departments') await fetchDepartments(token);
      if (type === 'roles') await fetchRoles(token);
      setNotification({
        message: `${type === 'employees' ? 'Empleado' : type === 'departments' ? 'Departamento' : 'Cargo'} eliminado con éxito`,
        type: 'success',
      });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setNotification({
        message: `Error al eliminar el ${type === 'employees' ? 'empleado' : type === 'departments' ? 'departamento' : 'cargo'}: ${error.message}`,
        type: 'error',
      });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
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
        department_id: item.department_id.toString(),
        role_id: item.role_id.toString(),
        hire_date: formattedDate,
      });
      setEditEmployeeId(item.id);
      setNotification({ message: 'Editando empleado', type: 'success' });
    } else if (type === 'departments') {
      setDepartmentForm(item);
      setEditDepartmentId(item.id);
      setNotification({ message: 'Editando departamento', type: 'success' });
    } else if (type === 'roles') {
      setRoleForm({ title: item.title, salary: item.salary.toString() });
      setEditRoleId(item.id);
      setNotification({ message: 'Editando cargo', type: 'success' });
    }
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const handleRestore = async (id) => {
    try {
      const response = await fetchWithToken(`http://localhost:3001/employees/${id}/restore`, { method: 'PUT' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al restaurar el empleado');
      }
      await fetchEmployees(token);
      setNotification({ message: 'Empleado restaurado con éxito', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error restoring employee:', error);
      setNotification({ message: `Error al restaurar: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const fetchEmployeeProfile = (id) => {
    if (userRole === 'employee' && id !== employeeId) {
      setNotification({ message: 'Solo puedes ver tu propio perfil', type: 'error' });
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
    if (activeTab === 'recognitions') {
      fetchRecognitions(token, currentPage);
    }
  }, [activeTab, currentPage, fetchRecognitions, token]);

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
    <div className="flex min-h-screen bg-gray-100">
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
      <div className="flex-1 ml-64 pt-16 p-6">
        {activeTab === 'change-password' && (
          <ChangePassword
            user={{ token, id: employeeId }}
            setUser={(updatedUser) => {
              setForcePasswordChange(updatedUser.force_password_change);
              setToken(updatedUser.token || token);
            }}
            setNotification={setNotification}
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
        {activeTab === 'reports' && (
          <Reports
            salaryReport={salaryReport}
            exportToCSV={exportToCSV}
            error={reportError}
          />
        )}
        {activeTab === 'recognitions' && (
          <RecognitionPanel
            employees={employees}
            setNotification={setNotification}
            fetchRecognitions={() => fetchRecognitions(token, currentPage)}
            currentPage={currentPage}
            recognitions={recognitions}
            totalPages={totalPages}
            userRole={userRole}
            error={recError}
          />
        )}
        {activeTab === 'employee-profile' && (
          <EmployeeProfile
            employeeId={selectedEmployeeId || (userRole === 'employee' ? employeeId : null)}
            setNotification={setNotification}
            departments={departments}
            roles={roles}
            setSelectedEmployeeId={setSelectedEmployeeId}
            userRole={userRole}
          />
        )}
        <HistoryModal
          employees={employees}
          currentEmployeeId={currentEmployeeId}
          showHistoryModal={showHistoryModal}
          setShowHistoryModal={setShowHistoryModal}
        />
      </div>
      {notification.message && (
        <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'info' ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
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