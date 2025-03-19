import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setIsAuthenticated, setUserRole, setUserRoles, setEmployeeId, setEmail, setToken, setForcePasswordChange }) => {
  const [email, setLocalEmail] = useState(''); // Estado local para el email
  const [password, setPassword] = useState(''); // Estado local para la contraseña
  const [error, setError] = useState(''); // Mensaje de error para el usuario
  const navigate = useNavigate();

  // Cargar email recordado al montar el componente
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberEmail = localStorage.getItem('rememberEmail') === 'true';
    if (rememberEmail && rememberedEmail) setLocalEmail(rememberedEmail);
  }, []);

  // Manejar el envío del formulario de login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // Login exitoso: usuario autenticado y sin necesidad de cambiar contraseña
        const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', decodedToken.roles[0] || 'employee');
        localStorage.setItem('userRoles', JSON.stringify(decodedToken.roles));
        localStorage.setItem('employeeId', decodedToken.id || '');
        setIsAuthenticated(true); // Marcar como autenticado
        setUserRole(decodedToken.roles[0] || 'employee');
        setUserRoles(decodedToken.roles || ['employee']);
        setEmployeeId(decodedToken.id || null);
        setEmail(email);
        setToken(data.token);
        setForcePasswordChange(false);
        navigate(decodedToken.roles.includes('employee') ? '/profile' : '/dashboard');
      } else if (data.message === 'Debes cambiar tu contraseña') {
        // Caso 403: usuario debe cambiar su contraseña
        setForcePasswordChange(true); // Activar el estado para forzar cambio
        setEmployeeId(data.userId || null); // Guardar el ID del usuario
        setEmail(email); // Guardar el email para usarlo en ChangePassword
        navigate('/change-password'); // Redirigir a la pantalla de cambio de contraseña
      } else {
        // Otros errores (ej. 401): credenciales inválidas
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      // Error de red u otros problemas inesperados
      setError('Error de red');
    }
  };

  // Manejar el checkbox de "Recordar Email"
  const handleRememberEmailChange = (e) => {
    const checked = e.target.checked;
    localStorage.setItem('rememberEmail', checked);
    if (checked) localStorage.setItem('rememberedEmail', email);
    else localStorage.removeItem('rememberedEmail');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-primary mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setLocalEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            onChange={handleRememberEmailChange}
            defaultChecked={localStorage.getItem('rememberEmail') === 'true'}
            className="h-4 w-4 text-primary"
          />
          <span className="text-gray-700">Recordar Email</span>
        </label>
        <button
          type="button"
          className="text-primary mt-2 underline hover:text-secondary"
          onClick={() => alert('Funcionalidad no implementada aún')}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  );
};

export default Login;