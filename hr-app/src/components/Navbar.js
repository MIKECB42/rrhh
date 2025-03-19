import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">HR App</h1>
        <div>
          <button className="bg-secondary hover:bg-opacity-80 text-white px-4 py-2 rounded">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;