import React, { useState, useRef } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';

// ==========================================
// MOCK DATA
// ==========================================
const mockLeads = [
    { id: 1, fecha: '2026-05-01', documento: '70820348', nombres: 'Carlos Perez', telefono: '987654321', estado: 'COTIZADO', vendedor: 'Diego Ruiz', interes: 'Lote A-15' },
    { id: 2, fecha: '2026-05-02', documento: '45821034', nombres: 'Maria Gomez', telefono: '912345678', estado: 'NUEVO', vendedor: 'Ana Silva', interes: 'Lote B-02' },
    { id: 3, fecha: '2026-05-04', documento: '72384912', nombres: 'Juan Torres', telefono: '988776655', estado: 'EN_CONTACTO', vendedor: 'Diego Ruiz', interes: 'Lote A-10' }
];

const mockClientesPagos = [
    { contratoId: 101, cliente: 'Ana Lopez', lote: 'Mz B Lt 3', precioTotal: 15000, totalPagado: 5000, saldoRestante: 10000, progreso: 33 },
    { contratoId: 102, cliente: 'Luis Mendoza', lote: 'Mz A Lt 15', precioTotal: 25000, totalPagado: 25000, saldoRestante: 0, progreso: 100 },
    { contratoId: 103, cliente: 'Sofia Castro', lote: 'Mz C Lt 8', precioTotal: 12000, totalPagado: 1200, saldoRestante: 10800, progreso: 10 }
];

const mockAging = [
    { cliente: "Juan Torres", lote: "Mz A Lt 1", deudaTotal: 4500, alDia: 0, vencido1a30: 500, vencido31a60: 1000, vencido61a90: 0, vencidoMas90: 3000, estadoRiesgo: "CRITICO" },
    { cliente: "Carlos Perez", lote: "Mz B Lt 12", deudaTotal: 1200, alDia: 1200, vencido1a30: 0, vencido31a60: 0, vencido61a90: 0, vencidoMas90: 0, estadoRiesgo: "SIN_RIESGO" },
    { cliente: "Maria Silva", lote: "Mz C Lt 5", deudaTotal: 2500, alDia: 500, vencido1a30: 2000, vencido31a60: 0, vencido61a90: 0, vencidoMas90: 0, estadoRiesgo: "MODERADO" }
];

const mockMaestro = [
    { fecha: '2026-01-15', contratoId: 101, cliente: 'Ana Lopez', lote: 'Mz B Lt 3', precio: 15000, inicial: 3000, cuotasPagadas: 5, cuotasPendientes: 31, estado: 'ACTIVO' },
    { fecha: '2026-02-10', contratoId: 102, cliente: 'Luis Mendoza', lote: 'Mz A Lt 15', precio: 25000, inicial: 25000, cuotasPagadas: 0, cuotasPendientes: 0, estado: 'FINALIZADO' },
    { fecha: '2026-03-05', contratoId: 103, cliente: 'Sofia Castro', lote: 'Mz C Lt 8', precio: 12000, inicial: 1200, cuotasPagadas: 0, cuotasPendientes: 36, estado: 'RESOLUCION' }
];

const ReportesDashboard = () => {
    const toast = useRef(null);
    const dtMaestro = useRef(null);

    // ==========================================
    // FILTROS ESTADO
    // ==========================================
    const [filtroFechasLeads, setFiltroFechasLeads] = useState(null);
    const [filtroEstadoLead, setFiltroEstadoLead] = useState(null);
    const [filtroVendedorLead, setFiltroVendedorLead] = useState(null);
    const [filtroBuscarCliente, setFiltroBuscarCliente] = useState('');
    const [filtroEstadoContrato, setFiltroEstadoContrato] = useState(null);
    const [filtroProyecto, setFiltroProyecto] = useState(null);

    // ==========================================
    // OPTIONS PARA DROPDOWNS
    // ==========================================
    const estadosLeads = [{ label: 'NUEVO', value: 'NUEVO' }, { label: 'EN CONTACTO', value: 'EN_CONTACTO' }, { label: 'COTIZADO', value: 'COTIZADO' }];
    const vendedores = [{ label: 'Diego Ruiz', value: 'Diego Ruiz' }, { label: 'Ana Silva', value: 'Ana Silva' }];
    const estadosContrato = [{ label: 'ACTIVO', value: 'ACTIVO' }, { label: 'FINALIZADO', value: 'FINALIZADO' }, { label: 'RESOLUCIÓN', value: 'RESOLUCION' }];
    const proyectos = [{ label: 'Proyecto A', value: 'A' }, { label: 'Proyecto B', value: 'B' }];

    // ==========================================
    // TEMPLATES Y UTILIDADES
    // ==========================================
    const formatCurrency = (value) => {
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const estadoLeadTemplate = (rowData) => {
        const severities = { NUEVO: 'info', EN_CONTACTO: 'warning', COTIZADO: 'success' };
        return <Tag value={rowData.estado.replace('_', ' ')} severity={severities[rowData.estado]} />;
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

    const estadoRiesgoTemplate = (rowData) => {
        const severities = { CRITICO: 'danger', MODERADO: 'warning', SIN_RIESGO: 'success' };
        const labels = { CRITICO: 'CRÍTICO', MODERADO: 'MODERADO', SIN_RIESGO: 'SIN RIESGO' };
        return <Tag value={labels[rowData.estadoRiesgo]} severity={severities[rowData.estadoRiesgo]} className="font-bold w-full" />;
    };

    const estadoMaestroTemplate = (rowData) => {
        const severities = { ACTIVO: 'success', FINALIZADO: 'info', RESOLUCION: 'danger' };
        return <Tag value={rowData.estado} severity={severities[rowData.estado]} />;
    };

    const formatDeudaValue = (val) => {
        if (!val || val === 0) return <span className="text-400">-</span>;
        return <span className="font-bold text-red-600">{formatCurrency(val)}</span>;
    };

    // ==========================================
    // FOOTER AGING REPORT
    // ==========================================
    const agingFooterGroup = (
        <ColumnGroup>
            <Row>
                <Column footer="TOTALES GENERALES" colSpan={2} footerStyle={{ textAlign: 'right', fontWeight: 'bold' }} />
                <Column footer={formatCurrency(mockAging.reduce((sum, r) => sum + r.deudaTotal, 0))} footerStyle={{ fontWeight: 'bold' }} />
                <Column footer={formatCurrency(mockAging.reduce((sum, r) => sum + r.alDia, 0))} footerStyle={{ fontWeight: 'bold', color: 'var(--green-600)' }} />
                <Column footer={formatCurrency(mockAging.reduce((sum, r) => sum + r.vencido1a30, 0))} footerStyle={{ fontWeight: 'bold', color: 'var(--red-600)' }} />
                <Column footer={formatCurrency(mockAging.reduce((sum, r) => sum + r.vencido31a60, 0))} footerStyle={{ fontWeight: 'bold', color: 'var(--red-600)' }} />
                <Column footer={formatCurrency(mockAging.reduce((sum, r) => sum + r.vencido61a90, 0))} footerStyle={{ fontWeight: 'bold', color: 'var(--red-600)' }} />
                <Column footer={formatCurrency(mockAging.reduce((sum, r) => sum + r.vencidoMas90, 0))} footerStyle={{ fontWeight: 'bold', color: 'var(--red-600)' }} />
                <Column footer="" />
            </Row>
        </ColumnGroup>
    );

    // ==========================================
    // EXPORTACIONES MAESTRO
    // ==========================================
    const exportCSV = () => dtMaestro.current.exportCSV();
    const maestroToolbarLeft = () => (
        <div className="flex align-items-center gap-2">
            <h3 className="m-0 text-xl font-bold text-800">Reporte Maestro General</h3>
        </div>
    );
    const maestroToolbarRight = () => (
        <div className="flex gap-2">
            <Button label="CSV" icon="pi pi-file" className="p-button-outlined p-button-secondary" onClick={exportCSV} />
            <Button label="Excel" icon="pi pi-file-excel" className="p-button-outlined p-button-success" />
            <Button label="PDF" icon="pi pi-file-pdf" className="p-button-outlined p-button-danger" />
        </div>
    );

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <Toast ref={toast} />
            
            <div className="flex align-items-center justify-content-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 m-0">Dashboard de Reportes</h1>
                    <p className="text-gray-500 mt-1 mb-0">Centro de inteligencia financiera y operativa del sistema.</p>
                </div>
            </div>

            <div className="bg-white shadow-2 border-round-xl p-3">
                <TabView className="custom-tabview">
                    
                    {/* TAB 1: LEADS */}
                    <TabPanel header="Interesados (Leads)" leftIcon="pi pi-users mr-2">
                        <div className="grid formgrid mb-4">
                            <div className="col-12 md:col-4">
                                <span className="p-fluid">
                                    <Calendar value={filtroFechasLeads} onChange={(e) => setFiltroFechasLeads(e.value)} selectionMode="range" readOnlyInput placeholder="Rango de Fechas" showIcon />
                                </span>
                            </div>
                            <div className="col-12 md:col-4">
                                <Dropdown value={filtroEstadoLead} options={estadosLeads} onChange={(e) => setFiltroEstadoLead(e.value)} placeholder="Estado" className="w-full" showClear />
                            </div>
                            <div className="col-12 md:col-4">
                                <Dropdown value={filtroVendedorLead} options={vendedores} onChange={(e) => setFiltroVendedorLead(e.value)} placeholder="Vendedor" className="w-full" showClear />
                            </div>
                        </div>

                        <DataTable value={mockLeads} paginator rows={10} className="p-datatable-sm shadow-1 border-round-lg overflow-hidden" emptyMessage="No se encontraron leads.">
                            <Column field="fecha" header="Fecha" sortable></Column>
                            <Column field="documento" header="Documento"></Column>
                            <Column field="nombres" header="Cliente Prospecto" sortable></Column>
                            <Column field="telefono" header="Teléfono"></Column>
                            <Column field="interes" header="Lote de Interés"></Column>
                            <Column field="vendedor" header="Vendedor" sortable></Column>
                            <Column header="Estado" body={estadoLeadTemplate} sortable></Column>
                        </DataTable>
                    </TabPanel>

                    {/* TAB 2: CLIENTES Y PAGOS */}
                    <TabPanel header="Clientes y Pagos" leftIcon="pi pi-wallet mr-2">
                        <div className="grid formgrid mb-4">
                            <div className="col-12 md:col-6">
                                <div className="p-inputgroup">
                                    <InputText value={filtroBuscarCliente} onChange={(e) => setFiltroBuscarCliente(e.target.value)} placeholder="Buscar por DNI o Nombres..." />
                                    <Button icon="pi pi-search" className="p-button-primary" />
                                </div>
                            </div>
                            <div className="col-12 md:col-6">
                                <Dropdown value={filtroEstadoContrato} options={estadosContrato} onChange={(e) => setFiltroEstadoContrato(e.value)} placeholder="Estado de Contrato" className="w-full" showClear />
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
                    </TabPanel>

                    {/* TAB 3: AGING REPORT (CRÍTICO) */}
                    <TabPanel header="Anticuamiento (Aging)" leftIcon="pi pi-chart-line mr-2">
                        <div className="flex mb-4">
                            <Dropdown value={filtroProyecto} options={proyectos} onChange={(e) => setFiltroProyecto(e.value)} placeholder="Seleccione un Proyecto (Urbanización)" className="w-20rem" showClear />
                            <Button label="Actualizar" icon="pi pi-refresh" className="p-button-outlined ml-3" />
                        </div>

                        <DataTable value={mockAging} footerColumnGroup={agingFooterGroup} className="p-datatable-sm shadow-1 border-round-lg overflow-hidden custom-aging-table" emptyMessage="No hay deudas atrasadas." rowHover>
                            <Column field="cliente" header="Cliente" className="font-bold text-700"></Column>
                            <Column field="lote" header="Lote" className="text-600"></Column>
                            <Column field="deudaTotal" header="Deuda Total" body={(r) => <span className="font-black text-800">{formatCurrency(r.deudaTotal)}</span>}></Column>
                            <Column field="alDia" header="Al Día" body={(r) => r.alDia > 0 ? <span className="text-green-600 font-bold">{formatCurrency(r.alDia)}</span> : <span className="text-400">-</span>}></Column>
                            
                            {/* Zonas de Riesgo */}
                            <Column header="1 a 30 días" body={(r) => formatDeudaValue(r.vencido1a30)} className="bg-red-50"></Column>
                            <Column header="31 a 60 días" body={(r) => formatDeudaValue(r.vencido31a60)} className="bg-red-100"></Column>
                            <Column header="61 a 90 días" body={(r) => formatDeudaValue(r.vencido61a90)} className="bg-red-200"></Column>
                            <Column header="Más de 90" body={(r) => formatDeudaValue(r.vencidoMas90)} className="bg-red-300"></Column>
                            
                            <Column header="Riesgo" body={estadoRiesgoTemplate} style={{ width: '150px' }}></Column>
                        </DataTable>
                    </TabPanel>

                    {/* TAB 4: MAESTRO DETALLADO */}
                    <TabPanel header="Reporte Maestro" leftIcon="pi pi-database mr-2">
                        <Toolbar className="mb-4 bg-white border-none shadow-1 border-round-lg" left={maestroToolbarLeft} right={maestroToolbarRight}></Toolbar>
                        
                        <DataTable ref={dtMaestro} value={mockMaestro} paginator rows={15} className="p-datatable-sm shadow-1 border-round-lg overflow-hidden" emptyMessage="Sin datos." stripedRows>
                            <Column field="fecha" header="Fecha Contrato" sortable></Column>
                            <Column field="contratoId" header="N° Contrato" body={(r) => `C-${r.contratoId}`} sortable></Column>
                            <Column field="cliente" header="Cliente" sortable></Column>
                            <Column field="lote" header="Lote"></Column>
                            <Column field="precio" header="Precio" body={(r) => formatCurrency(r.precio)}></Column>
                            <Column field="inicial" header="Inicial" body={(r) => formatCurrency(r.inicial)}></Column>
                            <Column field="cuotasPagadas" header="Cuotas Pag." align="center"></Column>
                            <Column field="cuotasPendientes" header="Cuotas Pend." align="center"></Column>
                            <Column header="Estado" body={estadoMaestroTemplate}></Column>
                        </DataTable>
                    </TabPanel>

                </TabView>
            </div>
        </div>
    );
};

export default ReportesDashboard;
