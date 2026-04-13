import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrimeReactProvider } from 'primereact/api';

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import 'primereact/resources/primereact.css';

import './assets/demo/flags/flags.css';
import './assets/demo/Demos.scss';
import './assets/layout/layout.scss';
import './GlobalOverrides.css';


import Menu from './pages/Menu';
import Login from './pages/Login';
import Register from './pages/Register';
import Usuario from './pages/Usuario';
import Permisos from './pages/Permisos';
import Perfil from './pages/Perfil';
import Dashboard from './pages/Dashboard';
import Temas from './pages/Temas';

function App() {
  return (
    <PrimeReactProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route exact path="/" element={<Menu />} >
              <Route exact path="/usuario" element={<Usuario />} />
              <Route exact path="/permisos" element={<Permisos />} />
              <Route exact path="/perfil" element={<Perfil />} />
              <Route exact path="/dashboard" element={<Dashboard />} />
              <Route exact path="/temas" element={<Temas />} />
            </Route>
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/register" element={<Register />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </PrimeReactProvider>
  );
}

export default App;

