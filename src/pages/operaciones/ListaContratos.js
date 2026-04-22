import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';

import './ListaContratos.css';

const ListaContratos = () => {
    const toast = useRef(null);
    const navigate = useNavigate();

    const [contratos, setContratos] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarContratos();
    }, []);

    const cargarContratos = () => {
        setLoading(true);
        // Simulamos la llamada al API: ContratoService.listarTodos()
        setTimeout(() => {
            setContratos([
                { 
                  id: 108, 
                  codigo: 'C-108',
                  cliente: { nombres: 'Juan', apellidos: 'Pérez', numeroDocumento: '72384732' }, 
                  lote: { descripcion: 'Mza A - Lote 15' }, 
                  precioTotal: 15500, 
                  totalPagado: 2500, 
                  estadoLote: 'SEPARADO',
                  fechaEmision: '10/03/2026',
                  progreso: 16
                },
                { 
                  id: 109, 
                  codigo: 'C-109',
                  cliente: { nombres: 'Ana', apellidos: 'Silva', numeroDocumento: '45678912' }, 
                  lote: { descripcion: 'Mza B - Lote 02' }, 
                  precioTotal: 25000, 
                  totalPagado: 25000, 
                  estadoLote: 'VENDIDO',
                  fechaEmision: '15/01/2026',
                  progreso: 100
                },
                { 
                  id: 110, 
                  codigo: 'C-110',
                  cliente: { nombres: 'Carlos', apellidos: 'Ruiz', numeroDocumento: '12345678' }, 
                  lote: { descripcion: 'Mza C - Lote 05' }, 
                  precioTotal: 18000, 
                  totalPagado: 3000, 
                  estadoLote: 'SEPARADO',
                  fechaEmision: '05/04/2026',
                  progreso: 16
                }
            ]);
            setLoading(false);
        }, 800);
    };

    const verDetalle = (contrato) => {
        navigate(`/detalle_contrato/${contrato.id}`);
    };

    // ==========================================
    // TEMPLATES DEL MAESTRO (CONTRATOS)
    // ==========================================
    const renderHeader = () => {
        return (
            <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
                <div className="p-inputgroup max-w-20rem">
                    <span className="p-inputgroup-addon"><i className="pi pi-search" /></span>
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar por DNI o Contrato..." />
                </div>
                <Button label="Exportar Listado" icon="pi pi-file-excel" className="p-button-outlined p-button-secondary p-button-sm" />
            </div>
        );
    };

    const clienteTemplate = (rowData) => (
        <div>
            <span className="font-bold text-800">{rowData.cliente.nombres} {rowData.cliente.apellidos}</span><br/>
            <span className="text-xs text-500">DNI: {rowData.cliente.numeroDocumento}</span>
        </div>
    );

    const progresoTemplate = (rowData) => {
        return (
            <div className="flex align-items-center justify-content-center">
                <span className="text-xs font-bold mr-2 w-2rem text-right">{rowData.progreso}%</span>
                <ProgressBar value={rowData.progreso} displayValueTemplate={() => ''} style={{ height: '6px', width: '80px' }} color={rowData.progreso === 100 ? 'var(--green-500)' : 'var(--blue-500)'}></ProgressBar>
            </div>
        );
    };

    const estadoLoteTemplate = (rowData) => <Tag severity={rowData.estadoLote === 'VENDIDO' ? 'success' : 'warning'} value={rowData.estadoLote} />;

    const accionesTemplate = (rowData) => (
        <Button label="Ver Detalle" icon="pi pi-eye" className="p-button-outlined p-button-sm font-bold" onClick={() => verDetalle(rowData)} />
    );

    return (
        <div className="listacontratos-page">
            <Toast ref={toast} />
            <PageHeader title="Contratos Emitidos" subtitle="Búsqueda y seguimiento detallado de ventas" icon="pi pi-folder-open" />

            <div className="main-content pt-3">
                <div className="card surface-card border-round shadow-1 p-0 overflow-hidden">
                    <DataTable 
                        value={contratos} 
                        header={renderHeader()} 
                        globalFilter={globalFilter} 
                        emptyMessage="No se encontraron contratos."
                        paginator rows={10}
                        loading={loading}
                        className="p-datatable-sm custom-master-table"
                        stripedRows
                    >
                        <Column field="codigo" header="ID Contrato" style={{ minWidth: '120px', fontWeight: 'bold', color: 'var(--primary-color)' }} />
                        <Column header="Cliente" body={clienteTemplate} style={{ minWidth: '220px' }} />
                        <Column field="lote.descripcion" header="Lote Asignado" style={{ minWidth: '180px' }} />
                        <Column header="Precio Total" body={(row) => <span className="font-bold">S/ {row.precioTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span>} style={{ minWidth: '120px', textAlign: 'right' }} />
                        <Column header="Progreso" body={progresoTemplate} style={{ minWidth: '150px', textAlign: 'center' }} />
                        <Column header="Estado Lote" body={estadoLoteTemplate} style={{ minWidth: '120px', textAlign: 'center' }} />
                        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ListaContratos;