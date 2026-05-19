import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';

// ==========================================
// MOCK DATA
// ==========================================
const mockAging = [
    { cliente: "Juan Torres", lote: "Mz A Lt 1", deudaTotal: 4500, alDia: 0, vencido1a30: 500, vencido31a60: 1000, vencido61a90: 0, vencidoMas90: 3000, estadoRiesgo: "CRITICO" },
    { cliente: "Carlos Perez", lote: "Mz B Lt 12", deudaTotal: 1200, alDia: 1200, vencido1a30: 0, vencido31a60: 0, vencido61a90: 0, vencidoMas90: 0, estadoRiesgo: "SIN_RIESGO" },
    { cliente: "Maria Silva", lote: "Mz C Lt 5", deudaTotal: 2500, alDia: 500, vencido1a30: 2000, vencido31a60: 0, vencido61a90: 0, vencidoMas90: 0, estadoRiesgo: "MODERADO" }
];

const ReportesDashboard = () => {
    const toast = useRef(null);

    const [filtroProyecto, setFiltroProyecto] = useState(null);

    const proyectos = [{ label: 'Proyecto A', value: 'A' }, { label: 'Proyecto B', value: 'B' }];

    const formatCurrency = (value) => {
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const estadoRiesgoTemplate = (rowData) => {
        const severities = { CRITICO: 'danger', MODERADO: 'warning', SIN_RIESGO: 'success' };
        const labels = { CRITICO: 'CRÍTICO', MODERADO: 'MODERADO', SIN_RIESGO: 'SIN RIESGO' };
        return <Tag value={labels[rowData.estadoRiesgo]} severity={severities[rowData.estadoRiesgo]} className="font-bold w-full" />;
    };

    const formatDeudaValue = (val) => {
        if (!val || val === 0) return <span className="text-400">-</span>;
        return <span className="font-bold text-red-600">{formatCurrency(val)}</span>;
    };

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

    return (
        <div className="usuario-page reporte-anticuamiento-page">
            <div className="container">
                <PageHeader
                    title="Reporte de Anticuamiento"
                    description="Visualiza las cuentas por cobrar organizadas por antigüedad de la deuda."
                    icon="pi pi-chart-line"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />
                        
                        <div className="flex align-items-center mb-4 gap-3">
                            <Dropdown value={filtroProyecto} options={proyectos} onChange={(e) => setFiltroProyecto(e.value)} placeholder="Seleccione un Proyecto (Urbanización)" className="w-full md:w-20rem" showClear />
                            <Button label="Actualizar" icon="pi pi-refresh" className="p-button-outlined" />
                        </div>

                        <DataTable value={mockAging} footerColumnGroup={agingFooterGroup} className="p-datatable-sm shadow-1 border-round-lg overflow-hidden custom-aging-table" emptyMessage="No hay deudas atrasadas." rowHover>
                            <Column field="cliente" header="Cliente" className="font-bold text-700"></Column>
                            <Column field="lote" header="Lote" className="text-600"></Column>
                            <Column field="deudaTotal" header="Deuda Total" body={(r) => <span className="font-black text-800">{formatCurrency(r.deudaTotal)}</span>}></Column>
                            <Column field="alDia" header="Al Día" body={(r) => r.alDia > 0 ? <span className="text-green-600 font-bold">{formatCurrency(r.alDia)}</span> : <span className="text-400">-</span>}></Column>
                            
                            <Column header="1 a 30 días" body={(r) => formatDeudaValue(r.vencido1a30)} className="bg-red-50"></Column>
                            <Column header="31 a 60 días" body={(r) => formatDeudaValue(r.vencido31a60)} className="bg-red-100"></Column>
                            <Column header="61 a 90 días" body={(r) => formatDeudaValue(r.vencido61a90)} className="bg-red-200"></Column>
                            <Column header="Más de 90" body={(r) => formatDeudaValue(r.vencidoMas90)} className="bg-red-300"></Column>
                            
                            <Column header="Riesgo" body={estadoRiesgoTemplate} style={{ width: '150px' }}></Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportesDashboard;
