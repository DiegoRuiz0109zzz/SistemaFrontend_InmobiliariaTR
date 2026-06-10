import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputSwitch } from 'primereact/inputswitch';
import PageHeader from '../../components/ui/PageHeader';
import DialogHeader from '../../components/ui/DialogHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import { useAuth } from '../../context/AuthContext';
import { SerieEntity } from '../../entity/SerieEntity';
import { TipoComprobanteOptions } from '../../entity/TipoComprobante';
import { SerieService } from '../../service/SerieService';
import '../Usuario.css';
import './Series.css';

const Series = () => {
    const { axiosInstance } = useAuth();
    const emptySerie = { ...SerieEntity };

    const [series, setSeries] = useState([]);
    const [serie, setSerie] = useState(emptySerie);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [saving, setSaving] = useState(false);

    const toast = useRef(null);
    const dt = useRef(null);

    // ==========================================
    // CARGA DE DATOS
    // ==========================================
    const cargarSeries = useCallback(async () => {
        try {
            const response = await SerieService.listar(axiosInstance);
            setSeries(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar las series.', life: 3500 });
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarSeries();
    }, [cargarSeries]);

    // ==========================================
    // DIALOG: ABRIR / CERRAR
    // ==========================================
    const openNew = () => {
        setSerie(emptySerie);
        setSubmitted(false);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setSubmitted(false);
    };

    const editSerie = (rowData) => {
        setSerie({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
    };

    // ==========================================
    // HANDLERS DE CAMBIO
    // ==========================================
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value !== undefined) ? e.target.value : '';
        setSerie((prev) => ({ ...prev, [name]: val }));
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        setSerie((prev) => ({ ...prev, [name]: val }));
    };

    const onSwitchChange = async (e, rowData) => {
        try {
            await SerieService.toggleActivo(rowData.id, e.value, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado correctamente.', life: 3000 });
            cargarSeries();
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.', life: 3500 });
        }
    };

    // ==========================================
    // HELPERS
    // ==========================================
    const normalizeText = (value) => (value || '').trim();

    // ==========================================
    // GUARDAR
    // ==========================================
    const saveSerie = async () => {
        setSubmitted(true);

        const serieNormalizada = normalizeText(serie.serie);

        if (!serie.tipoComprobante || !serieNormalizada || serie.ultimoCorrelativo === null || serie.ultimoCorrelativo === undefined) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Por favor, complete los campos obligatorios.', life: 3000 });
            return;
        }

        const payload = {
            ...serie,
            serie: serieNormalizada
        };

        setSaving(true);
        try {
            if (serie.id) {
                await SerieService.actualizar(serie.id, payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Serie actualizada correctamente.', life: 3000 });
            } else {
                await SerieService.crear(payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Serie creada correctamente.', life: 3000 });
            }
            await cargarSeries();
            setDialogVisible(false);
            setSerie(emptySerie);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la serie.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // ELIMINAR
    // ==========================================
    const confirmDeleteSerie = (rowData) => {
        confirmDialog({
            message: `¿Eliminar la serie "${rowData.serie}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteSerie(rowData)
        });
    };

    const deleteSerie = async (rowData) => {
        try {
            await SerieService.eliminar(rowData.id, axiosInstance);
            await cargarSeries();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Serie eliminada correctamente.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar la serie.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const exportCSV = () => { if (dt.current) dt.current.exportCSV(); };

    // ==========================================
    // TEMPLATES DE TABLA
    // ==========================================
    const actionBodyTemplate = (rowData) => (
        <div className="action-buttons">
            <Button icon="pi pi-pencil" className="btn-edit" onClick={() => editSerie(rowData)} tooltip="Editar" />
            <Button icon="pi pi-trash" className="btn-delete" onClick={() => confirmDeleteSerie(rowData)} tooltip="Eliminar" />
        </div>
    );

    const indexBodyTemplate = (_, options) => (options.rowIndex ?? 0) + 1;

    const activoBodyTemplate = (rowData) => (
        <InputSwitch checked={rowData.activo} onChange={(e) => onSwitchChange(e, rowData)} />
    );
    
    const estadoBodyTemplate = (rowData) => (
        <span className={`status-badge status-${rowData.activo ? 'active' : 'inactive'}`}>
            {rowData.activo ? 'ACTIVO' : 'INACTIVO'}
        </span>
    );

    const dialogFooter = (
        <div className="dialog-footer-buttons">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveSerie} autoFocus loading={saving} />
        </div>
    );

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="usuario-page series-page">
            <div className="container">
                <PageHeader
                    title="Series de Comprobantes"
                    description="Administra las series y correlativos de los comprobantes de pago."
                    icon="pi pi-book"
                />

                <div className="main-content">
                    <div className="content-card">
                        <ConfirmDialog />
                        <Toast ref={toast} />

                        <ActionToolbar
                            onNew={openNew}
                            newLabel="Nueva Serie"
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar serie..."
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
                            value={series}
                            selection={selectedSeries}
                            onSelectionChange={(e) => setSelectedSeries(e.value)}
                            dataKey="id"
                            paginator
                            rows={10}
                            globalFilter={globalFilter}
                            globalFilterFields={['id', 'serie', 'tipoComprobante']}
                            emptyMessage="No se encontraron series."
                            exportFilename="Series_Comprobantes"
                        >
                            <Column header="N°" body={indexBodyTemplate} style={{ width: '80px', textAlign: 'center' }} />
                            <Column field="id" header="ID" style={{ width: '80px', textAlign: 'center' }} />
                            <Column field="tipoComprobante" header="Tipo Comprobante" style={{ minWidth: '150px' }} sortable />
                            <Column field="serie" header="Serie" style={{ minWidth: '150px' }} sortable />
                            <Column field="ultimoCorrelativo" header="Último Correlativo" style={{ minWidth: '150px' }} sortable />
                            <Column header="Estado" body={estadoBodyTemplate} style={{ minWidth: '120px' }} sortable field="activo" />
                            <Column header="Activo" body={activoBodyTemplate} style={{ minWidth: '100px', textAlign: 'center' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                {/* ========================================== */}
                {/* DIALOG: CREAR / EDITAR */}
                {/* ========================================== */}
                <Dialog
                    visible={dialogVisible}
                    style={{ width: '500px', maxWidth: '95vw' }}
                    header={
                        <DialogHeader
                            title={serie.id ? 'Editar Serie' : 'Nueva Serie'}
                            subtitle={serie.id ? 'Modificar datos de la serie' : 'Registrar una nueva serie de comprobantes'}
                            icon="pi pi-book"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="formgrid grid dialog-content-specific">
                        
                        {/* Tipo de Comprobante */}
                        <div className="field col-12">
                            <label htmlFor="tipoComprobante">Tipo de Comprobante <span className="text-red-500">*</span></label>
                            <Dropdown
                                id="tipoComprobante"
                                value={serie.tipoComprobante}
                                options={TipoComprobanteOptions}
                                onChange={(e) => onInputChange(e, 'tipoComprobante')}
                                placeholder="Seleccione un tipo"
                                className={submitted && !serie.tipoComprobante ? 'p-invalid' : ''}
                            />
                            {submitted && !serie.tipoComprobante && <small className="p-error">El tipo de comprobante es requerido.</small>}
                        </div>

                        {/* Serie */}
                        <div className="field col-12">
                            <label htmlFor="serie">Código de Serie <span className="text-red-500">*</span></label>
                            <InputText
                                id="serie"
                                value={serie.serie}
                                onChange={(e) => onInputChange(e, 'serie')}
                                required
                                placeholder="Ej: F001, B001, NV01"
                                maxLength={10}
                                className={submitted && !serie.serie ? 'p-invalid' : ''}
                            />
                            {submitted && !serie.serie && <small className="p-error">El código de serie es requerido.</small>}
                        </div>

                        {/* Último Correlativo */}
                        <div className="field col-12">
                            <label htmlFor="ultimoCorrelativo">Último Correlativo <span className="text-red-500">*</span></label>
                            <InputNumber
                                id="ultimoCorrelativo"
                                value={serie.ultimoCorrelativo}
                                onValueChange={(e) => onInputNumberChange(e, 'ultimoCorrelativo')}
                                min={0}
                                placeholder="Ej: 0"
                                className={submitted && (serie.ultimoCorrelativo === null || serie.ultimoCorrelativo === undefined) ? 'p-invalid' : ''}
                            />
                            {submitted && (serie.ultimoCorrelativo === null || serie.ultimoCorrelativo === undefined) && <small className="p-error">El correlativo inicial/último es requerido.</small>}
                        </div>

                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Series;
