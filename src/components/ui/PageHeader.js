import React from 'react';
import './SharedUI.css';

/**
 * PageHeader - Banner superior para las páginas del sistema
 * @param {string} title - Título principal
 * @param {string} description - Descripción o subtítulo
 * @param {string} icon - Clase de icono de PrimeIcons (pi pi-...)
 */
const PageHeader = ({ title, description, icon }) => {
    return (
        <div className="page-header">
            <div className="header-content">
                <div className="header-icon">
                    <i className={icon}></i>
                </div>
                <div>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
