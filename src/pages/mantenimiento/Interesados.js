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
import { InteresadoEntity } from '../../entity/InteresadoEntity';
import { InteresadoService } from '../../service/InteresadoService';
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

    const toast = useRef(null);
    const dt = useRef(null);

    const cargarInteresados = useCallback(async () => {
        try {
            const response = await InteresadoService.listar(axiosInstance);
            setInteresados(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los interesados.', life: 3500 });
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarInteresados();
    }, [cargarInteresados]);

    const openNew = () => {
        setInteresado(emptyInteresado);
        setSubmitted(false);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setSubmitted(false);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setInteresado((prev) => ({ ...prev, [name]: val }));
    };

    const normalizeText = (value) => (value || '').trim();

    const saveInteresado = async () => {
        setSubmitted(true);

        const nombres = normalizeText(interesado.nombres);
        const apellidos = normalizeText(interesado.apellidos);
        const telefono = normalizeText(interesado.telefono);

        if (!nombres || !apellidos || !telefono) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'Nombres, apellidos y telefono son obligatorios.', life: 3000 });
            return;
        }

        const payload = {
            ...interesado,
            nombres,
            apellidos,
            telefono,
            email: normalizeText(interesado.email)
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

    const editInteresado = (rowData) => {
        setInteresado({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
    };

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

    const exportCSV = () => {
        if (dt.current) {
            dt.current.exportCSV();
        }
    };

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
                            globalFilterFields={['nombres', 'apellidos', 'telefono', 'email']}
                            emptyMessage="No se encontraron interesados."
                        >
                            <Column header="N°" body={indexBodyTemplate} style={{ width: '80px', textAlign: 'center' }} />
                            <Column field="nombres" header="Nombres" style={{ minWidth: '200px' }} />
                            <Column field="apellidos" header="Apellidos" style={{ minWidth: '200px' }} />
                            <Column field="telefono" header="Teléfono" style={{ minWidth: '140px' }} />
                            <Column field="email" header="Correo" style={{ minWidth: '200px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

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
                    <div className="formgrid grid mt-4 dialog-content-specific">
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

                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Correo Electrónico</label>
                            <InputText
                                id="email"
                                value={interesado.email}
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

export default Interesados;
