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
import { ContratoService } from '../../service/ContratoService';
import '../Usuario.css';

const ReporteMaestro = () => {
    const { axiosInstance } = useAuth();
    const [reportes, setReportes] = useState([]);
    const [filteredReportes, setFilteredReportes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        etapa: { value: null, matchMode: FilterMatchMode.EQUALS },
        manzana: { value: null, matchMode: FilterMatchMode.EQUALS },
        numeroLote: { value: null, matchMode: FilterMatchMode.EQUALS },
        nombreVendedor: { value: null, matchMode: FilterMatchMode.EQUALS },
        estadoContrato: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    const etapasList = useMemo(() => {
        return [...new Set(reportes.map(r => r.etapa).filter(e => e && e !== 'N/A'))].map(e => ({ label: String(e), value: String(e) }));
    }, [reportes]);

    const manzanasList = useMemo(() => {
        let list = reportes;
        if (filters.etapa.value) {
            list = list.filter(r => r.etapa === filters.etapa.value);
        }
        return [...new Set(list.map(r => r.manzana).filter(m => m && m !== 'N/A'))].map(m => ({ label: String(m), value: String(m) }));
    }, [reportes, filters.etapa.value]);

    const lotesList = useMemo(() => {
        return [...new Set(reportes.map(r => r.numeroLote).filter(l => l && l !== 'N/A'))].map(l => ({ label: l, value: l }));
    }, [reportes]);

    const vendedoresList = useMemo(() => {
        return [...new Set(reportes.map(r => r.nombreVendedor).filter(v => v && v !== 'N/A'))].map(v => ({ label: v, value: v }));
    }, [reportes]);

    const estadosList = [
        { label: 'ACTIVO', value: 'ACTIVO' },
        { label: 'SEPARADO', value: 'SEPARADO' },
        { label: 'FINALIZADO', value: 'FINALIZADO' },
        { label: 'ANULADO', value: 'ANULADO' }
    ];

    const onFilterChange = (field, value) => {
        let _filters = { ...filters };
        _filters[field].value = value;

        // Cascada: si cambia etapa, limpiar manzana
        if (field === 'etapa') {
            _filters['manzana'].value = null;
        }

        setFilters(_filters);
    };

    const onGlobalFilterChange = (value) => {
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilter(value);
    };

    const toast = useRef(null);
    const dt = useRef(null);

    const cargarReporteMaestro = useCallback(async () => {
        setLoading(true);
        try {
            const [response, contratosRaw] = await Promise.all([
                axiosInstance.get('/reportes/maestro'),
                ContratoService.listar(axiosInstance)
            ]);

            const contratosMap = {};
            if (Array.isArray(contratosRaw)) {
                contratosRaw.forEach(c => {
                    contratosMap[c.id] = c;
                });
            }

            const dataEnriquecida = response.data.map(item => {
                const c = contratosMap[item.idContrato] || {};
                const lote = c.lote || {};
                const clienteInfo = c.cliente || {};
                const mz = lote.manzana?.nombre || lote.manzana?.letra || 'N/A';
                const etapa = lote.manzana?.etapa?.nombre || lote.manzana?.etapa?.numero?.toString() || 'N/A';
                const urb = lote.manzana?.etapa?.urbanizacion?.nombre || 'N/A';
                const dni = clienteInfo.numeroDocumento || 'N/A';

                return {
                    ...item,
                    urbanizacion: item.urbanizacion && item.urbanizacion !== 'N/A' ? item.urbanizacion : urb,
                    etapa: item.etapa && item.etapa !== 'N/A' ? item.etapa : etapa,
                    manzana: item.manzana && item.manzana !== 'N/A' ? item.manzana : mz,
                    documentoCliente: dni
                };
            });

            setReportes(dataEnriquecida);
        } catch (error) {
            console.error('Error cargando el reporte maestro', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los datos del reporte maestro.',
                life: 3500
            });
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarReporteMaestro();
    }, [cargarReporteMaestro]);

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const limpiarFiltros = () => {
        setFilters({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            etapa: { value: null, matchMode: FilterMatchMode.EQUALS },
            manzana: { value: null, matchMode: FilterMatchMode.EQUALS },
            numeroLote: { value: null, matchMode: FilterMatchMode.EQUALS },
            nombreVendedor: { value: null, matchMode: FilterMatchMode.EQUALS },
            estadoContrato: { value: null, matchMode: FilterMatchMode.EQUALS }
        });
        setGlobalFilter('');
    };

    // Formatter functions
    const formatCurrency = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const indexBodyTemplate = (_, options) => (options.rowIndex ?? 0) + 1;

    // Body Templates
    const estadoBodyTemplate = (rowData) => {
        let severity = 'info';

        switch (rowData.estadoContrato) {
            case 'ACTIVO':
                severity = 'success';
                break;
            case 'SEPARADO':
                severity = 'warning';
                break;
            case 'ANULADO':
                severity = 'danger';
                break;
            case 'FINALIZADO':
                severity = 'success';
                break;
            default:
                severity = 'info';
                break;
        }

        return (
            <Tag
                value={rowData.estadoContrato}
                severity={severity}
                className="font-bold px-2 py-1"
            />
        );
    };

    const cuotasVencidasBodyTemplate = (rowData) => {
        if (rowData.cuotasVencidas > 0) {
            return (
                <span className="text-red-500 font-bold flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-2"></i>
                    {rowData.cuotasVencidas}
                </span>
            );
        }
        return <span className="flex align-items-center justify-content-center">{rowData.cuotasVencidas}</span>;
    };

    const clienteTemplate = (row) => (
        <div className="flex flex-column">
            <span className="font-bold text-800 text-sm">{row.nombreCliente}</span>
            <span className="text-xs text-500 flex align-items-center gap-1 mt-1"><i className="pi pi-id-card text-400" style={{ fontSize: '0.7rem' }}></i> Doc: {row.documentoCliente}</span>
        </div>
    );

    const loteDetalleTemplate = (row) => {
        const mz = row.manzana === 'N/A' ? '-' : row.manzana;
        const loteNum = row.numeroLote === 'N/A' ? '-' : row.numeroLote;
        const urb = row.urbanizacion === 'N/A' ? '-' : row.urbanizacion;
        const etapa = row.etapa === 'N/A' ? '-' : row.etapa;
        return (
            <div className="flex flex-column gap-1">
                <div className="flex align-items-center gap-2 text-700 font-bold text-sm">
                    <i className="pi pi-map-marker text-400"></i>
                    <span>Mz {mz} - Lote {loteNum}</span>
                </div>
                <div className="flex align-items-center gap-1">
                    <span className="text-xs text-500 border-1 surface-border px-2 py-1 border-round-sm bg-gray-50 flex align-items-center gap-1">
                        <i className="pi pi-building text-300" style={{ fontSize: '0.7rem' }}></i> Urb. {urb} - Etapa {etapa}
                    </span>
                </div>
            </div>
        );
    };

    const cantidadRegistros = filteredReportes !== null ? filteredReportes.length : reportes.length;

    const renderHeader = () => {
        return (
            <div className="flex flex-column gap-3">
                <div style={{ padding: '0.5rem 0 1rem 0' }}>
                    <h3 className="text-lg font-bold mb-4 mt-0" style={{ color: 'var(--text-primary)' }}>Filtros de Búsqueda</h3>
                    <div className="formgrid grid mb-3">
                        <div className="field col-12 md:col-4">
                            <label className="font-bold text-sm block mb-2 text-700">Etapa</label>
                            <Dropdown
                                value={filters.etapa.value}
                                options={etapasList}
                                onChange={(e) => onFilterChange('etapa', e.value)}
                                placeholder="Seleccione etapa"
                                showClear
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="font-bold text-sm block mb-2 text-700">Manzana</label>
                            <Dropdown
                                value={filters.manzana.value}
                                options={manzanasList}
                                onChange={(e) => onFilterChange('manzana', e.value)}
                                placeholder="Seleccione manzana"
                                showClear
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="font-bold text-sm block mb-2 text-700">Lote</label>
                            <Dropdown
                                value={filters.numeroLote.value}
                                options={lotesList}
                                onChange={(e) => onFilterChange('numeroLote', e.value)}
                                placeholder="Seleccione lote"
                                showClear
                                filter
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="formgrid grid">
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-sm block mb-2 text-700">Vendedor / Jefe de Ventas</label>
                            <Dropdown
                                value={filters.nombreVendedor.value}
                                options={vendedoresList}
                                onChange={(e) => onFilterChange('nombreVendedor', e.value)}
                                placeholder="Seleccione vendedor"
                                showClear
                                filter
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-sm block mb-2 text-700">Estado Contrato</label>
                            <Dropdown
                                value={filters.estadoContrato.value}
                                options={estadosList}
                                onChange={(e) => onFilterChange('estadoContrato', e.value)}
                                placeholder="Seleccione estado"
                                showClear
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="flex align-items-center gap-3">
                        <div className="bg-primary-reverse text-primary border-round px-4 py-2 flex align-items-center gap-2">
                            <i className="pi pi-check-square text-xl" />
                            <div>
                                <span className="block text-sm">Total Mostrados</span>
                                <span className="block font-bold text-xl">{cantidadRegistros} contratos</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <div className="p-input-icon-left" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                            <i className="pi pi-search" style={{ position: 'absolute', left: '0.85rem', zIndex: 1, color: 'var(--theme-primary)', pointerEvents: 'none' }} />
                            <InputText
                                value={globalFilter}
                                onChange={(e) => onGlobalFilterChange(e.target.value)}
                                placeholder="Buscar en todos los campos..."
                                style={{ borderRadius: '8px', minWidth: '300px', paddingLeft: '2.5rem' }}
                            />
                        </div>
                        <Button
                            icon="pi pi-filter-slash"
                            className="p-button-outlined p-button-secondary"
                            tooltip="Limpiar todos los filtros"
                            tooltipOptions={{ position: 'bottom' }}
                            onClick={limpiarFiltros}
                            style={{ borderRadius: '8px' }}
                        />
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
        <div className="usuario-page reporte-maestro-page">
            <div className="container">
                <PageHeader
                    title="Reporte Maestro"
                    description="Visualiza de manera integral y resumida la información de todos los contratos y su estado."
                    icon="pi pi-chart-bar"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />
                        <DataTable
                            ref={dt}
                            value={reportes}
                            onValueChange={(e) => setFilteredReportes(e)}
                            dataKey="idContrato"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 20, 50]}
                            loading={loading}
                            filters={filters}
                            globalFilterFields={[
                                'nroContrato', 'nombreVendedor', 'nombreCliente', 'documentoCliente',
                                'numeroLote', 'urbanizacion', 'etapa', 'manzana', 'estadoContrato'
                            ]}
                            emptyMessage="No se encontraron registros en el reporte maestro."
                            header={renderHeader()}
                            sortField="nroContrato"
                            sortOrder={-1}
                            exportFilename="Reporte_Maestro"
                        >
                            <Column header="N°" body={indexBodyTemplate} style={{ width: '60px', textAlign: 'center' }} />
                            <Column field="nroContrato" header="Nro Contrato" sortable style={{ minWidth: '110px', fontWeight: 'bold' }} />
                            <Column field="fechaContrato" header="Fecha Contrato" body={(row) => formatDate(row.fechaContrato)} sortable style={{ minWidth: '120px' }} />
                            <Column field="nombreCliente" header="Cliente" body={clienteTemplate} sortable style={{ minWidth: '180px' }} />
                            <Column field="nombreVendedor" header="Vendedor" sortable style={{ minWidth: '180px' }} />
                            <Column field="numeroLote" header="Lote" body={loteDetalleTemplate} sortable style={{ minWidth: '180px' }} />
                            <Column field="urbanizacion" header="Urbanización" hidden={true} />
                            <Column field="etapa" header="Etapa" hidden={true} />
                            <Column field="manzana" header="Manzana" hidden={true} />
                            <Column field="precioOficinaLote" header="Precio Lote" body={(row) => formatCurrency(row.precioOficinaLote)} sortable style={{ minWidth: '120px' }} />
                            <Column field="precioVentaFinal" header="Precio Final" body={(row) => formatCurrency(row.precioVentaFinal)} sortable style={{ minWidth: '120px' }} />
                            <Column field="cuotasPagas" header="C. Pagas" sortable align="center" style={{ minWidth: '100px' }} />
                            <Column field="cuotasPendientes" header="C. Pendientes" sortable align="center" style={{ minWidth: '110px' }} />
                            <Column field="cuotasVencidas" header="C. Vencidas" body={cuotasVencidasBodyTemplate} sortable align="center" style={{ minWidth: '110px' }} />
                            <Column field="estadoContrato" header="Estado" body={estadoBodyTemplate} sortable align="center" style={{ minWidth: '120px' }} />
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReporteMaestro;
