import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrderList } from 'primereact/orderlist';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '../components/ui/PageHeader';
import DialogHeader from '../components/ui/DialogHeader';
import './Usuario.css';
import './Permisos.css';

const Permisos = () => {
    const { axiosInstance } = useAuth();
    const [profiles, setProfiles] = useState([]); // Roles reordenables
    const [superAdmin, setSuperAdmin] = useState(null); // Rol fijo
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [allPermissions, setAllPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState(new Set());

    // Dialogs states
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
    const [currentRoleName, setCurrentRoleName] = useState('');
    const [editingRoleId, setEditingRoleId] = useState(null);

    const toast = useRef(null);

    // --- Groups Logic ---


    const { user } = useAuth();
    const canWriteRoles = user?.permissions?.includes('GESTION_ROLES');
    const canDeleteRoles = user?.permissions?.includes('GESTION_ROLES');
    const canManageHierarchy = user?.permissions?.includes('GESTION_JERARQUIA');

    const fetchInitialData = useCallback(async () => {
        try {
            const [profilesRes, permissionsRes] = await Promise.all([
                axiosInstance.get(`/admin/profiles/`),
                axiosInstance.get(`/admin/profiles/permissions`)
            ]);

            // Separar Super Admin y ordenar el resto por jerarquía (nivel descendente)
            const allProfiles = profilesRes.data;
            const superAdm = allProfiles.find(p => p.name === 'SUPER_ADMINISTRADOR');

            // Filtrar y ordenar: Mayor hierarchyLevel va primero (arriba)
            let otherProfiles = allProfiles
                .filter(p => p.name !== 'SUPER_ADMINISTRADOR')
                .sort((a, b) => (b.hierarchyLevel || 0) - (a.hierarchyLevel || 0));

            setSuperAdmin(superAdm);
            setProfiles(otherProfiles);

            // Ordenar permisos por importancia (Agrupación logica)
            const priorityMap = {
                'ACCESO_BASICO': 0,
                'GESTION_USUARIOS': 1,
                'GESTION_ROLES': 2,
                'GESTION_JERARQUIA': 3
            };
            const sortedPermissions = permissionsRes.data.sort((a, b) => {
                const priorityA = priorityMap[a.name] || 99;
                const priorityB = priorityMap[b.name] || 99;
                return priorityA - priorityB;
            });
            setAllPermissions(sortedPermissions);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            // toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos.' });
        }
    }, [axiosInstance]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // --- Logic for Role Management ---

    const openCreateDialog = () => {
        setDialogMode('create');
        setCurrentRoleName('');
        setDialogVisible(true);
    };

    const openEditDialog = (profile, e) => {
        e.stopPropagation(); // Evitar seleccionar el perfil al editar
        setDialogMode('edit');
        setEditingRoleId(profile.id);
        setCurrentRoleName(formatProfileName(profile.name));
        setDialogVisible(true);
    };

    const saveRole = async () => {
        if (!currentRoleName.trim()) return;
        // Convertir a formato BD (UPPERCASE_WITH_UNDERSCORES) o mantener nombre display? 
        // El sistema actual usa nombres en mayúsculas. Vamos a normalizar.
        const normalizedName = currentRoleName.trim().toUpperCase().replace(/\s+/g, '_');

        try {
            if (dialogMode === 'create') {
                await axiosInstance.post('/admin/profiles/create', { name: normalizedName });
                toast.current.show({ severity: 'success', summary: 'Creado', detail: 'Rol creado exitosamente.' });
            } else {
                await axiosInstance.put(`/admin/profiles/${editingRoleId}`, { name: normalizedName });
                toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Rol renombrado exitosamente.' });
            }
            setDialogVisible(false);
            fetchInitialData();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data || 'Error al guardar.' });
        }
    };

    const deleteRole = (profile, e) => {
        e.stopPropagation();
        confirmDialog({
            message: `¿Eliminar el rol "${formatProfileName(profile.name)}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-trash',
            acceptClassName: 'p-button-danger',
            rejectClassName: 'p-button-outlined',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    await axiosInstance.delete(`/admin/profiles/${profile.id}`);
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: `El rol "${formatProfileName(profile.name)}" ha sido eliminado.`, life: 3000 });

                    // Si el perfil eliminado estaba seleccionado, deseleccionar
                    if (selectedProfile?.id === profile.id) {
                        setSelectedProfile(null);
                        setRolePermissions(new Set());
                    }

                    fetchInitialData();
                } catch (error) {
                    const errorMsg = error.response?.data || 'No se pudo eliminar el rol.';
                    if (errorMsg.includes('usuarios')) {
                        toast.current.show({ severity: 'warn', summary: 'No se puede eliminar', detail: 'Hay usuarios activos con ese rol.', life: 4000 });
                    } else {
                        toast.current.show({ severity: 'error', summary: 'Error', detail: errorMsg, life: 4000 });
                    }
                }
            }
        });
    };

    const onReorder = async (e) => {
        const newOrder = e.value;
        setProfiles(newOrder);

        // Construir la lista completa de IDs para el backend
        // El backend espera [HighestRank, ..., LowestRank]
        // Incluimos al SuperAdmin al principio siempre
        const fullOrderIds = [];
        if (superAdmin) fullOrderIds.push(superAdmin.id);
        newOrder.forEach(p => fullOrderIds.push(p.id));

        try {
            await axiosInstance.post('/admin/profiles/reorder', fullOrderIds);
            toast.current.show({ severity: 'success', summary: 'Jerarquía', detail: 'Jerarquía actualizada.', life: 2000 });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar orden.' });
        }
    };

    const moveUp = (index, e) => {
        e.stopPropagation();
        if (index === 0) return;
        const newProfiles = [...profiles];
        [newProfiles[index - 1], newProfiles[index]] = [newProfiles[index], newProfiles[index - 1]];
        onReorder({ value: newProfiles });
    };

    const moveDown = (index, e) => {
        e.stopPropagation();
        if (index === profiles.length - 1) return;
        const newProfiles = [...profiles];
        [newProfiles[index + 1], newProfiles[index]] = [newProfiles[index], newProfiles[index + 1]];
        onReorder({ value: newProfiles });
    };

    // --- Logic for Permissions ---

    const selectProfile = (profile) => {
        setSelectedProfile(profile);
        if (profile && profile.permissions) {
            setRolePermissions(new Set(profile.permissions.map(p => p.id)));
        } else {
            setRolePermissions(new Set());
        }
    };

    const onPermissionChange = async (e, permission) => {
        if (!selectedProfile) return;
        const { id } = permission;
        const isChecking = e.checked;

        // Optimistic UI
        setRolePermissions(prev => {
            const next = new Set(prev);
            if (isChecking) next.add(id); else next.delete(id);
            return next;
        });

        const actionMethod = isChecking ? axiosInstance.post : axiosInstance.delete;
        try {
            await actionMethod(`/admin/profiles/${selectedProfile.id}/permissions/${id}`);
            // Actualizar localmente el objeto selectedProfile y la lista profiles para consistencia
            const updatePermissionsInList = (list) => list.map(p => {
                if (p.id === selectedProfile.id) {
                    let newPerms = p.permissions || [];
                    if (isChecking) newPerms = [...newPerms, permission];
                    else newPerms = newPerms.filter(perm => perm.id !== id);
                    const updatedP = { ...p, permissions: newPerms };
                    // Tambien actualizar selectedProfile si es este
                    if (selectedProfile.id === p.id) updateSelectedProfileObj(updatedP);
                    return updatedP;
                }
                return p;
            });
            setProfiles(prev => updatePermissionsInList(prev));
            if (superAdmin && superAdmin.id === selectedProfile.id) {
                // Caso raro super admin si se permitiera editar
            }

            toast.current.show({
                severity: 'success',
                summary: 'Permiso Actualizado',
                detail: isChecking ? 'Permiso asignado correctamente.' : 'Permiso removido correctamente.',
                life: 2000
            });

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el permiso.' });
            // Revert
            setRolePermissions(prev => {
                const next = new Set(prev);
                if (!isChecking) next.add(id); else next.delete(id);
                return next;
            });
        }
    };

    const updateSelectedProfileObj = (updatedProfile) => {
        setSelectedProfile(updatedProfile);
    };

    const formatProfileName = (name) => {
        return name ? name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    };

    const roleItem = (item) => {
        const index = profiles.findIndex(p => p.id === item.id);
        const isActive = selectedProfile?.id === item.id;
        return (
            <div
                className={`flex align-items-center p-2 mb-2 w-full role-card ${isActive ? 'selected' : ''}`}
                onClick={() => selectProfile(item)}
            >
                {canManageHierarchy && (
                    <div className="flex flex-column mr-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                            icon="pi pi-angle-up"
                            className="p-button-text p-button-sm p-0 w-1rem h-1rem mb-1 text-500 hover:text-primary"
                            disabled={index === 0}
                            onClick={(e) => moveUp(index, e)}
                        />
                        <Button
                            icon="pi pi-angle-down"
                            className="p-button-text p-button-sm p-0 w-1rem h-1rem text-500 hover:text-primary"
                            disabled={index === profiles.length - 1}
                            onClick={(e) => moveDown(index, e)}
                        />
                    </div>
                )}
                <div className="mr-3 flex align-items-center justify-content-center flex-shrink-0 role-icon-container" style={{ width: '28px', height: '28px', borderRadius: '50%' }}>
                    <i className="pi pi-shield text-lg"></i>
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="font-medium white-space-nowrap overflow-hidden text-overflow-ellipsis" style={{ color: 'var(--text-primary)' }}>{formatProfileName(item.name)}</div>
                    {/* <span className="text-500 text-xs">Nivel: {item.hierarchyLevel}</span> */}
                </div>

                {/* Drag Handle Icon - Only if can write */}
                {canWriteRoles && <i className="pi pi-bars text-400 mr-2 cursor-move flex-shrink-0" style={{ fontSize: '0.9rem' }}></i>}

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {canWriteRoles && (
                        <Button icon="pi pi-pencil" rounded text className="p-button-sm w-2rem h-2rem text-blue-600 hover:surface-100" aria-label="Editar" onClick={(e) => openEditDialog(item, e)} tooltip="Renombrar" tooltipOptions={{ position: 'top' }} />
                    )}
                    {canDeleteRoles && (
                        <Button icon="pi pi-trash" rounded text className="p-button-sm w-2rem h-2rem text-gray-700 hover:surface-100" aria-label="Eliminar" onClick={(e) => deleteRole(item, e)} tooltip="Eliminar" tooltipOptions={{ position: 'top' }} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="usuario-page">
            <div className="container">
                <Toast ref={toast} />
                <ConfirmDialog />

                <PageHeader
                    title="Configuración de Permisos"
                    description="Define los roles y ajusta las capacidades de cada perfil del sistema."
                    icon="pi pi-shield"
                />

                <div className="grid h-full">
                    {/* LEFT COL: ROLE LIST */}
                    <div className="col-12 md:col-4 lg:col-3 role-list-container">
                        <div className="flex flex-wrap justify-content-between align-items-center mb-3 mt-1 gap-2">
                            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Roles del Sistema</span>
                            <Button label="Nuevo" icon="pi pi-plus" className="p-button-sm flex-shrink-0 btn-new-role" onClick={openCreateDialog} />
                        </div>

                        <div className="flex flex-column gap-2">
                            {/* SUPER ADMIN (FIXED) */}
                            {superAdmin && (
                                <div
                                    className={`flex align-items-center p-2 role-card locked ${selectedProfile?.id === superAdmin.id ? 'selected' : ''}`}
                                    onClick={() => selectProfile(superAdmin)}
                                >
                                    <div className="mr-3 flex align-items-center justify-content-center flex-shrink-0 role-icon-container" style={{ width: '28px', height: '28px', borderRadius: '50%' }}>
                                        <i className="pi pi-verified text-lg"></i>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-bold white-space-nowrap overflow-hidden text-overflow-ellipsis" style={{ color: 'var(--text-primary)' }}>SUPER ADMIN</div>
                                    </div>
                                    <i className="pi pi-lock text-400 flex-shrink-0" title="Rol inamovible"></i>
                                </div>
                            )}

                            {/* DRAGGABLE LIST */}
                            <OrderList
                                value={profiles}
                                itemTemplate={roleItem}
                                dragdrop
                                onChange={onReorder}
                                className="custom-orderlist"
                            ></OrderList>
                        </div>
                    </div>

                    {/* RIGHT COL: PERMISSIONS */}
                    <div className="col-12 md:col-8 lg:col-9 permissions-container">
                        {!selectedProfile ? (
                            <div className="flex flex-column align-items-center justify-content-center h-full py-6" style={{ color: 'var(--text-secondary)' }}>
                                <div className="p-4 border-round-circle mb-3" style={{ backgroundColor: 'var(--bg-page)' }}>
                                    <i className="pi pi-shield text-5xl" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}></i>
                                </div>
                                <span className="text-xl font-medium">Seleccione un rol para configurar sus permisos</span>
                                <span className="text-sm mt-2">Haga clic en cualquier tarjeta de la izquierda</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap align-items-center mb-4 pb-3 border-bottom-1 surface-border gap-3">
                                    <div className="p-3 border-round flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%)', boxShadow: 'var(--shadow-sm)' }}>
                                        <i className="pi pi-key text-white text-2xl"></i>
                                    </div>
                                    <div className="flex-1 mt-1 min-w-0">
                                        <h2 className="m-0 text-xl font-bold line-height-2" style={{ wordBreak: 'break-word', color: 'var(--text-primary)' }}>{formatProfileName(selectedProfile.name)}</h2>
                                        <p className="m-0 text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            {selectedProfile.name === 'SUPER_ADMINISTRADOR'
                                                ? 'Acceso total e irrestricto al sistema.'
                                                : 'Gestionar permisos asignados a este rol.'}
                                        </p>
                                    </div>
                                    {selectedProfile.name === 'SUPER_ADMINISTRADOR' && (
                                        <span className="bg-orange-100 text-orange-800 px-3 py-1 border-round text-sm font-bold flex align-items-center gap-2 flex-shrink-0">
                                            <i className="pi pi-lock"></i> Solo Lectura
                                        </span>
                                    )}
                                </div>

                                <div className="grid">
                                    {allPermissions.map(permission => (
                                        <div key={permission.id} className="col-12 md:col-6 lg:col-4">
                                            <div
                                                className={`
                                                    field-checkbox p-3 permission-checkbox-card
                                                    ${rolePermissions.has(permission.id) ? 'active' : ''}
                                                    ${selectedProfile.name === 'SUPER_ADMINISTRADOR' ? 'disabled' : ''}
                                                `}
                                                onClick={(e) => {
                                                    // Optional: handle click on card
                                                }}
                                            >
                                                <Checkbox
                                                    inputId={permission.id.toString()}
                                                    checked={rolePermissions.has(permission.id)}
                                                    onChange={(e) => onPermissionChange(e, permission)}
                                                    disabled={selectedProfile.name === 'SUPER_ADMINISTRADOR'}
                                                />
                                                <label
                                                    htmlFor={permission.id.toString()}
                                                    className={`ml-3 font-medium ${selectedProfile.name === 'SUPER_ADMINISTRADOR' ? 'cursor-default' : 'cursor-pointer'}`}
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {permission.name}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '450px' }}
                    header={
                        <DialogHeader
                            title={dialogMode === 'create' ? "Crear Nuevo Rol" : "Editar Nombre del Rol"}
                            subtitle={dialogMode === 'create' ? "Defina un nuevo rol en el sistema" : "Modifique el nombre del rol existente"}
                            icon="pi pi-shield"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={
                        <div className="dialog-footer-buttons">
                            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setDialogVisible(false)} />
                            <Button label="Guardar" icon="pi pi-check" onClick={saveRole} autoFocus />
                        </div>
                    }
                    onHide={() => setDialogVisible(false)}
                >
                    <div className="flex flex-column gap-2 mt-4">
                        <label htmlFor="role-name" className="font-bold">Nombre del Rol</label>
                        <InputText
                            id="role-name"
                            value={currentRoleName}
                            onChange={(e) => setCurrentRoleName(e.target.value)}
                            placeholder="Ej: Supervisor"
                            autoFocus
                        />
                        <small className="text-500">Nombre único para el rol. Se guardará en mayúsculas.</small>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Permisos;