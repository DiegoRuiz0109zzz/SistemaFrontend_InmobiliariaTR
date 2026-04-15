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

const Vendedores = () => {
    const emptyVendedor = { id: null, nombre: '', codigo: '', telefono: '', email: '' };

    const [vendedores, setVendedores] = useState([]);
    const [vendedor, setVendedor] = useState(emptyVendedor);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedVendedores, setSelectedVendedores] = useState(null);

    const toast = useRef(null);
    const dt = useRef(null);

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

    const saveVendedor = () => {
        setSubmitted(true);
        if (!vendedor.nombre || !vendedor.codigo) {
            return;
        }

        let _list = [...vendedores];
        if (vendedor.id) {
            const index = _list.findIndex((c) => c.id === vendedor.id);
            _list[index] = vendedor;
            toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Vendedor actualizado correctamente.', life: 3000 });
        } else {
            const id = new Date().getTime();
            _list.push({ ...vendedor, id });
            toast.current.show({ severity: 'success', summary: 'Creado', detail: 'Vendedor creado correctamente.', life: 3000 });
        }
        setVendedores(_list);
        setDialogVisible(false);
        setVendedor(emptyVendedor);
    };

    const editVendedor = (rowData) => {
        setVendedor({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
    };

    const confirmDeleteVendedor = (rowData) => {
        confirmDialog({
            message: `¿Eliminar al vendedor "${rowData.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteVendedor(rowData)
        });
    };

    const deleteVendedor = (rowData) => {
        const _list = vendedores.filter((c) => c.id !== rowData.id);
        setVendedores(_list);
        toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Vendedor eliminado correctamente.', life: 3000 });
    };

    const exportCSV = () => {
        if (dt.current) {
            dt.current.exportCSV();
        }
    };

    const actionBodyTemplate = (rowData) => (
        <div className="action-buttons">
            <Button icon="pi pi-pencil" className="btn-edit" onClick={() => editVendedor(rowData)} tooltip="Editar" />
            <Button icon="pi pi-trash" className="btn-delete" onClick={() => confirmDeleteVendedor(rowData)} tooltip="Eliminar" />
        </div>
    );

    const dialogFooter = (
        <div className="dialog-footer-buttons">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveVendedor} autoFocus />
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
                            globalFilterFields={['nombre', 'codigo', 'telefono', 'email']}
                            emptyMessage="No se encontraron vendedores."
                        >
                            <Column field="codigo" header="Código" style={{ minWidth: '120px' }} />
                            <Column field="nombre" header="Nombre" style={{ minWidth: '220px' }} />
                            <Column field="telefono" header="Teléfono" style={{ minWidth: '140px' }} />
                            <Column field="email" header="Correo" style={{ minWidth: '200px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '500px', maxWidth: '95vw' }}
                    header="Vendedor"
                    modal
                    className="p-fluid user-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="field">
                        <label htmlFor="codigo">Código</label>
                        <InputText
                            id="codigo"
                            value={vendedor.codigo}
                            onChange={(e) => onInputChange(e, 'codigo')}
                            required
                            className={submitted && !vendedor.codigo ? 'p-invalid' : ''}
                        />
                        {submitted && !vendedor.codigo && <small className="p-error">El código es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="nombre">Nombre</label>
                        <InputText
                            id="nombre"
                            value={vendedor.nombre}
                            onChange={(e) => onInputChange(e, 'nombre')}
                            required
                            className={submitted && !vendedor.nombre ? 'p-invalid' : ''}
                        />
                        {submitted && !vendedor.nombre && <small className="p-error">El nombre es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="telefono">Teléfono</label>
                        <InputText
                            id="telefono"
                            value={vendedor.telefono}
                            onChange={(e) => onInputChange(e, 'telefono')}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="email">Correo Electrónico</label>
                        <InputText
                            id="email"
                            value={vendedor.email}
                            onChange={(e) => onInputChange(e, 'email')}
                        />
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Vendedores;
