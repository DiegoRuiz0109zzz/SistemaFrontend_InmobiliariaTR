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
import { InteresadoEntity } from '../../entity/InteresadoEntity';
import { InteresadoService } from '../../service/InteresadoService';
import { ReniecService } from '../../service/ReniecService';
import { UbigeoService } from '../../service/UbigeoService';
import { filtrarDocumento, validarDocumento, maxLengthDocumento, placeholderDocumento } from '../../utils/documentoUtils';
import '../Usuario.css';
import './Interesados.css';

const Interesados = () => {
    const { axiosInstance } = useAuth();
    const emptyInteresado = { ...InteresadoEntity };

    const [interesados, setInteresados] = useState([]);
    const [interesado, setInteresado] = useState(emptyInteresado);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedInteresados, setSelectedInteresados] = useState(null);
    const [saving, setSaving] = useState(false);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    const toast = useRef(null);
    const dt = useRef(null);

    // ==========================================
    // CARGA DE DATOS
    // ==========================================
    const cargarInteresados = useCallback(async () => {
        try {
            const response = await InteresadoService.listar(axiosInstance);
            setInteresados(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los interesados.', life: 3500 });
        }
    }, [axiosInstance]);

    // ==========================================
    // UBIGEO EN CASCADA (mismo patrón que Clientes)
    // ==========================================
    const mapTextOptions = (items) => (items || []).map((item) => ({ label: item, value: item }));

    const mapDistritoOptions = (items) => (items || []).map((item) => {
        const distrito = item?.distrito || item?.nombreDistrito || item?.name || '';
        const ubigeo = item?.ubigeo || item?.idUbigeo || item?.codigoUbigeo || '';
        return { label: distrito, value: distrito, ubigeo };
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
        if (!departamento) { setProvincias([]); setDistritos([]); return; }
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
        if (!departamento || !provincia) { setDistritos([]); return; }
        try {
            const response = await UbigeoService.listarDistritos(departamento, provincia, axiosInstance);
            setDistritos(mapDistritoOptions(response || []));
        } catch (error) {
            console.error(error);
            setDistritos([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar distritos.', life: 3500 });
        }
    }, [axiosInstance]);

    const hidratarUbigeo = useCallback(async (dataInteresado) => {
        if (!dataInteresado?.departamento) { setProvincias([]); setDistritos([]); return; }
        await cargarProvincias(dataInteresado.departamento);
        if (dataInteresado.provincia) {
            await cargarDistritos(dataInteresado.departamento, dataInteresado.provincia);
        }
    }, [cargarDistritos, cargarProvincias]);

    useEffect(() => {
        cargarInteresados();
    }, [cargarInteresados]);

    // ==========================================
    // DIALOG: ABRIR / CERRAR
    // ==========================================
    const openNew = () => {
        setInteresado(emptyInteresado);
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

    const editInteresado = async (rowData) => {
        setInteresado({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
        await cargarDepartamentos();
        await hidratarUbigeo(rowData);
    };

    // ==========================================
    // HANDLERS DE CAMBIO
    // ==========================================
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        if (name === 'numeroDocumento') {
            const filtered = filtrarDocumento(val, interesado.tipoDocumento || 'DNI');
            setInteresado((prev) => ({ ...prev, [name]: filtered }));
        } else {
            setInteresado((prev) => ({ ...prev, [name]: val }));
        }
    };

    // Limpiar documento al cambiar tipo
    const onTipoDocumentoChange = (e) => {
        setInteresado((prev) => ({ ...prev, tipoDocumento: e.value, numeroDocumento: '' }));
    };

    const onDepartamentoChange = async (value) => {
        setInteresado((prev) => ({ ...prev, departamento: value, provincia: '', distrito: '', ubigeo: '' }));
        await cargarProvincias(value);
        setDistritos([]);
    };

    const onProvinciaChange = async (value) => {
        setInteresado((prev) => ({ ...prev, provincia: value, distrito: '', ubigeo: '' }));
        await cargarDistritos(interesado.departamento, value);
    };

    const onDistritoChange = (value) => {
        const distritoSelected = distritos.find((item) => item.value === value);
        setInteresado((prev) => ({ ...prev, distrito: value, ubigeo: distritoSelected?.ubigeo || '' }));
    };

    // ==========================================
    // HELPERS
    // ==========================================
    const normalizeText = (value) => (value || '').trim();

    const formatFechaIngreso = (value) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('es-PE');
    };

    const mapReniecData = (data) => {
        if (!data) return {};
        const nombres = data.nombres || data.nombre || '';
        const apellidoPaterno = data.apellidoPaterno || data.apellido_paterno || '';
        const apellidoMaterno = data.apellidoMaterno || data.apellido_materno || '';
        const apellidos = data.apellidos || `${apellidoPaterno} ${apellidoMaterno}`.trim();
        return { nombres, apellidos };
    };

    // ==========================================
    // RENIEC
    // ==========================================
    const buscarDni = async () => {
        if (interesado.tipoDocumento && interesado.tipoDocumento !== 'DNI') {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'La consulta RENIEC aplica solo para DNI.', life: 3000 });
            return;
        }
        const dni = normalizeText(interesado.numeroDocumento);
        if (dni.length !== 8) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'El DNI debe tener 8 digitos.', life: 3000 });
            return;
        }
        try {
            const response = await ReniecService.consultarDNI(dni, axiosInstance);
            if (!response?.success) {
                toast.current?.show({ severity: 'warn', summary: 'RENIEC', detail: response?.message || 'No se encontraron datos para el DNI.', life: 3500 });
                return;
            }
            const mapped = mapReniecData(response.data);
            setInteresado((prev) => ({ ...prev, ...mapped }));
            toast.current?.show({ severity: 'success', summary: 'RENIEC', detail: 'Datos cargados correctamente.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || error?.message || 'No se pudo consultar RENIEC.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    // ==========================================
    // GUARDAR
    // ==========================================
    const saveInteresado = async () => {
        setSubmitted(true);

        const numeroDocumento = normalizeText(interesado.numeroDocumento);
        const tipoDocumento = normalizeText(interesado.tipoDocumento || 'DNI');
        const nombres = normalizeText(interesado.nombres);
        const apellidos = normalizeText(interesado.apellidos);
        const telefono = normalizeText(interesado.telefono);

        if (!nombres || !apellidos || !telefono) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'Nombres, apellidos y teléfono son obligatorios.', life: 3000 });
            return;
        }

        const docValidation = validarDocumento(numeroDocumento, tipoDocumento);
        if (!docValidation.valid) {
            toast.current?.show({ severity: 'warn', summary: 'Documento inválido', detail: docValidation.message, life: 3500 });
            return;
        }

        const payload = {
            ...interesado,
            numeroDocumento,
            nombres,
            apellidos,
            telefono,
            tipoDocumento,
            email: normalizeText(interesado.email),
            departamento: normalizeText(interesado.departamento),
            provincia: normalizeText(interesado.provincia),
            distrito: normalizeText(interesado.distrito),
            ubigeo: normalizeText(interesado.ubigeo)
        };

        setSaving(true);
        try {
            if (interesado.id) {
                await InteresadoService.actualizar(interesado.id, payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Interesado actualizado correctamente.', life: 3000 });
            } else {
                await InteresadoService.crear(payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Interesado creado correctamente.', life: 3000 });
            }
            await cargarInteresados();
            setDialogVisible(false);
            setInteresado(emptyInteresado);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar el interesado.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // ELIMINAR
    // ==========================================
    const confirmDeleteInteresado = (rowData) => {
        const nombreCompleto = `${rowData.nombres || ''} ${rowData.apellidos || ''}`.trim();
        confirmDialog({
            message: `¿Eliminar al interesado "${nombreCompleto || 'sin nombre'}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteInteresado(rowData)
        });
    };

    const deleteInteresado = async (rowData) => {
        try {
            await InteresadoService.eliminar(rowData.id, axiosInstance);
            await cargarInteresados();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Interesado eliminado correctamente.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar el interesado.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const exportCSV = () => { if (dt.current) dt.current.exportCSV(); };

    // ==========================================
    // TEMPLATES DE TABLA
    // ==========================================
    const actionBodyTemplate = (rowData) => (
        <div className="action-buttons">
            <Button icon="pi pi-pencil" className="btn-edit" onClick={() => editInteresado(rowData)} tooltip="Editar" />
            <Button icon="pi pi-trash" className="btn-delete" onClick={() => confirmDeleteInteresado(rowData)} tooltip="Eliminar" />
        </div>
    );

    const indexBodyTemplate = (_, options) => (options.rowIndex ?? 0) + 1;

    const dialogFooter = (
        <div className="dialog-footer-buttons">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveInteresado} autoFocus loading={saving} />
        </div>
    );

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="usuario-page interesados-page">
            <div className="container">
                <PageHeader
                    title="Interesados"
                    description="Administra los interesados en los proyectos y lotes."
                    icon="pi pi-user-plus"
                />

                <div className="main-content">
                    <div className="content-card">
                        <ConfirmDialog />
                        <Toast ref={toast} />

                        <ActionToolbar
                            onNew={openNew}
                            newLabel="Nuevo Interesado"
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar interesados..."
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
                            value={interesados}
                            selection={selectedInteresados}
                            onSelectionChange={(e) => setSelectedInteresados(e.value)}
                            dataKey="id"
                            paginator
                            rows={10}
                            globalFilter={globalFilter}
                            globalFilterFields={['numeroDocumento', 'tipoDocumento', 'nombres', 'apellidos', 'telefono', 'email', 'departamento', 'provincia', 'distrito']}
                            emptyMessage="No se encontraron interesados."
                        >
                            <Column header="N°" body={indexBodyTemplate} style={{ width: '80px', textAlign: 'center' }} />
                            <Column field="numeroDocumento" header="Documento" style={{ minWidth: '140px' }} />
                            <Column field="tipoDocumento" header="Tipo" style={{ minWidth: '120px' }} />
                            <Column field="nombres" header="Nombres" style={{ minWidth: '180px' }} />
                            <Column field="apellidos" header="Apellidos" style={{ minWidth: '180px' }} />
                            <Column field="telefono" header="Teléfono" style={{ minWidth: '140px' }} />
                            <Column field="email" header="Correo" style={{ minWidth: '200px' }} />
                            <Column header="Fecha ingreso" body={(rowData) => formatFechaIngreso(rowData.fechaIngreso)} style={{ minWidth: '140px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                {/* ========================================== */}
                {/* DIALOG: CREAR / EDITAR — Mismo patrón que Clientes */}
                {/* ========================================== */}
                <Dialog
                    visible={dialogVisible}
                    style={{ width: '800px', maxWidth: '95vw' }}
                    header={
                        <DialogHeader
                            title={interesado.id ? 'Editar Interesado' : 'Nuevo Interesado'}
                            subtitle={interesado.id ? 'Modificar datos del interesado' : 'Registrar un nuevo interesado'}
                            icon="pi pi-user-plus"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="formgrid grid dialog-content-specific">

                        {/* Tipo de documento */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="tipoDocumento">Tipo Documento</label>
                            <Dropdown
                                id="tipoDocumento"
                                value={interesado.tipoDocumento || 'DNI'}
                                options={[
                                    { label: 'DNI', value: 'DNI' },
                                    { label: 'Carnet de Extranjeria', value: 'CE' },
                                    { label: 'RUC', value: 'RUC' }
                                ]}
                                onChange={onTipoDocumentoChange}
                                placeholder="Seleccione tipo"
                                className="w-full"
                            />
                        </div>

                        {/* N° de documento + RENIEC */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="numeroDocumento">Documento</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="numeroDocumento"
                                    value={interesado.numeroDocumento}
                                    onChange={(e) => onInputChange(e, 'numeroDocumento')}
                                    required
                                    keyfilter="pint"
                                    maxLength={maxLengthDocumento(interesado.tipoDocumento)}
                                    placeholder={placeholderDocumento(interesado.tipoDocumento)}
                                    className={submitted && !interesado.numeroDocumento ? 'p-invalid' : ''}
                                />
                                <Button icon="pi pi-search" className="p-button-outlined" type="button" onClick={buscarDni} />
                            </div>
                            {submitted && !interesado.numeroDocumento && <small className="p-error">El documento es requerido.</small>}
                        </div>

                        {/* Nombres */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="nombres">Nombres</label>
                            <InputText
                                id="nombres"
                                value={interesado.nombres}
                                onChange={(e) => onInputChange(e, 'nombres')}
                                required
                                placeholder="Ingrese nombres"
                                className={submitted && !interesado.nombres ? 'p-invalid' : ''}
                            />
                            {submitted && !interesado.nombres && <small className="p-error">Los nombres son requeridos.</small>}
                        </div>

                        {/* Apellidos */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="apellidos">Apellidos</label>
                            <InputText
                                id="apellidos"
                                value={interesado.apellidos}
                                onChange={(e) => onInputChange(e, 'apellidos')}
                                required
                                placeholder="Ingrese apellidos"
                                className={submitted && !interesado.apellidos ? 'p-invalid' : ''}
                            />
                            {submitted && !interesado.apellidos && <small className="p-error">Los apellidos son requeridos.</small>}
                        </div>

                        {/* Email */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Correo Electrónico</label>
                            <InputText
                                id="email"
                                value={interesado.email}
                                onChange={(e) => onInputChange(e, 'email')}
                                placeholder="ejemplo@correo.com"
                            />
                        </div>

                        {/* Teléfono */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="telefono">Teléfono</label>
                            <InputText
                                id="telefono"
                                value={interesado.telefono}
                                onChange={(e) => onInputChange(e, 'telefono')}
                                required
                                placeholder="Ingrese teléfono"
                                className={submitted && !interesado.telefono ? 'p-invalid' : ''}
                            />
                            {submitted && !interesado.telefono && <small className="p-error">El teléfono es requerido.</small>}
                        </div>

                        {/* Departamento */}
                        <div className="field col-12 md:col-4">
                            <label htmlFor="departamento">Departamento</label>
                            <Dropdown
                                id="departamento"
                                value={interesado.departamento}
                                options={departamentos}
                                onChange={(e) => onDepartamentoChange(e.value)}
                                placeholder="Seleccione un departamento"
                                className="w-full"
                                filter
                                filterPlaceholder="Buscar departamento"
                                showClear
                            />
                        </div>

                        {/* Provincia */}
                        <div className="field col-12 md:col-4">
                            <label htmlFor="provincia">Provincia</label>
                            <Dropdown
                                id="provincia"
                                value={interesado.provincia}
                                options={provincias}
                                onChange={(e) => onProvinciaChange(e.value)}
                                placeholder="Seleccione una provincia"
                                className="w-full"
                                filter
                                filterPlaceholder="Buscar provincia"
                                showClear
                                disabled={!interesado.departamento}
                            />
                        </div>

                        {/* Distrito */}
                        <div className="field col-12 md:col-4">
                            <label htmlFor="distrito">Distrito</label>
                            <Dropdown
                                id="distrito"
                                value={interesado.distrito}
                                options={distritos}
                                onChange={(e) => onDistritoChange(e.value)}
                                placeholder="Seleccione un distrito"
                                className="w-full"
                                filter
                                filterPlaceholder="Buscar distrito"
                                showClear
                                disabled={!interesado.provincia}
                            />
                        </div>

                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Interesados;
