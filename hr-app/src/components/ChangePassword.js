import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchWithToken from '../api/client'; // Cambiar de '../client' a '../api/client'

const ChangePassword = ({ user, setUser, setNotification }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/change-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${user.token}` // Usa el token del usuario autenticado
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await response.json();
      if (data.message === 'Contraseña actualizada con éxito') {
        setUser({ ...user, force_password_change: false }); // Actualizar estado
        setNotification({ message: 'Contraseña cambiada con éxito', type: 'success' });
        navigate('/dashboard'); // Redirige a la página principal
      } else {
        setNotification({ message: data.error || 'Error al cambiar la contraseña', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Error al cambiar la contraseña', type: 'error' });
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Cambiar Contraseña</h2>
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Contraseña Actual</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Contraseña Actual"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nueva Contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva Contraseña"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-primary text-white p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            Cambiar Contraseña
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;