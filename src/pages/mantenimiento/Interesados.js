import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '../../components/ui/PageHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import '../Usuario.css';

const Interesados = () => {
    const emptyInteresado = { id: null, nombre: '', telefono: '', email: '', proyecto: '' };

    const [interesados, setInteresados] = useState([]);
    const [interesado, setInteresado] = useState(emptyInteresado);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedInteresados, setSelectedInteresados] = useState(null);

    const toast = useRef(null);
    const dt = useRef(null);

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

    const saveInteresado = () => {
        setSubmitted(true);
        if (!interesado.nombre || !interesado.telefono) {
            return;
        }

        let _list = [...interesados];
        if (interesado.id) {
            const index = _list.findIndex((c) => c.id === interesado.id);
            _list[index] = interesado;
            toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Interesado actualizado correctamente.', life: 3000 });
        } else {
            const id = new Date().getTime();
            _list.push({ ...interesado, id });
            toast.current.show({ severity: 'success', summary: 'Creado', detail: 'Interesado creado correctamente.', life: 3000 });
        }
        setInteresados(_list);
        setDialogVisible(false);
        setInteresado(emptyInteresado);
    };

    const editInteresado = (rowData) => {
        setInteresado({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
    };

    const confirmDeleteInteresado = (rowData) => {
        confirmDialog({
            message: `¿Eliminar al interesado "${rowData.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteInteresado(rowData)
        });
    };

    const deleteInteresado = (rowData) => {
        const _list = interesados.filter((c) => c.id !== rowData.id);
        setInteresados(_list);
        toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Interesado eliminado correctamente.', life: 3000 });
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

    const dialogFooter = (
        <div className="dialog-footer-buttons">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveInteresado} autoFocus />
        </div>
    );

    return (
        <div className="usuario-page">
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
                            globalFilterFields={['nombre', 'telefono', 'email', 'proyecto']}
                            emptyMessage="No se encontraron interesados."
                        >
                            <Column field="nombre" header="Nombre" style={{ minWidth: '200px' }} />
                            <Column field="telefono" header="Teléfono" style={{ minWidth: '140px' }} />
                            <Column field="email" header="Correo" style={{ minWidth: '200px' }} />
                            <Column field="proyecto" header="Proyecto" style={{ minWidth: '200px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '500px', maxWidth: '95vw' }}
                    header="Interesado"
                    modal
                    className="p-fluid user-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="field">
                        <label htmlFor="nombre">Nombre</label>
                        <InputText
                            id="nombre"
                            value={interesado.nombre}
                            onChange={(e) => onInputChange(e, 'nombre')}
                            required
                            className={submitted && !interesado.nombre ? 'p-invalid' : ''}
                        />
                        {submitted && !interesado.nombre && <small className="p-error">El nombre es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="telefono">Teléfono</label>
                        <InputText
                            id="telefono"
                            value={interesado.telefono}
                            onChange={(e) => onInputChange(e, 'telefono')}
                            required
                            className={submitted && !interesado.telefono ? 'p-invalid' : ''}
                        />
                        {submitted && !interesado.telefono && <small className="p-error">El teléfono es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="email">Correo Electrónico</label>
                        <InputText
                            id="email"
                            value={interesado.email}
                            onChange={(e) => onInputChange(e, 'email')}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="proyecto">Proyecto / Lote de interés</label>
                        <InputText
                            id="proyecto"
                            value={interesado.proyecto}
                            onChange={(e) => onInputChange(e, 'proyecto')}
                        />
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Interesados;
