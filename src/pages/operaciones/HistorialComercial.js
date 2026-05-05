import React, { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import PageHeader from '../../components/ui/PageHeader';

import './HistorialComercial.css';

const HistorialComercial = () => {
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('');
    const [filtroLote, setFiltroLote] = useState('');

    const tipoOptions = [
        { label: 'Todas', value: '' },
        { label: 'Cotizacion', value: 'COTIZACION' },
        { label: 'Contrato', value: 'CONTRATO' }
    ];

    const data = useMemo(() => ([
        {
            id: 101,
            tipo: 'COTIZACION',
            codigo: 'COT-0101',
            cliente: 'Juan Perez',
            documento: '72345678',
            lote: 'Mz A - Lote 12',
            total: 14500,
            estado: 'VIGENTE'
        },
        {
            id: 202,
            tipo: 'CONTRATO',
            codigo: 'C-0202',
            cliente: 'Maria Torres',
            documento: '71223344',
            lote: 'Mz B - Lote 08',
            total: 22000,
            estado: 'ACTIVO'
        }
    ]), []);

    const dataFiltrada = useMemo(() => {
        return data.filter((row) => {
            const matchTipo = !filtroTipo || row.tipo === filtroTipo;
            const matchCliente = !filtroCliente || row.cliente.toLowerCase().includes(filtroCliente.toLowerCase());
            const matchLote = !filtroLote || row.lote.toLowerCase().includes(filtroLote.toLowerCase());
            return matchTipo && matchCliente && matchLote;
        });
    }, [data, filtroTipo, filtroCliente, filtroLote]);

    const estadoTemplate = (row) => {
        const isContrato = row.tipo === 'CONTRATO';
        const severity = isContrato ? 'success' : 'info';
        return <Tag severity={severity} value={row.estado} />;
    };

    const accionesTemplate = () => (
        <div className="flex gap-2 justify-content-center">
            <Button label="Detalle" icon="pi pi-eye" className="p-button-outlined p-button-sm" disabled />
            <Button label="Editar" icon="pi pi-pencil" className="p-button-sm" disabled />
        </div>
    );

    return (
        <div className="historialcomercial-page">
            <PageHeader
                title="Historial comercial"
                subtitle="Cotizaciones y contratos en un solo listado"
                icon="pi pi-history"
            />

            <div className="main-content pt-3">
                <div className="card surface-card border-round shadow-1 p-4 mb-3">
                    <div className="grid">
                        <div className="col-12 md:col-3">
                            <label className="text-xs font-bold text-500 uppercase">Tipo</label>
                            <Dropdown
                                value={filtroTipo}
                                options={tipoOptions}
                                onChange={(e) => setFiltroTipo(e.value)}
                                placeholder="Seleccione"
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="text-xs font-bold text-500 uppercase">Cliente</label>
                            <InputText
                                value={filtroCliente}
                                onChange={(e) => setFiltroCliente(e.target.value)}
                                placeholder="Buscar por cliente"
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="text-xs font-bold text-500 uppercase">Lote</label>
                            <InputText
                                value={filtroLote}
                                onChange={(e) => setFiltroLote(e.target.value)}
                                placeholder="Buscar por lote"
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-1 flex align-items-end">
                            <Button
                                icon="pi pi-refresh"
                                className="p-button-outlined w-full"
                                type="button"
                            />
                        </div>
                    </div>
                </div>

                <div className="card surface-card border-round shadow-1 p-0 overflow-hidden">
                    <DataTable
                        value={dataFiltrada}
                        paginator
                        rows={10}
                        emptyMessage="No hay registros para mostrar."
                        className="p-datatable-sm custom-master-table"
                        stripedRows
                    >
                        <Column field="codigo" header="Codigo" style={{ minWidth: '120px', fontWeight: 'bold' }} />
                        <Column header="Tipo" body={(row) => (row.tipo === 'CONTRATO' ? 'Contrato' : 'Cotizacion')} style={{ minWidth: '120px' }} />
                        <Column header="Cliente" body={(row) => (
                            <div>
                                <span className="font-bold text-800">{row.cliente}</span><br />
                                <span className="text-xs text-500">DNI: {row.documento}</span>
                            </div>
                        )} style={{ minWidth: '220px' }} />
                        <Column header="Lote" body={(row) => row.lote} style={{ minWidth: '180px' }} />
                        <Column header="Total" body={(row) => `S/ ${row.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} style={{ minWidth: '120px', textAlign: 'right' }} />
                        <Column header="Estado" body={estadoTemplate} style={{ minWidth: '120px', textAlign: 'center' }} />
                        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: '160px', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default HistorialComercial;
