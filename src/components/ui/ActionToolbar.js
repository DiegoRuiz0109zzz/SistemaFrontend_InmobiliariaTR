import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import './SharedUI.css';

/**
 * ActionToolbar - Barra de acciones superior (Nuevo, Buscar, Exportar)
 */
const ActionToolbar = ({
    onNew,
    newLabel,
    onSearch,
    searchValue,
    searchPlaceholder = "Buscar...",
    extraActions
}) => {
    return (
        <div className="action-toolbar">
            {onNew && (
                <Button
                    label={newLabel}
                    icon="pi pi-plus"
                    className="btn-primary-custom"
                    onClick={onNew}
                />
            )}

            <div className="toolbar-actions flex align-items-center gap-2">
                {onSearch && (
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" style={{ color: 'var(--text-secondary)' }} />
                        <InputText
                            type="search"
                            value={searchValue || ''}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="search-input"
                            style={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-primary)' }}
                        />
                    </span>
                )}
                {extraActions}
            </div>
        </div>
    );
};

export default ActionToolbar;
