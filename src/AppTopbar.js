import React, { useMemo, useRef } from 'react';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './AppTopbar.css';
import { SystemConfig } from './config/SystemConfig';
import { useTheme } from './context/ThemeContext';

export const AppTopbar = (props) => {
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();

    // Obtener nombre de usuario del contexto
    const userName = user?.username || 'Usuario';

    // Generar iniciales del nombre
    const initials = useMemo(() => {
        return userName
            .substring(0, 2)
            .toUpperCase();
    }, [userName]);

    // Items del menú desplegable
    const menuItems = useMemo(() => [
        {
            label: 'Ver perfil',
            icon: 'pi pi-user',
            command: () => navigate('/perfil'),
        },
        {
            separator: true
        },
        {
            label: darkMode ? 'Modo Claro' : 'Modo Oscuro',
            icon: darkMode ? 'pi pi-sun' : 'pi pi-moon',
            command: toggleDarkMode,
        },
        {
            separator: true
        },
        {
            label: 'Cerrar sesión',
            icon: 'pi pi-sign-out',
            command: () => {
                logout();
                navigate('/login');
            },
        },
    ], [navigate, logout, darkMode, toggleDarkMode]);

    const toggleMenu = (event) => {
        if (menuRef.current) {
            menuRef.current.toggle(event);
        }
    };

    return (
        <header className="app-topbar">
            <div className="topbar-left">
                <Button
                    type="button"
                    icon="pi pi-bars"
                    className="p-button-text p-button-rounded mr-2"
                    style={{ color: 'var(--topbar-text)' }}
                    onClick={props.onToggleMenuClick}
                />
                <div className="logo-container">
                    <img src={SystemConfig.logoPath} alt="Logo" className="topbar-brand-logo" />
                </div>
                <span className="logo-text" style={{ color: 'var(--topbar-text)' }}>{SystemConfig.appName}</span>
            </div>
            <div className="topbar-right">
                <div className="user-info">
                    <span className="welcome-text" style={{ color: 'var(--topbar-text)', opacity: 0.8 }}>Bienvenido,</span>
                    <div className="user-name" style={{ color: 'var(--topbar-text)' }}>{userName}</div>
                </div>
                <Avatar
                    image={user?.profileImage ? (user.profileImage.startsWith('/') ? `http://localhost:8080${user.profileImage}` : user.profileImage) : null}
                    label={!user?.profileImage ? (initials || '?') : null}
                    shape="circle"
                    className="user-avatar"
                    aria-label="Avatar del usuario"
                />
                <Button
                    type="button"
                    className="p-button-text p-button-rounded menu-toggle"
                    icon="pi pi-angle-down"
                    style={{ color: 'var(--topbar-text)' }}
                    onClick={toggleMenu}
                    aria-label="Abrir menú de usuario"
                />
                <Menu
                    model={menuItems}
                    popup
                    ref={menuRef}
                />
            </div>
        </header>
    );
};

