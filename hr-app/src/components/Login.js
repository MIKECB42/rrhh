import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setIsAuthenticated, setUserRole, setUserRoles, setEmployeeId, setEmail, setToken, setForcePasswordChange }) => {
  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberEmail = localStorage.getItem('rememberEmail') === 'true';
    if (rememberEmail && rememberedEmail) setLocalEmail(rememberedEmail);
  }, []);

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
        const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', decodedToken.roles[0] || 'employee');
        localStorage.setItem('userRoles', JSON.stringify(decodedToken.roles));
        localStorage.setItem('employeeId', decodedToken.id || '');
        setIsAuthenticated(true);
        setUserRole(decodedToken.roles[0] || 'employee');
        setUserRoles(decodedToken.roles || ['employee']);
        setEmployeeId(decodedToken.id || null);
        setEmail(email);
        setToken(data.token);
        setForcePasswordChange(false);
        navigate(decodedToken.roles.includes('employee') ? '/profile' : '/dashboard');
      } else if (data.message === 'Debes cambiar tu contraseña') {
        setForcePasswordChange(true);
        setEmployeeId(data.userId || null);
        navigate('/change-password');
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de red');
    }
  };

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