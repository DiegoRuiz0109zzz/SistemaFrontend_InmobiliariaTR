import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '../../components/ui/PageHeader';
import DialogHeader from '../../components/ui/DialogHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import { useAuth } from '../../context/AuthContext';
import { ClienteEntity } from '../../entity/ClienteEntity';
import { ClienteService } from '../../service/ClienteService';
import { UbigeoService } from '../../service/UbigeoService';
import '../Usuario.css';
import './Clientes.css';

const Clientes = () => {
    const { axiosInstance } = useAuth();
    const emptyCliente = { ...ClienteEntity };

    const [clientes, setClientes] = useState([]);
    const [cliente, setCliente] = useState(emptyCliente);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedClientes, setSelectedClientes] = useState(null);
    const [saving, setSaving] = useState(false);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    const toast = useRef(null);
    const dt = useRef(null);

    const cargarClientes = useCallback(async () => {
        try {
            const response = await ClienteService.listar(axiosInstance);
            setClientes(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los clientes.', life: 3500 });
        }
    }, [axiosInstance]);

    const mapTextOptions = (items) => items.map((item) => ({ label: item, value: item }));

    const mapDistritoOptions = (items) => items.map((item) => {
        const distrito = item?.distrito || item?.nombreDistrito || item?.name || '';
        const ubigeo = item?.ubigeo || item?.idUbigeo || item?.codigoUbigeo || '';
        return {
            label: distrito,
            value: distrito,
            ubigeo
        };
    });

    const cargarDepartamentos = useCallback(async () => {
        try {
            const response = await UbigeoService.listarDepartamentos(axiosInstance);
            setDepartamentos(mapTextOptions(response || []));
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar departamentos.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarProvincias = useCallback(async (departamento) => {
        if (!departamento) {
            setProvincias([]);
            setDistritos([]);
            return;
        }

        try {
            const response = await UbigeoService.listarProvincias(departamento, axiosInstance);
            setProvincias(mapTextOptions(response || []));
        } catch (error) {
            console.error(error);
            setProvincias([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar provincias.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarDistritos = useCallback(async (departamento, provincia) => {
        if (!departamento || !provincia) {
            setDistritos([]);
            return;
        }

        try {
            const response = await UbigeoService.listarDistritos(departamento, provincia, axiosInstance);
            setDistritos(mapDistritoOptions(response || []));
        } catch (error) {
            console.error(error);
            setDistritos([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar distritos.', life: 3500 });
        }
    }, [axiosInstance]);

    const hidratarUbigeo = useCallback(async (dataCliente) => {
        if (!dataCliente?.departamento) {
            setProvincias([]);
            setDistritos([]);
            return;
        }

        await cargarProvincias(dataCliente.departamento);
        if (dataCliente.provincia) {
            await cargarDistritos(dataCliente.departamento, dataCliente.provincia);
        }
    }, [cargarDistritos, cargarProvincias]);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    const openNew = () => {
        setCliente(emptyCliente);
        setProvincias([]);
        setDistritos([]);
        setSubmitted(false);
        setDialogVisible(true);
        cargarDepartamentos();
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setSubmitted(false);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setCliente((prev) => ({ ...prev, [name]: val }));
    };

    const onDepartamentoChange = async (value) => {
        setCliente((prev) => ({
            ...prev,
            departamento: value,
            provincia: '',
            distrito: '',
            ubigeo: ''
        }));
        await cargarProvincias(value);
        setDistritos([]);
    };

    const onProvinciaChange = async (value) => {
        setCliente((prev) => ({
            ...prev,
            provincia: value,
            distrito: '',
            ubigeo: ''
        }));
        await cargarDistritos(cliente.departamento, value);
    };

    const onDistritoChange = (value) => {
        const distritoSelected = distritos.find((item) => item.value === value);
        setCliente((prev) => ({
            ...prev,
            distrito: value,
            ubigeo: distritoSelected?.ubigeo || ''
        }));
    };

    const normalizeText = (value) => (value || '').trim();

    const saveCliente = async () => {
        setSubmitted(true);

        const numeroDocumento = normalizeText(cliente.numeroDocumento);
        const nombres = normalizeText(cliente.nombres);
        const apellidos = normalizeText(cliente.apellidos);

        if (!numeroDocumento || !nombres || !apellidos) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'Documento, nombres y apellidos son obligatorios.', life: 3000 });
            return;
        }

        const payload = {
            ...cliente,
            numeroDocumento,
            nombres,
            apellidos,
            departamento: normalizeText(cliente.departamento),
            provincia: normalizeText(cliente.provincia),
            distrito: normalizeText(cliente.distrito),
            ubigeo: normalizeText(cliente.ubigeo),
            direccion: normalizeText(cliente.direccion),
            telefono: normalizeText(cliente.telefono),
            email: normalizeText(cliente.email)
        };

        setSaving(true);
        try {
            if (cliente.id) {
                await ClienteService.actualizar(cliente.id, payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Cliente actualizado correctamente.', life: 3000 });
            } else {
                await ClienteService.crear(payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Cliente creado correctamente.', life: 3000 });
            }

            await cargarClientes();
            setDialogVisible(false);
            setCliente(emptyCliente);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar el cliente.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        } finally {
            setSaving(false);
        }
    };

    const editCliente = async (rowData) => {
        setCliente({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
        await cargarDepartamentos();
        await hidratarUbigeo(rowData);
    };

    const confirmDeleteCliente = (rowData) => {
        const nombreCompleto = `${rowData.nombres || ''} ${rowData.apellidos || ''}`.trim();
        confirmDialog({
            message: `¿Eliminar al cliente "${nombreCompleto || 'sin nombre'}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteCliente(rowData)
        });
    };

    const deleteCliente = async (rowData) => {
        try {
            await ClienteService.eliminar(rowData.id, axiosInstance);
            await cargarClientes();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Cliente eliminado correctamente.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar el cliente.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const exportCSV = () => {
        if (dt.current) {
            dt.current.exportCSV();
        }
    };

    const actionBodyTemplate = (rowData) => (
        <div className="action-buttons">
            <Button icon="pi pi-pencil" className="btn-edit" onClick={() => editCliente(rowData)} tooltip="Editar" />
            <Button icon="pi pi-trash" className="btn-delete" onClick={() => confirmDeleteCliente(rowData)} tooltip="Eliminar" />
        </div>
    );

    const dialogFooter = (
        <div className="dialog-footer-buttons">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveCliente} autoFocus loading={saving} />
        </div>
    );

    return (
        <div className="usuario-page clientes-page">
            <div className="container">
                <PageHeader
                    title="Clientes"
                    description="Administra los clientes registrados en el sistema."
                    icon="pi pi-users"
                />

                <div className="main-content">
                    <div className="content-card">
                        <ConfirmDialog />
                        <Toast ref={toast} />

                        <ActionToolbar
                            onNew={openNew}
                            newLabel="Nuevo Cliente"
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar clientes..."
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

                        <DataTable
                            ref={dt}
                            value={clientes}
                            selection={selectedClientes}
                            onSelectionChange={(e) => setSelectedClientes(e.value)}
                            dataKey="id"
                            paginator
                            rows={10}
                            globalFilter={globalFilter}
                            globalFilterFields={['numeroDocumento', 'nombres', 'apellidos', 'telefono', 'email', 'direccion']}
                            emptyMessage="No se encontraron clientes."
                        >
                            <Column field="numeroDocumento" header="Documento" style={{ minWidth: '140px' }} />
                            <Column field="nombres" header="Nombres" style={{ minWidth: '180px' }} />
                            <Column field="apellidos" header="Apellidos" style={{ minWidth: '180px' }} />
                            <Column field="telefono" header="Teléfono" style={{ minWidth: '140px' }} />
                            <Column field="email" header="Correo" style={{ minWidth: '200px' }} />
                            <Column field="direccion" header="Dirección" style={{ minWidth: '220px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '800px', maxWidth: '95vw' }}
                    header={
                        <DialogHeader
                            title={cliente.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                            subtitle={cliente.id ? 'Modificar datos del cliente' : 'Registrar un nuevo cliente'}
                            icon="pi pi-users"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="formgrid grid mt-4 dialog-content-specific">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="numeroDocumento">Documento</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="numeroDocumento"
                                    value={cliente.numeroDocumento}
                                    onChange={(e) => onInputChange(e, 'numeroDocumento')}
                                    required
                                    placeholder="Ingrese documento"
                                    className={submitted && !cliente.numeroDocumento ? 'p-invalid' : ''}
                                />
                                <Button icon="pi pi-search" className="p-button-outlined" type="button" />
                            </div>
                            {submitted && !cliente.numeroDocumento && <small className="p-error">El documento es requerido.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="telefono">Teléfono</label>
                            <InputText
                                id="telefono"
                                value={cliente.telefono}
                                onChange={(e) => onInputChange(e, 'telefono')}
                                placeholder="Ingrese teléfono"
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="nombres">Nombres</label>
                            <InputText
                                id="nombres"
                                value={cliente.nombres}
                                onChange={(e) => onInputChange(e, 'nombres')}
                                required
                                placeholder="Ingrese nombres"
                                className={submitted && !cliente.nombres ? 'p-invalid' : ''}
                            />
                            {submitted && !cliente.nombres && <small className="p-error">Los nombres son requeridos.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="apellidos">Apellidos</label>
                            <InputText
                                id="apellidos"
                                value={cliente.apellidos}
                                onChange={(e) => onInputChange(e, 'apellidos')}
                                required
                                placeholder="Ingrese apellidos"
                                className={submitted && !cliente.apellidos ? 'p-invalid' : ''}
                            />
                            {submitted && !cliente.apellidos && <small className="p-error">Los apellidos son requeridos.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Correo Electrónico</label>
                            <InputText
                                id="email"
                                value={cliente.email}
                                onChange={(e) => onInputChange(e, 'email')}
                                placeholder="ejemplo@correo.com"
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="direccion">Dirección</label>
                            <InputText
                                id="direccion"
                                value={cliente.direccion}
                                onChange={(e) => onInputChange(e, 'direccion')}
                                placeholder="Ingrese dirección"
                            />
                        </div>

                        <div className="field col-12 md:col-4">
                            <label htmlFor="departamento">Departamento</label>
                            <Dropdown
                                id="departamento"
                                value={cliente.departamento}
                                options={departamentos}
                                onChange={(e) => onDepartamentoChange(e.value)}
                                placeholder="Seleccione un departamento"
                                className="w-full"
                                filter
                                filterPlaceholder="Buscar departamento"
                                showClear
                            />
                        </div>

                        <div className="field col-12 md:col-4">
                            <label htmlFor="provincia">Provincia</label>
                            <Dropdown
                                id="provincia"
                                value={cliente.provincia}
                                options={provincias}
                                onChange={(e) => onProvinciaChange(e.value)}
                                placeholder="Seleccione una provincia"
                                className="w-full"
                                filter
                                filterPlaceholder="Buscar provincia"
                                showClear
                                disabled={!cliente.departamento}
                            />
                        </div>

                        <div className="field col-12 md:col-4">
                            <label htmlFor="distrito">Distrito</label>
                            <Dropdown
                                id="distrito"
                                value={cliente.distrito}
                                options={distritos}
                                onChange={(e) => onDistritoChange(e.value)}
                                placeholder="Seleccione un distrito"
                                className="w-full"
                                filter
                                filterPlaceholder="Buscar distrito"
                                showClear
                                disabled={!cliente.provincia}
                            />
                        </div>

                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Clientes;
