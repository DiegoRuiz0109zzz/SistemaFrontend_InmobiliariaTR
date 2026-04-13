import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import classNames from 'classnames';
import PrimeReact from 'primereact/api';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';

import { AppFooter } from '../AppFooter';
import { AppTopbar } from '../AppTopbar';
import { AppMenu } from '../AppMenu';

// import { useValidator } from '../config/useValidator';

const Menu = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const perfilBase = [
        {
            label: 'Home',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: 'dashboard' },
                { label: 'Mi Perfil', icon: 'pi pi-fw pi-user', to: 'perfil' }
            ]
        },
    ];

    function Acceder() {
        const perms = user?.permissions || [];
        //console.log('Menu - User:', user);
        //console.log('Menu - Perms:', perms);
        const menu = [...perfilBase];

        const usuariosItems = [];
        if (perms.includes('GESTION_USUARIOS')) {
            usuariosItems.push({ label: 'Gestión de Usuarios', icon: 'pi pi-fw pi-users', to: 'usuario' });
        }
        if (perms.includes('GESTION_ROLES')) {
            usuariosItems.push({ label: 'Gestión de Permisos', icon: 'pi pi-fw pi-lock', to: 'permisos' });
        }

        if (usuariosItems.length > 0) {
            menu.push({
                label: 'Usuarios del Sistema',
                items: usuariosItems
            });
        }

        // Opción de Temas solo para SUPER_ADMINISTRADOR
        if (user?.role === 'SUPER_ADMINISTRADOR') {
            menu.push({
                label: 'Configuración',
                items: [
                    { label: 'Temas', icon: 'pi pi-fw pi-palette', to: 'temas' }
                ]
            });
        }

        return menu;
    }

    let menuClick = false;
    let mobileTopbarMenuClick = false;
    PrimeReact.ripple = true;
    const toast = useRef(null);

    // const footerRef = useRef(null);
    // const isValid = useValidator(footerRef);
    const menu = Acceder();

    const stylespj = {
        body: {
            height: '100%',
            width: '100%',
            backgroundColor: 'var(--bg-page)',
            backgroundImage: 'none',
        }
    }

    const [layoutMode] = useState('static');
    const [layoutColorMode] = useState('light');
    const [inputStyle] = useState('outlined');
    const [ripple] = useState(true);
    const [staticMenuInactive, setStaticMenuInactive] = useState(false);
    const [overlayMenuActive, setOverlayMenuActive] = useState(false);
    const [mobileMenuActive, setMobileMenuActive] = useState(false);
    const [mobileTopbarMenuActive, setMobileTopbarMenuActive] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
        document.documentElement.style.fontSize = 12 + 'px';
    }, [user, loading, navigate]);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!user) {
        return null;
    }

    const onWrapperClick = (event) => {
        if (!menuClick) {
            setOverlayMenuActive(false);
            setMobileMenuActive(false);
        }

        if (!mobileTopbarMenuClick) {
            setMobileTopbarMenuActive(false);
        }

        mobileTopbarMenuClick = false;
        menuClick = false;
    }

    const onSidebarClick = () => {
        menuClick = true;
    }

    const isDesktop = () => {
        return window.innerWidth >= 992;
    }

    const onMenuItemClick = (event) => {
        if (!event.item.items) {
            setOverlayMenuActive(false);
            setMobileMenuActive(false);
        }
    }

    const onMobileTopbarMenuClick = (event) => {
        mobileTopbarMenuClick = true;
        setMobileTopbarMenuActive((prevState) => !prevState);
        event.preventDefault();
    }

    const onMobileSubTopbarMenuClick = (event) => {
        mobileTopbarMenuClick = true;
        event.preventDefault();
    }

    const onToggleMenuClick = (event) => {
        menuClick = true;

        if (isDesktop()) {
            if (layoutMode === 'overlay') {
                if (mobileMenuActive === true) {
                    setOverlayMenuActive(true);
                }

                setOverlayMenuActive((prevState) => !prevState);
                setMobileMenuActive(false);
            }
            else if (layoutMode === 'static') {
                setStaticMenuInactive((prevState) => !prevState);
            }
        }
        else {
            setMobileMenuActive((prevState) => !prevState);
        }
        event.preventDefault();
    }

    const wrapperClass = classNames('layout-wrapper', {
        'layout-overlay': layoutMode === 'overlay',
        'layout-static': layoutMode === 'static',
        'layout-static-sidebar-inactive': staticMenuInactive && layoutMode === 'static',
        'layout-overlay-sidebar-active': overlayMenuActive && layoutMode === 'overlay',
        'layout-mobile-sidebar-active': mobileMenuActive,
        'p-input-filled': inputStyle === 'filled',
        'p-ripple-disabled': ripple === false,
        'layout-theme-light': layoutColorMode === 'light'
    });

    return (
        <div className={wrapperClass} onClick={onWrapperClick} style={stylespj.body} >
            <Toast ref={toast} />
            <Tooltip target=".block-action-copy" position="bottom" content="Copied to clipboard" event="focus" />
            <AppTopbar onToggleMenuClick={onToggleMenuClick} layoutColorMode={layoutColorMode}
                mobileTopbarMenuActive={mobileTopbarMenuActive} onMobileTopbarMenuClick={onMobileTopbarMenuClick} onMobileSubTopbarMenuClick={onMobileSubTopbarMenuClick} />
            <div className="layout-sidebar" onClick={onSidebarClick} >
                {/* {isValid && <AppMenu model={menu} onMenuItemClick={onMenuItemClick} layoutColorMode={layoutColorMode} userRole={user.role} />} */}
                <AppMenu model={menu} onMenuItemClick={onMenuItemClick} layoutColorMode={layoutColorMode} userRole={user.role} />
            </div>
            <div className="layout-main-container">
                <div className="container">
                    {/* {isValid && <Outlet />} */}
                    <Outlet />
                </div>
                {/* {isValid && <AppFooter ref={footerRef} />} */}
                <AppFooter />
            </div>
        </div>
    );
}

export default Menu;
