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

const Clientes = () => {
    const emptyCliente = { id: null, nombre: '', documento: '', telefono: '', email: '' };

    const [clientes, setClientes] = useState([]);
    const [cliente, setCliente] = useState(emptyCliente);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedClientes, setSelectedClientes] = useState(null);

    const toast = useRef(null);
    const dt = useRef(null);

    const openNew = () => {
        setCliente(emptyCliente);
        setSubmitted(false);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setSubmitted(false);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setCliente((prev) => ({ ...prev, [name]: val }));
    };

    const saveCliente = () => {
        setSubmitted(true);
        if (!cliente.nombre || !cliente.documento) {
            return;
        }

        let _clientes = [...clientes];
        if (cliente.id) {
            const index = _clientes.findIndex((c) => c.id === cliente.id);
            _clientes[index] = cliente;
            toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Cliente actualizado correctamente.', life: 3000 });
        } else {
            const id = new Date().getTime();
            _clientes.push({ ...cliente, id });
            toast.current.show({ severity: 'success', summary: 'Creado', detail: 'Cliente creado correctamente.', life: 3000 });
        }
        setClientes(_clientes);
        setDialogVisible(false);
        setCliente(emptyCliente);
    };

    const editCliente = (rowData) => {
        setCliente({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
    };

    const confirmDeleteCliente = (rowData) => {
        confirmDialog({
            message: `¿Eliminar al cliente "${rowData.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteCliente(rowData)
        });
    };

    const deleteCliente = (rowData) => {
        const _clientes = clientes.filter((c) => c.id !== rowData.id);
        setClientes(_clientes);
        toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Cliente eliminado correctamente.', life: 3000 });
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
            <Button label="Guardar" icon="pi pi-check" onClick={saveCliente} autoFocus />
        </div>
    );

    return (
        <div className="usuario-page">
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
                            globalFilterFields={['nombre', 'documento', 'telefono', 'email']}
                            emptyMessage="No se encontraron clientes."
                        >
                            <Column field="documento" header="Documento" style={{ minWidth: '120px' }} />
                            <Column field="nombre" header="Nombre Completo" style={{ minWidth: '220px' }} />
                            <Column field="telefono" header="Teléfono" style={{ minWidth: '140px' }} />
                            <Column field="email" header="Correo" style={{ minWidth: '200px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '500px', maxWidth: '95vw' }}
                    header="Cliente"
                    modal
                    className="p-fluid user-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="field">
                        <label htmlFor="nombre">Nombre Completo</label>
                        <InputText
                            id="nombre"
                            value={cliente.nombre}
                            onChange={(e) => onInputChange(e, 'nombre')}
                            required
                            className={submitted && !cliente.nombre ? 'p-invalid' : ''}
                        />
                        {submitted && !cliente.nombre && <small className="p-error">El nombre es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="documento">Documento</label>
                        <InputText
                            id="documento"
                            value={cliente.documento}
                            onChange={(e) => onInputChange(e, 'documento')}
                            required
                            className={submitted && !cliente.documento ? 'p-invalid' : ''}
                        />
                        {submitted && !cliente.documento && <small className="p-error">El documento es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="telefono">Teléfono</label>
                        <InputText
                            id="telefono"
                            value={cliente.telefono}
                            onChange={(e) => onInputChange(e, 'telefono')}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="email">Correo Electrónico</label>
                        <InputText
                            id="email"
                            value={cliente.email}
                            onChange={(e) => onInputChange(e, 'email')}
                        />
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Clientes;
