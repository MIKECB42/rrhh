import React, { useState, useEffect } from 'react';
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
import fetchWithToken from './api/client';
import { useEmployees } from './hooks/useEmployees';
import { useDepartments } from './hooks/useDepartments';
import { useRoles } from './hooks/useRoles';
import { useDashboard } from './hooks/useDashboard';
import { useReports } from './hooks/useReports';
import { useRecognitions } from './hooks/useRecognitions';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Componente ErrorBoundary
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
      return <h1>Algo salió mal. Por favor, recarga la página.</h1>;
    }
    return this.props.children;
  }
}

// Componente para el header con rol y cerrar sesión
const Header = ({ userRole, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Limpia el token
    localStorage.removeItem('userRole'); // Limpia el rol
    localStorage.removeItem('employeeId'); // Limpia el ID del empleado
    onLogout();
    navigate('/');
  };

  return (
    <div className="header">
      {userRole === 'admin' && <span className="role-icon">👑 Admin</span>}
      {userRole === 'empleado' && <span className="role-icon">👤 Empleado</span>}
      <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  // Restaurar estado desde localStorage al montar
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token; // Si hay token, considera que está autenticado
  });
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  const [employeeId, setEmployeeId] = useState(() => localStorage.getItem('employeeId') || null);
  const [email, setEmail] = useState(''); // Mantengo email por compatibilidad con Login
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

  const { departments, fetchDepartments, filteredDepartments } = useDepartments();
  const { roles, fetchRoles, filteredRoles } = useRoles();
  const { employees, fetchEmployees, filteredEmployees } = useEmployees(showInactive, filters, departments);
  const { dashboardData, chartData } = useDashboard();
  const { salaryReport, exportToCSV } = useReports();
  const { recognitions, totalPages, currentPage, fetchRecognitions } = useRecognitions(setNotification);

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
      await fetchEmployees();
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
      await fetchDepartments();
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
      await fetchRoles();
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
        await fetchEmployees();
        if (editEmployeeId === id) {
          setEmployeeForm({ first_name: '', last_name: '', email: '', hire_date: '', department_id: '', role_id: '' });
          setEditEmployeeId(null);
        }
      }
      if (type === 'departments') await fetchDepartments();
      if (type === 'roles') await fetchRoles();
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
      await fetchEmployees();
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
      fetchRecognitions(currentPage);
    }
  }, [activeTab, currentPage, fetchRecognitions]);

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

  // Redirección al perfil si es empleado
  useEffect(() => {
    if (isAuthenticated && userRole === 'empleado') {
      navigate('/profile');
    }
  }, [isAuthenticated, userRole, navigate]);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('token', 'dummy-token'); // Reemplaza con el token real del backend
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('employeeId', employeeId);
    }
  }, [isAuthenticated, userRole, employeeId]);

  if (!isAuthenticated) {
    return (
      <Login
        setIsAuthenticated={setIsAuthenticated}
        setUserRole={setUserRole}
        setEmployeeId={setEmployeeId}
        setEmail={setEmail}
      />
    );
  }

  return (
    <div className="App">
      <Header userRole={userRole} onLogout={() => setIsAuthenticated(false)} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="content">
        {activeTab === 'employees' && (
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
          />
        )}
        {activeTab === 'departments' && (
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
          />
        )}
        {activeTab === 'roles' && (
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
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard
            dashboardData={dashboardData}
            chartData={chartData}
          />
        )}
        {activeTab === 'reports' && (
          <Reports
            salaryReport={salaryReport}
            exportToCSV={exportToCSV}
          />
        )}
        {activeTab === 'recognitions' && (
          <RecognitionPanel
            employees={employees}
            setNotification={setNotification}
            fetchRecognitions={fetchRecognitions}
            currentPage={currentPage}
            recognitions={recognitions}
            totalPages={totalPages}
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
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

// Envolver App con BrowserRouter y ErrorBoundary
const AppWrapper = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
);

export default AppWrapper;