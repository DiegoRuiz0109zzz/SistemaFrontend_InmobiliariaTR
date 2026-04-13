import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import classNames from 'classnames';

// Nuevo metodo de llamada a Backend
import { useAuth } from '../context/AuthContext';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';

import { UsuarioEntity } from '../entity/UsuarioEntity';
import PageHeader from '../components/ui/PageHeader';
import DialogHeader from '../components/ui/DialogHeader';
import ActionToolbar from '../components/ui/ActionToolbar';
import './Usuario.css';

export const Usuario = () => {

    let empty = { ...UsuarioEntity, role: null, tipoDocumento: 'DNI' };

    const { user, axiosInstance } = useAuth();


    const [data, setData] = useState([]);
    // ...

    // ...

    const [totalRecords, setTotalRecords] = useState(0);



    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0
    });
    const [EntidadNewDialog, setEntidadNewDialog] = useState(false);

    const [product, setProduct] = useState(empty);
    const [originalRole, setOriginalRole] = useState(null); //estado del rol original
    const [selectedProducts, setSelectedProducts] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const toast = useRef(null);
    const dt = useRef(null);

    const [roles, setRoles] = useState([]);
    const [rolesLoaded, setRolesLoaded] = useState(false);

    const fetchRoles = useCallback(async () => {
        if (rolesLoaded) return;
        try {
            const response = await axiosInstance.get("admin/profiles/");
            // Ordenar por jerarquía: Super Admin primero, luego el resto por nivel descendente
            const sortedRoles = response.data.sort((a, b) => {
                if (a.name === 'SUPER_ADMINISTRADOR') return -1;
                if (b.name === 'SUPER_ADMINISTRADOR') return 1;
                return (b.hierarchyLevel || 0) - (a.hierarchyLevel || 0);
            });

            const mappedRoles = sortedRoles.map(role => ({
                label: role.name
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, c => c.toUpperCase()), // Title Case Format
                value: role.name
            }));
            setRoles(mappedRoles);
            setRolesLoaded(true);
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles.', life: 3000 });
        }
    }, [axiosInstance, rolesLoaded]);

    useEffect(() => {
        if (EntidadNewDialog) {
            fetchRoles();
        }
    }, [EntidadNewDialog, fetchRoles]);

    const peticionGet = useCallback(async () => {
        try {
            const page = lazyParams.first / lazyParams.rows;
            const response = await axiosInstance.get(`usuario/`, {
                params: {
                    page,
                    size: lazyParams.rows,
                    search: globalFilter || ''
                }
            });
            setData(response.data.content);
            setTotalRecords(response.data.totalElements);
        } catch (error) {
            console.error(error);
        } finally {
        }
    }, [lazyParams, globalFilter, axiosInstance]);

    const peticionPost = async () => {
        product.password = product.docIdentidad;
        delete product.id;
        //console.log(product);
        await axiosInstance.post("usuario/", product)
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Ingreso Correcto', life: 3000 });
                peticionGet();
            }).catch(error => {
                console.log("Error creando usuario:", error);
                let errorMessage = 'Error al crear usuario';
                if (error.response) {
                    if (error.response.data && error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else {
                        errorMessage = JSON.stringify(error.response.data);
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
            })
    }

    const peticionPut = async () => {
        try {
            //console.log("Ingreso put");
            //console.log(product);

            await axiosInstance.put("usuario/", product)
                .then(() => {
                    var dataNueva = data.map(u => {
                        if (u.id === product.id) {
                            u.username = product.username;
                            u.nombres = product.nombres;
                            u.apellidos = product.apellidos;
                            u.telefono = product.telefono;
                            u.email = product.email;
                        }
                        return u;
                    });
                    setData(dataNueva);
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Ingreso Modificado', life: 3000 });
                })
                .catch(error => {
                    console.log(error);
                    let errorMessage = 'Datos Incorrectos';
                    if (error.response && error.response.data) {
                        errorMessage = error.response.data.message || error.response.data || errorMessage;
                    }
                    toast.current.show({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
                });
        } catch (error) {
            console.error(error);
        }
    };

    const peticionPutReiniciarPass = async (product) => {
        await axiosInstance.post("usuario/passgenerico", product)
            .then(() => {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Contraseña Restaurada Correctamente', life: 3000 });
            }).catch(error => {
                console.log(error);
                let errorMessage = 'Datos Incorrectos';
                if (error.response && error.response.data) {
                    errorMessage = error.response.data.message || error.response.data || errorMessage;
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
            })
    }

    const peticionRENIEC = async () => {
        try {
            const response = await axios.get("https://dniruc.apisperu.com/api/v1/dni/" + product.docIdentidad + "?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnYWl0YW5yQHBqLmdvYi5wZSJ9.-nX87AiyjDvfW2SeGAhWFnx0MDCiB8meK06aAAlVfJQ");
            const nombres = response.data.nombres;
            const apellidos = response.data.apellidoPaterno + " " + response.data.apellidoMaterno;
            setProduct((prevProduct) => ({
                ...prevProduct,
                nombres: nombres,
                apellidos: apellidos,
            }));
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error de RENIEC', detail: 'No se pudo obtener la información del DNI.', life: 5000 });
            console.log(error);
        }
    }

    const onPage = (event) => {
        setLazyParams((prevState) => ({
            ...prevState,
            first: event.first,
            rows: event.rows
        }));
    };

    useEffect(() => {
        if (user) {
            peticionGet();
        }
    }, [lazyParams, globalFilter, user, peticionGet]);

    const BuscarDNI = () => {
        setSubmitted(true);
        if (product.docIdentidad && product.docIdentidad.trim().length === 8) {
            peticionRENIEC();
        } else {
            toast.current.show({ severity: 'warn', summary: 'DNI Inválido', detail: 'El DNI debe tener 8 dígitos.', life: 3000 });
        }
    }

    const openNew = () => {
        setProduct(empty);
        setSubmitted(false);
        setEntidadNewDialog(true);
    }
    const hideDialogNew = () => {
        setSubmitted(false);
        setEntidadNewDialog(false);
    }
    const editProduct = (product) => {
        // Inferir tipo de documento basado en la longitud si no existe en la base de datos
        let tipo = 'DNI';
        if (product.docIdentidad && product.docIdentidad.length > 8) {
            tipo = 'CE';
        }

        const currentRole = product.profile?.name;
        setProduct({ ...product, role: currentRole, tipoDocumento: tipo });
        setOriginalRole(currentRole);
        setEntidadNewDialog(true);
    }

    const restaurarPass = (product) => {
        setProduct({ ...product });
        peticionPutReiniciarPass(product);
    }

    const saveProduct = async () => {
        setSubmitted(true);

        // Validación estricta de DNI
        if (product.tipoDocumento === 'DNI' && product.docIdentidad && product.docIdentidad.length !== 8) {
            toast.current.show({
                severity: 'error',
                summary: 'DNI Inválido',
                detail: 'El DNI debe tener exactamente 8 dígitos para ser procesado.',
                life: 3000
            });
            return;
        }

        if (product.docIdentidad && product.username && product.nombres && product.apellidos && product.email && product.telefono) {

            if (product.id) {
                // Actualizar Datos Básicos
                await peticionPut();

                // Actualizar Rol (Endpoint separado)
                if (product.role && product.role !== originalRole) {//consulta si hay rol, y si hay cambio
                    try {
                        await axiosInstance.post("usuario/asignar-perfil", { userId: product.id, newProfileName: product.role });
                        // Actualizar localmente para reflejo inmediato si se desea, pero peticionGet lo hará
                    } catch (error) {
                        console.error("Error al asignar perfil:", error);
                        let errorMsg = "No se pudo actualizar el rol.";
                        if (error.response && error.response.data && error.response.data.message) {
                            errorMsg = error.response.data.message;
                        }
                        toast.current.show({ severity: 'error', summary: 'Error de Permisos', detail: errorMsg, life: 5000 });
                    }
                }

                peticionGet(); // Refrescar lista completa
            }
            else {
                await peticionPost();
                // peticionPost ya llama a peticionGet
            }
            setEntidadNewDialog(false);
            setProduct(empty);
        }
    }


    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _product = { ...product };
        _product[`${name}`] = val;

        // Si cambiamos el tipo de documento, reseteamos el número para evitar inconsistencias
        if (name === 'tipoDocumento') {
            _product.docIdentidad = '';
        }

        setProduct(_product);
    }

    // Only allow numeric input for DNI and phone fields
    const onNumericInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        const numericVal = val.replace(/[^0-9]/g, '');
        let _product = { ...product };
        _product[`${name}`] = numericVal;
        setProduct(_product);
    }

    const onRoleChange = (e) => {
        let _product = { ...product };
        _product['role'] = e.value;
        setProduct(_product);
    }

    const idBody = (rowData) => {
        return (
            <>
                {rowData.docIdentidad}
            </>
        );
    }

    const usernameBody = (rowData) => {
        return (
            <>
                {rowData.username}
            </>
        );
    }

    const nombreBody = (rowData) => {
        return (
            <>
                {rowData.nombres + ' ' + rowData.apellidos}
            </>
        );
    }

    const emailBody = (rowData) => {
        return (
            <>
                {rowData.email}
            </>
        );
    }

    const telefonoBody = (rowData) => {
        return (
            <>
                {rowData.telefono}
            </>
        );
    }

    const deleteUser = (rowData) => {
        confirmDialog({
            message: `¿Está seguro de eliminar al usuario "${rowData.nombres} ${rowData.apellidos}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            rejectClassName: 'p-button-outlined',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    await axiosInstance.delete(`usuario/${rowData.id}`);
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: `Usuario "${rowData.username}" eliminado correctamente.`, life: 3000 });
                    peticionGet();
                } catch (error) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario.', life: 4000 });
                }
            }
        });
    };

    const actionBody = (rowData) => {
        return (
            <div className="action-buttons">
                <Button
                    icon="pi pi-pencil"
                    tooltip="Editar usuario"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => editProduct(rowData)}
                    className="btn-edit"
                />
                <Button
                    icon="pi pi-refresh"
                    tooltip="Restaurar contraseña"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => restaurarPass(rowData)}
                    className="btn-reset"
                />
                <Button
                    icon="pi pi-trash"
                    tooltip="Eliminar usuario"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => deleteUser(rowData)}
                    className="btn-delete"
                    severity="danger"
                />
            </div>
        );
    }

    return (
        <div className="usuario-page">
            <div className="container">
                <PageHeader
                    title="Control de Usuarios"
                    description="Administra el acceso de personal"
                    icon="pi pi-users"
                />

                {/* Contenido principal */}
                <div className="main-content">
                    <div className="content-card">
                        <ConfirmDialog />
                        <Toast ref={toast} />

                        <ActionToolbar
                            onNew={openNew}
                            newLabel="Nuevo Usuario"
                            onSearch={(val) => {
                                setGlobalFilter(val);
                                // Nota: el InputText de Usuario.js usa onKeyUp para peticionGet, 
                                // aquí el onSearch se gatilla en cada cambio. 
                                // Si se prefiere delay, se puede implementar rebote.
                            }}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar usuarios..."
                            extraActions={
                                <Button
                                    icon="pi pi-download"
                                    tooltip="Exportar a CSV"
                                    tooltipOptions={{ position: 'bottom' }}
                                    className="btn-export"
                                    onClick={exportCSV}
                                />
                            }
                        />

                        <DataTable ref={dt} value={data} selection={selectedProducts} onSelectionChange={(e) => setSelectedProducts(e.value)} dataKey="id"
                            paginator
                            lazy
                            resizableColumns
                            size='small'
                            first={lazyParams.first}
                            rows={lazyParams.rows}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={false}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
                            emptyMessage="No se encontraron usuarios."
                        >
                            <Column field="id" header="Documento" body={idBody} style={{ minWidth: '120px' }}></Column>
                            <Column field="nombre" header="Nombre Completo" body={nombreBody} style={{ minWidth: '220px' }}></Column>
                            <Column field="username" header="Usuario" body={usernameBody} style={{ minWidth: '150px' }}></Column>
                            <Column field="email" header="Correo Electrónico" body={emailBody} style={{ minWidth: '200px' }}></Column>
                            <Column field="telefono" header="Teléfono" body={telefonoBody} style={{ minWidth: '130px' }}></Column>
                            <Column header="Acciones" body={actionBody} style={{ minWidth: '120px', textAlign: 'center' }}></Column>
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={EntidadNewDialog}
                    style={{ width: '800px', maxWidth: '95vw' }}
                    header={
                        <DialogHeader
                            title={product.id ? 'Editar Usuario' : 'Nuevo Usuario'}
                            subtitle={product.id ? 'Modificar datos del usuario' : 'Registrar un nuevo usuario'}
                            icon="pi pi-user-plus"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={
                        <div className="dialog-footer-buttons">
                            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialogNew} />
                            <Button label="Guardar" icon="pi pi-check" onClick={saveProduct} autoFocus />
                        </div>
                    }
                    onHide={hideDialogNew}
                >
                    <div className="formgrid grid mt-4 dialog-content-specific">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="tipoDocumento">Tipo de Documento</label>
                            <Dropdown
                                id="tipoDocumento"
                                value={product.tipoDocumento || 'DNI'}
                                options={[
                                    { label: 'DNI', value: 'DNI' },
                                    { label: 'Carnet de Extranjería', value: 'CE' }
                                ]}
                                onChange={(e) => onInputChange(e, 'tipoDocumento')}
                                placeholder="Seleccione tipo"
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="docIdentidad">{product.tipoDocumento === 'CE' ? 'Carnet de Extranjería' : 'DNI'}</label>
                            <div className={product.tipoDocumento === 'CE' ? '' : 'p-inputgroup'}>
                                <InputText
                                    id="docIdentidad"
                                    value={product.docIdentidad}
                                    onChange={(e) => onNumericInputChange(e, 'docIdentidad')}
                                    required
                                    placeholder={product.tipoDocumento === 'CE' ? 'Ingrese Carnet' : 'Ingrese DNI'}
                                    maxLength={product.tipoDocumento === 'CE' ? 12 : 8}
                                    className={classNames({ 'p-invalid': submitted && !product.docIdentidad })}
                                />
                                {product.tipoDocumento !== 'CE' && (
                                    <Button icon="pi pi-search" onClick={BuscarDNI} tooltip="Consultar RENIEC" className="btn-search-dni-specific" />
                                )}
                            </div>
                            {submitted && !product.docIdentidad && <small className="p-error">El documento es requerido.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="username">Usuario</label>
                            <InputText
                                id="username"
                                value={product.username}
                                onChange={(e) => onInputChange(e, 'username')}
                                required
                                placeholder="Nombre de usuario"
                                className={classNames({ 'p-invalid': submitted && !product.username })}
                            />
                            {submitted && !product.username && <small className="p-error">El usuario es requerido.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="nombres">Nombres</label>
                            <InputText
                                id="nombres"
                                value={product.nombres}
                                onChange={(e) => onInputChange(e, 'nombres')}
                                required
                                placeholder="Nombres completos"
                                className={classNames({ 'p-invalid': submitted && !product.nombres })}
                            />
                            {submitted && !product.nombres && <small className="p-error">Nombres requeridos.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="apellido">Apellidos</label>
                            <InputText
                                id="apellido"
                                value={product.apellidos}
                                onChange={(e) => onInputChange(e, 'apellidos')}
                                required
                                placeholder="Apellidos completos"
                                className={classNames({ 'p-invalid': submitted && !product.apellidos })}
                            />
                            {submitted && !product.apellidos && <small className="p-error">Apellidos requeridos.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Correo Electrónico</label>
                            <InputText
                                id="email"
                                value={product.email}
                                onChange={(e) => onInputChange(e, 'email')}
                                required
                                placeholder="ejemplo@correo.com"
                                className={classNames({ 'p-invalid': submitted && !product.email })}
                            />
                            {submitted && !product.email && <small className="p-error">Correo requerido.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="telefono">Teléfono</label>
                            <InputText
                                id="telefono"
                                value={product.telefono}
                                onChange={(e) => onNumericInputChange(e, 'telefono')}
                                required
                                maxLength={9}
                                placeholder="Ingrese teléfono"
                                className={classNames({ 'p-invalid': submitted && !product.telefono })}
                            />
                            {submitted && !product.telefono && <small className="p-error">Teléfono requerido.</small>}
                        </div>

                        <div className="field col-12">
                            <label htmlFor="role">Rol de Usuario</label>
                            <Dropdown
                                id="role"
                                value={product.role}
                                options={roles}
                                onChange={onRoleChange}
                                optionLabel="label"
                                placeholder="Seleccione un Rol"
                                className="w-full"
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};
export default Usuario;
