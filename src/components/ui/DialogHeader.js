import React from 'react';
import './SharedUI.css';

/**
 * DialogHeader - Cabecera premium para diálogos PrimeReact
 * @param {string} title - Título del diálogo
 * @param {string} subtitle - Subtítulo descriptivo
 * @param {string} icon - Icono de PrimeIcons
 */
const DialogHeader = ({ title, subtitle, icon }) => {
    return (
        <div className="custom-dialog-header">
            <div className="dialog-title">
                <div className="dialog-icon">
                    <i className={`${icon} text-xl`}></i>
                </div>
                <div className="dialog-info">
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
            </div>
        </div>
    );
};

export default DialogHeader;
