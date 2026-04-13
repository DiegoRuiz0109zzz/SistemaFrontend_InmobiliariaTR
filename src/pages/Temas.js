import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ColorPicker } from 'primereact/colorpicker';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/ui/PageHeader';
import DialogHeader from '../components/ui/DialogHeader';
import ActionToolbar from '../components/ui/ActionToolbar';
import './Temas.css';

const Temas = () => {
    const { axiosInstance } = useAuth();
    const { refreshTheme } = useTheme();
    const toast = useRef(null);

    // Estado de datos
    const [themes, setThemes] = useState([]);
    const [currentThemeKey, setCurrentThemeKey] = useState('base');

    // Estado del diálogo
    const [showDialog, setShowDialog] = useState(false);
    const [editingTheme, setEditingTheme] = useState(null);
    const [formTheme, setFormTheme] = useState({
        name: '',
        description: '',
        primaryColor: '#357ABD',
        backgroundColor: '#f4f7fa',
        topbarColor: '#357ABD',
        topbarTextColor: '#ffffff',
        cardBackground: '#ffffff',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        isDark: false
    });

    const loadData = useCallback(async () => {
        try {
            const [themesRes, currentRes] = await Promise.all([
                axiosInstance.get('/config/themes'),
                axiosInstance.get('/config/theme')
            ]);

            setThemes(themesRes.data);
            setCurrentThemeKey(currentRes.data.themeKey || 'base');
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los temas'
            });
        } finally {
        }
    }, [axiosInstance]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApplyTheme = async (theme) => {
        try {
            const response = await axiosInstance.put('/config/theme', { themeId: theme.themeKey });
            if (response.status === 200) {
                // Notificar al contexto para refrescar globalmente
                refreshTheme(theme);
                setCurrentThemeKey(theme.themeKey);
                toast.current.show({
                    severity: 'success',
                    summary: 'Tema Aplicado',
                    detail: `El tema "${theme.name}" ahora es el institucional`
                });
            }
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo aplicar el tema'
            });
        } finally {
        }
    };

    const openNew = () => {
        setEditingTheme(null);
        setFormTheme({
            name: '',
            description: '',
            primaryColor: '3B82F6', // ColorPicker usa hex sin # opcionalmente, lo manejaremos
            backgroundColor: 'f8f9fa',
            topbarColor: '1e3a8a',
            topbarTextColor: 'ffffff',
            cardBackground: 'ffffff',
            textPrimary: '1f2937',
            textSecondary: '4b5563',
            isDark: false
        });
        setShowDialog(true);
    };

    const openEdit = (theme) => {
        setEditingTheme(theme);
        setFormTheme({
            ...theme,
            // Limpiar # para ColorPicker si están presentes
            primaryColor: theme.primaryColor?.replace('#', ''),
            backgroundColor: theme.backgroundColor?.replace('#', ''),
            topbarColor: theme.topbarColor?.replace('#', ''),
            topbarTextColor: theme.topbarTextColor?.replace('#', ''),
            cardBackground: theme.cardBackground?.replace('#', ''),
            textPrimary: theme.textPrimary?.replace('#', ''),
            textSecondary: theme.textSecondary?.replace('#', '')
        });
        setShowDialog(true);
    };

    const saveTheme = async () => {
        // Validación básica
        if (!formTheme.name.trim()) {
            toast.current.show({
                severity: 'warn',
                summary: 'Campo Requerido',
                detail: 'El nombre del tema es obligatorio'
            });
            return;
        }

        try {
            // Generar themeKey si es nuevo
            const themeKey = editingTheme ? formTheme.themeKey : formTheme.name.toLowerCase().trim().replace(/\s+/g, '_');

            const themeToSave = {
                ...formTheme,
                id: editingTheme?.id,
                themeKey: themeKey,
                // Asegurar # y valores por defecto si están vacíos
                primaryColor: formTheme.primaryColor ? (formTheme.primaryColor.startsWith('#') ? formTheme.primaryColor : `#${formTheme.primaryColor}`) : '#3B82F6',
                backgroundColor: formTheme.backgroundColor ? (formTheme.backgroundColor.startsWith('#') ? formTheme.backgroundColor : `#${formTheme.backgroundColor}`) : '#f8f9fa',
                topbarColor: formTheme.topbarColor ? (formTheme.topbarColor.startsWith('#') ? formTheme.topbarColor : `#${formTheme.topbarColor}`) : '#1e3a8a',
                topbarTextColor: formTheme.topbarTextColor ? (formTheme.topbarTextColor.startsWith('#') ? formTheme.topbarTextColor : `#${formTheme.topbarTextColor}`) : '#ffffff',
                cardBackground: formTheme.cardBackground ? (formTheme.cardBackground.startsWith('#') ? formTheme.cardBackground : `#${formTheme.cardBackground}`) : '#ffffff',
                textPrimary: formTheme.textPrimary ? (formTheme.textPrimary.startsWith('#') ? formTheme.textPrimary : `#${formTheme.textPrimary}`) : '#1f2937',
                textSecondary: formTheme.textSecondary ? (formTheme.textSecondary.startsWith('#') ? formTheme.textSecondary : `#${formTheme.textSecondary}`) : '#4b5563',
            };

            await axiosInstance.post('/config/themes', themeToSave);

            // Si editamos el tema actual, reaplicar variables inmediatamente
            if (currentThemeKey === themeToSave.themeKey) {
                refreshTheme(themeToSave);
            }

            setShowDialog(false);
            loadData();
            toast.current.show({
                severity: 'success',
                summary: 'Éxito',
                detail: editingTheme ? 'Tema actualizado' : 'Tema creado exitosamente'
            });
        } catch (error) {
            console.error('Error al guardar tema:', error);
            const msg = error.response?.data?.message || error.response?.data || 'No se pudo guardar el tema';
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: msg
            });
        }
    };

    const confirmDelete = (theme) => {
        confirmDialog({
            message: `¿Estás seguro de que quieres eliminar el tema "${theme.name}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            className: 'custom-confirm-dialog',
            accept: () => deleteTheme(theme.id)
        });
    };

    const deleteTheme = async (id) => {
        try {
            await axiosInstance.delete(`/config/themes/${id}`);
            loadData();
            toast.current.show({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'El tema ha sido borrado'
            });
        } catch (error) {
            const msg = error.response?.data?.error || 'No se pudo eliminar el tema';
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: msg
            });
        }
    };

    const renderColorPreview = (theme) => (
        <div className="color-preview">
            <div className="color-swatch" style={{ backgroundColor: theme.primaryColor }} title="Primario"></div>
            <div className="color-swatch" style={{ backgroundColor: theme.topbarColor }} title="Topbar"></div>
            <div className="color-swatch" style={{ backgroundColor: theme.backgroundColor }} title="Fondo"></div>
        </div>
    );



    return (
        <div className="temas-page">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="container">
                <PageHeader
                    title="Gestión de Temas"
                    description="Personaliza los colores, fondos y la apariencia visual de todo el sistema."
                    icon="pi pi-palette"
                />

                <div className="main-content">
                    <ActionToolbar
                        onNew={openNew}
                        newLabel="Nuevo Tema"
                    />

                    <div className="themes-grid p-4">
                        {themes.map((theme) => (
                            <Card key={theme.id} className={`theme-card ${currentThemeKey === theme.themeKey ? 'active' : ''}`}>
                                <div className="theme-header" style={{ backgroundColor: theme.topbarColor, color: theme.topbarTextColor }}>
                                    <h3>{theme.name}</h3>
                                    {theme.isDark && <i className="pi pi-moon"></i>}
                                </div>
                                <div className="theme-body">
                                    <p>{theme.description || 'Sin descripción'}</p>
                                    {renderColorPreview(theme)}
                                    <div className="theme-actions">
                                        <Button
                                            icon="pi pi-check"
                                            className={`p-button-sm btn-apply ${currentThemeKey === theme.themeKey ? 'current p-button-success' : 'p-button-outlined'}`}
                                            label={currentThemeKey === theme.themeKey ? "Actual" : "Aplicar"}
                                            onClick={() => handleApplyTheme(theme)}
                                            disabled={currentThemeKey === theme.themeKey}
                                        />
                                        <Button icon="pi pi-pencil" className="p-button-sm p-button-info p-button-text btn-edit-theme" onClick={() => openEdit(theme)} />
                                        {!theme.isSystem && (
                                            <Button icon="pi pi-trash" className="p-button-sm p-button-danger p-button-text btn-delete-theme" onClick={() => confirmDelete(theme)} />
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog
                visible={showDialog}
                style={{ width: '500px', maxWidth: '95vw' }}
                header={
                    <DialogHeader
                        title={editingTheme ? 'Editar Tema' : 'Nuevo Tema'}
                        subtitle={editingTheme ? 'Modifica los colores de la interfaz' : 'Crea una nueva identidad visual'}
                        icon="pi pi-palette"
                    />
                }
                modal
                className="p-fluid custom-profile-dialog"
                footer={
                    <div className="dialog-footer-buttons">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setShowDialog(false)} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveTheme} autoFocus />
                    </div>
                }
                onHide={() => setShowDialog(false)}
            >
                <div className="p-fluid mt-4">
                    <div className="field">
                        <label htmlFor="name">Nombre</label>
                        <InputText id="name" value={formTheme.name} onChange={(e) => setFormTheme({ ...formTheme, name: e.target.value })} />
                    </div>
                    <div className="field">
                        <label htmlFor="description">Descripción</label>
                        <InputTextarea id="description" value={formTheme.description} onChange={(e) => setFormTheme({ ...formTheme, description: e.target.value })} rows={2} />
                    </div>

                    <div className="color-pickers-grid mt-3">
                        <div className="field">
                            <label className="font-semibold text-sm">Color Primario</label>
                            <div className="picker-row" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                                <ColorPicker value={formTheme.primaryColor} onChange={(e) => setFormTheme({ ...formTheme, primaryColor: e.value })} />
                                <span className="color-code" style={{ color: 'var(--text-secondary)' }}>#{formTheme.primaryColor}</span>
                            </div>
                        </div>
                        <div className="field">
                            <label className="font-semibold text-sm">Fondo Topbar</label>
                            <div className="picker-row" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                                <ColorPicker value={formTheme.topbarColor} onChange={(e) => setFormTheme({ ...formTheme, topbarColor: e.value })} />
                                <span className="color-code" style={{ color: 'var(--text-secondary)' }}>#{formTheme.topbarColor}</span>
                            </div>
                        </div>
                        <div className="field">
                            <label className="font-semibold text-sm">Fondo Aplicación</label>
                            <div className="picker-row" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                                <ColorPicker value={formTheme.backgroundColor} onChange={(e) => setFormTheme({ ...formTheme, backgroundColor: e.value })} />
                                <span className="color-code" style={{ color: 'var(--text-secondary)' }}>#{formTheme.backgroundColor}</span>
                            </div>
                        </div>
                        <div className="field">
                            <label className="font-semibold text-sm">Fondo Tarjeta</label>
                            <div className="picker-row" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                                <ColorPicker value={formTheme.cardBackground} onChange={(e) => setFormTheme({ ...formTheme, cardBackground: e.value })} />
                                <span className="color-code" style={{ color: 'var(--text-secondary)' }}>#{formTheme.cardBackground}</span>
                            </div>
                        </div>

                        {/* Nuevos selectores de texto */}
                        <div className="field">
                            <label className="font-semibold text-sm">Texto Primario</label>
                            <div className="picker-row" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                                <ColorPicker value={formTheme.textPrimary} onChange={(e) => setFormTheme({ ...formTheme, textPrimary: e.value })} />
                                <span className="color-code" style={{ color: 'var(--text-secondary)' }}>#{formTheme.textPrimary}</span>
                            </div>
                        </div>
                        <div className="field">
                            <label className="font-semibold text-sm">Texto Secundario</label>
                            <div className="picker-row" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                                <ColorPicker value={formTheme.textSecondary} onChange={(e) => setFormTheme({ ...formTheme, textSecondary: e.value })} />
                                <span className="color-code" style={{ color: 'var(--text-secondary)' }}>#{formTheme.textSecondary}</span>
                            </div>
                        </div>
                        <div className="field">
                            <label className="font-semibold text-sm">Texto Topbar</label>
                            <div className="picker-row" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                                <ColorPicker value={formTheme.topbarTextColor} onChange={(e) => setFormTheme({ ...formTheme, topbarTextColor: e.value })} />
                                <span className="color-code" style={{ color: 'var(--text-secondary)' }}>#{formTheme.topbarTextColor}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Temas;

