import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '../../components/ui/PageHeader';
import DialogHeader from '../../components/ui/DialogHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import { useAuth } from '../../context/AuthContext';
import { VendedorEntity } from '../../entity/VendedorEntity';
import { VendedorService } from '../../service/VendedorService';
import '../Usuario.css';

const Vendedores = () => {
    const { axiosInstance } = useAuth();
    const emptyVendedor = { ...VendedorEntity };

    const [vendedores, setVendedores] = useState([]);
    const [vendedor, setVendedor] = useState(emptyVendedor);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedVendedores, setSelectedVendedores] = useState(null);
    const [saving, setSaving] = useState(false);

    const toast = useRef(null);
    const dt = useRef(null);

    const cargarVendedores = useCallback(async () => {
        try {
            const response = await VendedorService.listar(axiosInstance);
            setVendedores(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los vendedores.', life: 3500 });
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarVendedores();
    }, [cargarVendedores]);

    const openNew = () => {
        setVendedor(emptyVendedor);
        setSubmitted(false);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setSubmitted(false);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setVendedor((prev) => ({ ...prev, [name]: val }));
    };

    const normalizeText = (value) => (value || '').trim();

    const saveVendedor = async () => {
        setSubmitted(true);
        if (!vendedor.numeroDocumento || !vendedor.nombres) {
            return;
        }

        const payload = {
            ...vendedor,
            numeroDocumento: normalizeText(vendedor.numeroDocumento),
            nombres: normalizeText(vendedor.nombres),
            apellidos: normalizeText(vendedor.apellidos),
            telefono: normalizeText(vendedor.telefono),
            email: normalizeText(vendedor.email)
        };

        setSaving(true);
        try {
            if (vendedor.id) {
                await VendedorService.actualizar(vendedor.id, payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Vendedor actualizado correctamente.', life: 3000 });
            } else {
                await VendedorService.crear(payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Vendedor creado correctamente.', life: 3000 });
            }
            await cargarVendedores();
            setDialogVisible(false);
            setVendedor(emptyVendedor);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar el vendedor.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        } finally {
            setSaving(false);
        }
    };

    const editVendedor = (rowData) => {
        setVendedor({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
    };

    const confirmDeleteVendedor = (rowData) => {
        const nombreCompleto = `${rowData.nombres || ''} ${rowData.apellidos || ''}`.trim();
        confirmDialog({
            message: `¿Eliminar al vendedor "${nombreCompleto || 'sin nombre'}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteVendedor(rowData)
        });
    };

    const deleteVendedor = async (rowData) => {
        try {
            await VendedorService.eliminar(rowData.id, axiosInstance);
            await cargarVendedores();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Vendedor eliminado correctamente.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar el vendedor.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const exportCSV = () => {
        if (dt.current) {
            dt.current.exportCSV();
        }
    };

    const indexBodyTemplate = (_, options) => (options.rowIndex ?? 0) + 1;

    const actionBodyTemplate = (rowData) => (
        <div className="action-buttons">
            <Button icon="pi pi-pencil" className="btn-edit" onClick={() => editVendedor(rowData)} tooltip="Editar" />
            <Button icon="pi pi-trash" className="btn-delete" onClick={() => confirmDeleteVendedor(rowData)} tooltip="Eliminar" />
        </div>
    );

    const dialogFooter = (
        <div className="dialog-footer-buttons">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveVendedor} autoFocus loading={saving} />
        </div>
    );

    return (
        <div className="usuario-page">
            <div className="container">
                <PageHeader
                    title="Vendedores"
                    description="Administra los vendedores y asesores comerciales."
                    icon="pi pi-id-card"
                />

                <div className="main-content">
                    <div className="content-card">
                        <ConfirmDialog />
                        <Toast ref={toast} />

                        <ActionToolbar
                            onNew={openNew}
                            newLabel="Nuevo Vendedor"
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar vendedores..."
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
                            value={vendedores}
                            selection={selectedVendedores}
                            onSelectionChange={(e) => setSelectedVendedores(e.value)}
                            dataKey="id"
                            paginator
                            rows={10}
                            globalFilter={globalFilter}
                            globalFilterFields={['numeroDocumento', 'nombres', 'apellidos', 'telefono', 'email']}
                            emptyMessage="No se encontraron vendedores."
                        >
                            <Column header="N°" body={indexBodyTemplate} style={{ width: '80px', textAlign: 'center' }} />
                            <Column field="numeroDocumento" header="Documento" style={{ minWidth: '140px' }} />
                            <Column field="nombres" header="Nombres" style={{ minWidth: '180px' }} />
                            <Column field="apellidos" header="Apellidos" style={{ minWidth: '180px' }} />
                            <Column field="telefono" header="Teléfono" style={{ minWidth: '140px' }} />
                            <Column field="email" header="Correo" style={{ minWidth: '200px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '600px', maxWidth: '95vw' }}
                    header={
                        <DialogHeader
                            title={vendedor.id ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                            subtitle={vendedor.id ? 'Modificar datos del vendedor' : 'Registrar un nuevo vendedor'}
                            icon="pi pi-id-card"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="formgrid grid dialog-content-specific">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="numeroDocumento">Documento</label>
                            <InputText
                                id="numeroDocumento"
                                value={vendedor.numeroDocumento}
                                onChange={(e) => onInputChange(e, 'numeroDocumento')}
                                required
                                placeholder="Ingrese documento"
                                className={submitted && !vendedor.numeroDocumento ? 'p-invalid' : ''}
                            />
                            {submitted && !vendedor.numeroDocumento && <small className="p-error">El documento es requerido.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="telefono">Teléfono</label>
                            <InputText
                                id="telefono"
                                value={vendedor.telefono}
                                onChange={(e) => onInputChange(e, 'telefono')}
                                placeholder="Ingrese teléfono"
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="nombres">Nombres</label>
                            <InputText
                                id="nombres"
                                value={vendedor.nombres}
                                onChange={(e) => onInputChange(e, 'nombres')}
                                required
                                placeholder="Ingrese nombres"
                                className={submitted && !vendedor.nombres ? 'p-invalid' : ''}
                            />
                            {submitted && !vendedor.nombres && <small className="p-error">Los nombres son requeridos.</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="apellidos">Apellidos</label>
                            <InputText
                                id="apellidos"
                                value={vendedor.apellidos}
                                onChange={(e) => onInputChange(e, 'apellidos')}
                                placeholder="Ingrese apellidos"
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Correo Electrónico</label>
                            <InputText
                                id="email"
                                value={vendedor.email}
                                onChange={(e) => onInputChange(e, 'email')}
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Vendedores;
