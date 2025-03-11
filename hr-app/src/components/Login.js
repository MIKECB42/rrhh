import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

const Login = ({ setIsAuthenticated, setUserRole, setEmployeeId, setEmail }) => {
  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Inicializa el hook useNavigate

  // Restaurar email si el usuario eligió recordarlo
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberEmail = localStorage.getItem('rememberEmail') === 'true';
    if (rememberEmail && rememberedEmail) {
      setLocalEmail(rememberedEmail);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Guardar token y datos del usuario en localStorage
        localStorage.setItem('token', data.token); // Guarda el token
        localStorage.setItem('userRole', data.role || ''); // Guarda el rol
        localStorage.setItem('employeeId', data.employeeId || ''); // Guarda el ID del empleado (ajusta según la respuesta del backend)
        localStorage.setItem('rememberedEmail', email); // Guarda el email si el checkbox está marcado

        // Actualizar estados en App.js
        setIsAuthenticated(true);
        setUserRole(data.role || '');
        setEmployeeId(data.employeeId || null);
        setEmail(email);

        // Redirigir al dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error('Error de red:', err);
      setError('Error de red');
    }
  };

  const handleRememberEmailChange = (e) => {
    const checked = e.target.checked;
    localStorage.setItem('rememberEmail', checked);
    if (checked) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setLocalEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        <button type="submit">Iniciar Sesión</button>
      </form>
      {error && <p className="error">{error}</p>}
      <label>
        <input
          type="checkbox"
          onChange={handleRememberEmailChange}
          defaultChecked={localStorage.getItem('rememberEmail') === 'true'}
        /> Recordar Email
      </label>
      {/* Reemplazar <a href="#"> por <button> con estilos de enlace */}
      <button
        type="button"
        className="forgot-password-link"
        onClick={() => alert('Funcionalidad no implementada aún')}
      >
        ¿Olvidaste tu contraseña?
      </button>
    </div>
  );
};

export default Login;