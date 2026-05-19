import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';

import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { LoteService } from '../../service/LoteService';
import { ContratoService } from '../../service/ContratoService';
import '../Usuario.css';

const ReporteLotes = () => {
    const { axiosInstance } = useAuth();
    const [lotesReporte, setLotesReporte] = useState([]);
    const [filteredLotes, setFilteredLotes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        ubz: { value: null, matchMode: FilterMatchMode.EQUALS },
        etapa: { value: null, matchMode: FilterMatchMode.EQUALS },
        mz: { value: null, matchMode: FilterMatchMode.EQUALS },
        clienteNombre: { value: null, matchMode: FilterMatchMode.EQUALS },
        estadoVenta: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    // Listas dinámicas para los dropdown de filtros (cascading)
    const urbanizaciones = useMemo(() => {
        return [...new Set(lotesReporte.map(l => l.ubz).filter(Boolean))].map(u => ({ label: u, value: u }));
    }, [lotesReporte]);

    const etapas = useMemo(() => {
        let list = lotesReporte;
        if (filters.ubz.value) {
            list = list.filter(l => l.ubz === filters.ubz.value);
        }
        return [...new Set(list.map(l => l.etapa).filter(e => e && e !== ''))].map(e => ({ label: String(e), value: String(e) }));
    }, [lotesReporte, filters.ubz.value]);

    const manzanas = useMemo(() => {
        let list = lotesReporte;
        if (filters.ubz.value) {
            list = list.filter(l => l.ubz === filters.ubz.value);
        }
        if (filters.etapa.value) {
            list = list.filter(l => l.etapa === filters.etapa.value);
        }
        return [...new Set(list.map(l => l.mz).filter(m => m && m !== ''))].map(m => ({ label: String(m), value: String(m) }));
    }, [lotesReporte, filters.ubz.value, filters.etapa.value]);

    const clientesList = useMemo(() => {
        return [...new Set(lotesReporte.map(l => l.clienteNombre).filter(c => c && c !== '-'))].map(c => ({ label: c, value: c }));
    }, [lotesReporte]);
    const estados = [
        { label: 'DISPONIBLE', value: 'DISPONIBLE' },
        { label: 'SEPARADO', value: 'SEPARADO' },
        { label: 'VENDIDO', value: 'VENDIDO' }
    ];

    const toast = useRef(null);
    const dt = useRef(null);

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            const [lotes, contratos] = await Promise.all([
                LoteService.listar(axiosInstance),
                ContratoService.listar(axiosInstance)
            ]);

            const contratoMap = {};
            contratos.forEach(contrato => {
                if (contrato.lote && contrato.lote.id) {
                    if (!contratoMap[contrato.lote.id] || contrato.id > contratoMap[contrato.lote.id].id) {
                        contratoMap[contrato.lote.id] = contrato;
                    }
                }
            });

            const mappedData = lotes.map(l => {
                const c = contratoMap[l.id];
                
                const ubz = l.manzana?.etapa?.urbanizacion?.nombre || '';
                const etapa = l.manzana?.etapa?.nombre || l.manzana?.etapa?.numero || '';
                const mz = l.manzana?.nombre || l.manzana?.letra || '';
                const numLote = l.numero || '';
                const loteDesc = `${ubz} - Et. ${etapa} - Mz. ${mz} - Lt. ${numLote}`;
                
                const isSoldOrReserved = l.estadoVenta === 'VENDIDO' || l.estadoVenta === 'SEPARADO';
                const clienteNombre = (isSoldOrReserved && c && c.cliente) ? `${c.cliente.nombres || ''} ${c.cliente.apellidos || ''}`.trim() : '-';
                const precioVendido = (isSoldOrReserved && c) ? c.precioTotal : null;

                return {
                    ...l,
                    ubz,
                    etapa: etapa.toString(), // Convertir a string para filtros exactos
                    mz: mz.toString(),
                    numLote: numLote.toString(),
                    loteDescripcion: loteDesc,
                    clienteNombre,
                    precioVendido
                };
            });

            setLotesReporte(mappedData);



        } catch (error) {
            console.error('Error cargando reporte de lotes', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos.', life: 3500 });
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const formatCurrency = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const onFilterChange = (field, value) => {
        let _filters = { ...filters };
        _filters[field].value = value;
        
        // Limpiar selecciones dependientes cuando cambia el padre (Cascading)
        if (field === 'ubz') {
            _filters['etapa'].value = null;
            _filters['mz'].value = null;
        } else if (field === 'etapa') {
            _filters['mz'].value = null;
        }
        
        setFilters(_filters);
    };

    const onGlobalFilterChange = (value) => {
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilter(value);
    };

    // Plantillas de elementos
    const loteBodyTemplate = (rowData) => {
        return (
            <div className="flex align-items-center justify-content-center bg-primary-reverse text-primary border-round px-3 py-2 font-bold text-lg" style={{ minWidth: '40px', display: 'inline-flex' }}>
                {rowData.numLote}
            </div>
        );
    };

    const etapaBodyTemplate = (rowData) => {
        return (
            <span className="flex align-items-center justify-content-center bg-blue-100 text-blue-800 font-bold border-round px-3 py-2 text-base" style={{ minWidth: '40px', display: 'inline-flex' }}>
                {rowData.etapa || '-'}
            </span>
        );
    };

    const mzBodyTemplate = (rowData) => {
        return (
            <span className="flex align-items-center justify-content-center bg-teal-100 text-teal-800 font-bold border-round px-3 py-2 text-base" style={{ minWidth: '40px', display: 'inline-flex' }}>
                {rowData.mz || '-'}
            </span>
        );
    };

    const estadoBodyTemplate = (rowData) => {
        let severity = 'info';
        switch (rowData.estadoVenta) {
            case 'VENDIDO':
                severity = 'danger';
                break;
            case 'SEPARADO':
                severity = 'warning';
                break;
            case 'DISPONIBLE':
                severity = 'success';
                break;
            default:
                break;
        }
        return <Tag value={rowData.estadoVenta} severity={severity} className="text-sm px-3 py-2" />;
    };

    const cantidadLotes = filteredLotes ? filteredLotes.length : lotesReporte.length;

    const renderHeader = () => {
        return (
            <div className="flex flex-column gap-3">
                <div className="p-4 border-round-xl border-1 surface-border bg-white">
                    <h3 className="text-lg font-bold mb-4 mt-0" style={{ color: 'var(--text-primary)' }}>Filtros de Búsqueda</h3>
                    <div className="formgrid grid">
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Urbanización</label>
                            <Dropdown 
                                value={filters.ubz.value} 
                                options={urbanizaciones} 
                                onChange={(e) => onFilterChange('ubz', e.value)} 
                                placeholder="Seleccione urbanización" 
                                showClear 
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Etapa</label>
                            <Dropdown 
                                value={filters.etapa.value} 
                                options={etapas} 
                                onChange={(e) => onFilterChange('etapa', e.value)} 
                                placeholder="Seleccione etapa" 
                                showClear 
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Manzana</label>
                            <Dropdown 
                                value={filters.mz.value} 
                                options={manzanas} 
                                onChange={(e) => onFilterChange('mz', e.value)} 
                                placeholder="Seleccione manzana" 
                                showClear 
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Cliente</label>
                            <Dropdown 
                                value={filters.clienteNombre.value} 
                                options={clientesList} 
                                onChange={(e) => onFilterChange('clienteNombre', e.value)} 
                                placeholder="Seleccione cliente" 
                                showClear 
                                filter
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-sm block mb-2 text-700">Estado de Venta</label>
                            <Dropdown 
                                value={filters.estadoVenta.value} 
                                options={estados} 
                                onChange={(e) => onFilterChange('estadoVenta', e.value)} 
                                placeholder="Seleccione estado" 
                                showClear 
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                    <div className="flex align-items-center gap-4">
                        <div className="bg-primary-reverse text-primary border-round px-4 py-2 flex align-items-center gap-2">
                            <i className="pi pi-check-square text-xl"></i>
                            <div>
                                <span className="block text-sm">Total Mostrados</span>
                                <span className="block font-bold text-xl">{cantidadLotes} lotes</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <span className="p-input-icon-left">
                            <i className="pi pi-search" />
                            <InputText 
                                value={globalFilter} 
                                onChange={(e) => onGlobalFilterChange(e.target.value)} 
                                placeholder="Buscar lote, cliente, ubicación..." 
                                style={{ borderRadius: '8px', minWidth: '300px' }} 
                            />
                        </span>
                        <Button
                            icon="pi pi-download"
                            className="btn-export"
                            tooltip="Exportar a CSV"
                            tooltipOptions={{ position: 'bottom' }}
                            onClick={exportCSV}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="usuario-page reporte-lotes-page">
            <div className="container">
                <PageHeader
                    title="Reporte de Lotes"
                    description="Vista general de todos los lotes, precios y estado comercial."
                    icon="pi pi-map"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <DataTable
                            ref={dt}
                            value={lotesReporte}
                            onValueChange={(e) => setFilteredLotes(e)}
                            dataKey="id"
                            paginator
                            rows={15}
                            rowsPerPageOptions={[15, 25, 50, 100]}
                            loading={loading}
                            filters={filters}
                            globalFilterFields={['loteDescripcion', 'ubz', 'etapa', 'mz', 'numLote', 'clienteNombre', 'estadoVenta']}
                            emptyMessage="No se encontraron lotes."
                            header={renderHeader()}
                            className="text-base" 
                        >
                            <Column field="ubz" header="Urbanización" sortable style={{ minWidth: '180px', fontSize: '1rem' }} />
                            <Column field="etapa" header="Etapa" body={etapaBodyTemplate} sortable style={{ minWidth: '120px', fontSize: '1rem' }} />
                            <Column field="mz" header="Mz." body={mzBodyTemplate} sortable style={{ minWidth: '100px', fontSize: '1rem', fontWeight: '600' }} />
                            <Column field="numLote" header="Lt." body={loteBodyTemplate} sortable style={{ minWidth: '100px' }} />
                            
                            <Column field="area" header="Área (m²)" body={(row) => row.area ? `${row.area.toFixed(2)}` : '-'} sortable style={{ minWidth: '100px', fontSize: '1rem' }} />
                            <Column field="precioCosto" header="Precio Costo" body={(row) => formatCurrency(row.precioCosto)} sortable style={{ minWidth: '140px', fontSize: '1rem' }} />
                            <Column field="precioVenta" header="Precio Oficina" body={(row) => formatCurrency(row.precioVenta)} sortable style={{ minWidth: '140px', fontSize: '1rem' }} />
                            <Column field="precioVendido" header="Precio Final (Venta)" body={(row) => formatCurrency(row.precioVendido)} sortable style={{ minWidth: '150px', fontSize: '1.05rem', fontWeight: 'bold' }} />
                            
                            <Column field="clienteNombre" header="Cliente Asignado" sortable style={{ minWidth: '240px', fontSize: '1rem' }} />
                            <Column field="estadoVenta" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '140px' }} />
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReporteLotes;
