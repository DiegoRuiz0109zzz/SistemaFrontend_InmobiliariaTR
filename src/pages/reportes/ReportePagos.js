import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';
import '../Usuario.css';

const mockClientesPagos = [
    { contratoId: 101, cliente: 'Ana Lopez', lote: 'Mz B Lt 3', precioTotal: 15000, totalPagado: 5000, saldoRestante: 10000, progreso: 33 },
    { contratoId: 102, cliente: 'Luis Mendoza', lote: 'Mz A Lt 15', precioTotal: 25000, totalPagado: 25000, saldoRestante: 0, progreso: 100 },
    { contratoId: 103, cliente: 'Sofia Castro', lote: 'Mz C Lt 8', precioTotal: 12000, totalPagado: 1200, saldoRestante: 10800, progreso: 10 }
];

const ReportePagos = () => {
    const toast = useRef(null);

    const [filtroBuscarCliente, setFiltroBuscarCliente] = useState('');
    const [filtroEstadoContrato, setFiltroEstadoContrato] = useState(null);

    const estadosContrato = [
        { label: 'ACTIVO', value: 'ACTIVO' }, 
        { label: 'FINALIZADO', value: 'FINALIZADO' }, 
        { label: 'RESOLUCIÓN', value: 'RESOLUCION' }
    ];

    const formatCurrency = (value) => {
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const progresoPagoTemplate = (rowData) => {
        return (
            <div className="flex align-items-center">
                <div className="w-full mr-2">
                    <ProgressBar value={rowData.progreso} displayValueTemplate={() => ''} style={{ height: '8px' }} color={rowData.progreso === 100 ? 'var(--green-500)' : 'var(--blue-500)'} />
                </div>
                <span className="text-xs font-bold w-3rem text-right">{rowData.progreso}%</span>
            </div>
        );
    };

    return (
        <div className="usuario-page reporte-pagos-page">
            <div className="container">
                <PageHeader
                    title="Reporte de Pagos Efectuados"
                    description="Visualiza el estado y progreso de los pagos de todos los clientes."
                    icon="pi pi-money-bill"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <div className="p-4 mb-4 border-round-xl border-1 surface-border bg-white mt-3">
                            <h3 className="text-lg font-bold mb-4 mt-0" style={{ color: 'var(--text-primary)' }}>Filtros de Búsqueda</h3>
                            <div className="formgrid grid">
                                <div className="field col-12 md:col-6">
                                    <label className="font-bold text-sm block mb-2 text-700">Buscar Cliente</label>
                                    <div className="p-inputgroup">
                                        <InputText value={filtroBuscarCliente} onChange={(e) => setFiltroBuscarCliente(e.target.value)} placeholder="Buscar por DNI o Nombres..." />
                                        <Button icon="pi pi-search" className="p-button-primary" />
                                    </div>
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label className="font-bold text-sm block mb-2 text-700">Estado de Contrato</label>
                                    <Dropdown value={filtroEstadoContrato} options={estadosContrato} onChange={(e) => setFiltroEstadoContrato(e.value)} placeholder="Estado de Contrato" className="w-full" showClear />
                                </div>
                            </div>
                        </div>

                        <DataTable value={mockClientesPagos} paginator rows={10} className="p-datatable-sm shadow-1 border-round-lg overflow-hidden" emptyMessage="No se encontraron clientes.">
                            <Column field="contratoId" header="Contrato" sortable body={(r) => <span className="font-bold">C-{r.contratoId}</span>}></Column>
                            <Column field="cliente" header="Cliente" sortable></Column>
                            <Column field="lote" header="Lote"></Column>
                            <Column field="precioTotal" header="Precio Total" body={(r) => formatCurrency(r.precioTotal)} sortable></Column>
                            <Column field="totalPagado" header="Pagado" body={(r) => <span className="text-green-700 font-bold">{formatCurrency(r.totalPagado)}</span>} sortable></Column>
                            <Column field="saldoRestante" header="Saldo Restante" body={(r) => <span className="text-orange-600 font-bold">{formatCurrency(r.saldoRestante)}</span>}></Column>
                            <Column header="Progreso" body={progresoPagoTemplate} style={{ width: '20%' }} sortable field="progreso"></Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportePagos;
