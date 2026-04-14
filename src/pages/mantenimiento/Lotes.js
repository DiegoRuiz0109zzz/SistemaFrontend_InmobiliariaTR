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

const Lotes = () => {
    const emptyLote = { id: null, codigo: '', proyecto: '', manzana: '', lote: '', estado: '' };

    const [lotes, setLotes] = useState([]);
    const [lote, setLote] = useState(emptyLote);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedLotes, setSelectedLotes] = useState(null);

    const toast = useRef(null);
    const dt = useRef(null);

    const openNew = () => {
        setLote(emptyLote);
        setSubmitted(false);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setSubmitted(false);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setLote((prev) => ({ ...prev, [name]: val }));
    };

    const saveLote = () => {
        setSubmitted(true);
        if (!lote.codigo || !lote.proyecto) {
            return;
        }

        let _list = [...lotes];
        if (lote.id) {
            const index = _list.findIndex((c) => c.id === lote.id);
            _list[index] = lote;
            toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Lote actualizado correctamente.', life: 3000 });
        } else {
            const id = new Date().getTime();
            _list.push({ ...lote, id });
            toast.current.show({ severity: 'success', summary: 'Creado', detail: 'Lote creado correctamente.', life: 3000 });
        }
        setLotes(_list);
        setDialogVisible(false);
        setLote(emptyLote);
    };

    const editLote = (rowData) => {
        setLote({ ...rowData });
        setSubmitted(false);
        setDialogVisible(true);
    };

    const confirmDeleteLote = (rowData) => {
        confirmDialog({
            message: `¿Eliminar el lote "${rowData.codigo}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            accept: () => deleteLote(rowData)
        });
    };

    const deleteLote = (rowData) => {
        const _list = lotes.filter((c) => c.id !== rowData.id);
        setLotes(_list);
        toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Lote eliminado correctamente.', life: 3000 });
    };

    const exportCSV = () => {
        if (dt.current) {
            dt.current.exportCSV();
        }
    };

    const actionBodyTemplate = (rowData) => (
        <div className="action-buttons">
            <Button icon="pi pi-pencil" className="btn-edit" onClick={() => editLote(rowData)} tooltip="Editar" />
            <Button icon="pi pi-trash" className="btn-delete" onClick={() => confirmDeleteLote(rowData)} tooltip="Eliminar" />
        </div>
    );

    const dialogFooter = (
        <div className="dialog-footer-buttons">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveLote} autoFocus />
        </div>
    );

    return (
        <div className="usuario-page">
            <div className="container">
                <PageHeader
                    title="Lotes / Terrenos"
                    description="Administra los lotes y terrenos disponibles."
                    icon="pi pi-map"
                />

                <div className="main-content">
                    <div className="content-card">
                        <ConfirmDialog />
                        <Toast ref={toast} />

                        <ActionToolbar
                            onNew={openNew}
                            newLabel="Nuevo Lote"
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar lotes..."
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
                            value={lotes}
                            selection={selectedLotes}
                            onSelectionChange={(e) => setSelectedLotes(e.value)}
                            dataKey="id"
                            paginator
                            rows={10}
                            globalFilter={globalFilter}
                            globalFilterFields={['codigo', 'proyecto', 'manzana', 'lote', 'estado']}
                            emptyMessage="No se encontraron lotes."
                        >
                            <Column field="codigo" header="Código" style={{ minWidth: '120px' }} />
                            <Column field="proyecto" header="Proyecto" style={{ minWidth: '200px' }} />
                            <Column field="manzana" header="Manzana" style={{ minWidth: '100px' }} />
                            <Column field="lote" header="Lote" style={{ minWidth: '100px' }} />
                            <Column field="estado" header="Estado" style={{ minWidth: '140px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '520px', maxWidth: '95vw' }}
                    header="Lote / Terreno"
                    modal
                    className="p-fluid user-dialog"
                    footer={dialogFooter}
                    onHide={hideDialog}
                >
                    <div className="field">
                        <label htmlFor="codigo">Código</label>
                        <InputText
                            id="codigo"
                            value={lote.codigo}
                            onChange={(e) => onInputChange(e, 'codigo')}
                            required
                            className={submitted && !lote.codigo ? 'p-invalid' : ''}
                        />
                        {submitted && !lote.codigo && <small className="p-error">El código es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="proyecto">Proyecto</label>
                        <InputText
                            id="proyecto"
                            value={lote.proyecto}
                            onChange={(e) => onInputChange(e, 'proyecto')}
                            required
                            className={submitted && !lote.proyecto ? 'p-invalid' : ''}
                        />
                        {submitted && !lote.proyecto && <small className="p-error">El proyecto es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="manzana">Manzana</label>
                        <InputText
                            id="manzana"
                            value={lote.manzana}
                            onChange={(e) => onInputChange(e, 'manzana')}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="lote">Lote</label>
                        <InputText
                            id="lote"
                            value={lote.lote}
                            onChange={(e) => onInputChange(e, 'lote')}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="estado">Estado</label>
                        <InputText
                            id="estado"
                            value={lote.estado}
                            onChange={(e) => onInputChange(e, 'estado')}
                            placeholder="Disponible, Reservado, Vendido, etc."
                        />
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Lotes;
