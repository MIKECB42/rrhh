import React, { useState } from 'react';
import fetchWithToken from '../api/client';

const ChangePassword = ({ user, setUser, setNotification }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, oldPassword, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña');
      }

      // Guardar el token en localStorage para que los hooks lo usen
      localStorage.setItem('token', data.token);
      // Actualizar el estado del usuario con el nuevo token y force_password_change = false
      setUser({ token: data.token, force_password_change: false });
      setNotification({ message: 'Contraseña cambiada con éxito', type: 'success' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
      setNotification({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-primary mb-6">Cambiar Contraseña</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Contraseña Actual"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva Contraseña"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            Cambiar Contraseña
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default ChangePassword;