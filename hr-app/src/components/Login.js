import React, { useState } from 'react';

const Login = ({ setIsAuthenticated, setUserRole, setEmployeeId, setEmail }) => {
  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
        setIsAuthenticated(true);
        setUserRole(data.role);
        setEmployeeId(data.employee_id);
        setEmail(email); // Usar el email del estado local
        localStorage.setItem('rememberedEmail', email); // Recordar email
        localStorage.setItem('token', data.token); // Guardar el token
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de red');
      console.error('Error de red:', err); // Depuración
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
        <input type="checkbox" onChange={(e) => localStorage.setItem('rememberEmail', e.target.checked)} /> Recordar Email
      </label>
      <a href="#">¿Olvidaste tu contraseña?</a>
    </div>
  );
};

export default Login;