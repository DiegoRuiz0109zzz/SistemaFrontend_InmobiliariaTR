import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
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

    // Filtro de rango de fecha para lotes vendidos (contrato ACTIVO)
    const [fechasVenta, setFechasVenta] = useState(null);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        etapa: { value: null, matchMode: FilterMatchMode.EQUALS },
        mz: { value: null, matchMode: FilterMatchMode.EQUALS },
        clienteNombre: { value: null, matchMode: FilterMatchMode.EQUALS },
        estadoVenta: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    const etapas = useMemo(() => {
        return [...new Set(lotesReporte.map(l => l.etapa).filter(e => e && e !== ''))].map(e => ({ label: String(e), value: String(e) }));
    }, [lotesReporte]);

    const manzanas = useMemo(() => {
        let list = lotesReporte;
        if (filters.etapa.value) {
            list = list.filter(l => l.etapa === filters.etapa.value);
        }
        return [...new Set(list.map(l => l.mz).filter(m => m && m !== ''))].map(m => ({ label: String(m), value: String(m) }));
    }, [lotesReporte, filters.etapa.value]);

    const clientesList = useMemo(() => {
        return [...new Set(lotesReporte.map(l => l.clienteNombre).filter(c => c && c !== '-'))].map(c => ({ label: c, value: c }));
    }, [lotesReporte]);

    const estados = [
        { label: 'DISPONIBLE', value: 'DISPONIBLE' },
        { label: 'SEPARADO', value: 'RESERVADO' },
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

            // Para cada lote, encontrar el contrato ACTIVO (lote vendido) o el más reciente
            const contratoActivoMap = {};
            const contratoMap = {};
            contratos.forEach(contrato => {
                if (contrato.lote && contrato.lote.id) {
                    const loteId = contrato.lote.id;
                    // Guardar el contrato activo si existe
                    if (contrato.estadoContrato === 'ACTIVO') {
                        contratoActivoMap[loteId] = contrato;
                    }
                    // Guardar el más reciente en general
                    if (!contratoMap[loteId] || contrato.id > contratoMap[loteId].id) {
                        contratoMap[loteId] = contrato;
                    }
                }
            });

            const mappedData = lotes.map(l => {
                const etapa = l.manzana?.etapa?.nombre || l.manzana?.etapa?.numero || '';
                const mz = l.manzana?.nombre || l.manzana?.letra || '';
                const numLote = l.numero || '';
                const ubz = l.manzana?.etapa?.urbanizacion?.nombre || '';
                const loteDesc = `${ubz} - Et. ${etapa} - Mz. ${mz} - Lt. ${numLote}`;

                // El contrato relevante: priorizar el ACTIVO, luego el más reciente
                const cActivo = contratoActivoMap[l.id];
                const cReciente = contratoMap[l.id];
                const c = cActivo || cReciente;

                const isSoldOrReserved = l.estadoVenta === 'VENDIDO' || l.estadoVenta === 'SEPARADO';
                const clienteNombre = (isSoldOrReserved && c && c.cliente)
                    ? `${c.cliente.nombres || ''} ${c.cliente.apellidos || ''}`.trim()
                    : '-';
                const precioVendido = (isSoldOrReserved && c) ? c.precioTotal : null;

                // Fecha de venta: usar fechaContrato del contrato ACTIVO
                let fechaVenta = null;
                if (cActivo) {
                    fechaVenta = cActivo.fechaContrato || cActivo.fechaCreacion || null;
                }

                return {
                    ...l,
                    ubz,
                    etapa: etapa.toString(),
                    mz: mz.toString(),
                    numLote: numLote.toString(),
                    loteDescripcion: loteDesc,
                    clienteNombre,
                    precioVendido,
                    fechaVenta,
                    esVendido: !!cActivo  // true cuando el contrato está ACTIVO
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

    // Filtrado por rango de fechas sobre los datos base
    const lotesFiltradosPorFecha = useMemo(() => {
        if (!fechasVenta || (!fechasVenta[0] && !fechasVenta[1])) return lotesReporte;

        const [fechaDesde, fechaHasta] = fechasVenta;

        return lotesReporte.filter(l => {
            if (!l.fechaVenta) return false;
            const fecha = new Date(l.fechaVenta);
            if (isNaN(fecha.getTime())) return false;
            if (fechaDesde) {
                const desde = new Date(fechaDesde);
                desde.setHours(0, 0, 0, 0);
                if (fecha < desde) return false;
            }
            if (fechaHasta) {
                const hasta = new Date(fechaHasta);
                hasta.setHours(23, 59, 59, 999);
                if (fecha > hasta) return false;
            }
            return true;
        });
    }, [lotesReporte, fechasVenta]);

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const formatCurrency = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const onFilterChange = (field, value) => {
        let _filters = { ...filters };
        _filters[field].value = value;
        if (field === 'etapa') {
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

    const limpiarFiltros = () => {
        setFechasVenta(null);
        setFilters({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            etapa: { value: null, matchMode: FilterMatchMode.EQUALS },
            mz: { value: null, matchMode: FilterMatchMode.EQUALS },
            clienteNombre: { value: null, matchMode: FilterMatchMode.EQUALS },
            estadoVenta: { value: null, matchMode: FilterMatchMode.EQUALS }
        });
        setGlobalFilter('');
    };

    // Plantillas de columnas
    const rowNumberTemplate = (rowData, { rowIndex }) => {
        return (
            <span>
                {rowIndex + 1}
            </span>
        );
    };

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
            case 'VENDIDO': severity = 'danger'; break;
            case 'SEPARADO': severity = 'warning'; break;
            case 'DISPONIBLE': severity = 'success'; break;
            default: break;
        }
        return <Tag value={rowData.estadoVenta} severity={severity} className="text-sm px-3 py-2" />;
    };

    const fechaVentaTemplate = (rowData) => {
        if (!rowData.esVendido || !rowData.fechaVenta) {
            return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>—</span>;
        }
        return (
            <span>
                {formatDate(rowData.fechaVenta)}
            </span>
        );
    };

    // filteredLotes es el resultado de onValueChange del DataTable (filtros PrimeReact aplicados).
    // Si es null aún no se disparó, usamos la longitud base. Si es un array, usamos su longitud.
    const cantidadLotes = filteredLotes !== null ? filteredLotes.length : lotesFiltradosPorFecha.length;
    const hayFiltroFecha = fechasVenta && (fechasVenta[0] || fechasVenta[1]);

    const renderHeader = () => {
        return (
            <div className="flex flex-column gap-3">
                {/* Filtros - sin card, fondo transparente */}
                <div style={{ padding: '0.5rem 0 1rem 0' }}>
                    <h3 className="text-lg font-bold mb-4 mt-0" style={{ color: 'var(--text-primary)' }}>Filtros de Búsqueda</h3>
                    <div className="formgrid grid">
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
                        <div className="field col-12 md:col-3">
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

                        {/* Filtro de rango de fechas de venta */}
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-sm block mb-2 text-700">
                                <i className="pi pi-calendar mr-1" style={{ color: '#92400e' }} />
                                Rango de Fecha de Venta
                            </label>
                            <Calendar
                                value={fechasVenta}
                                onChange={(e) => setFechasVenta(e.value)}
                                selectionMode="range"
                                readOnlyInput
                                hideOnRangeSelection
                                dateFormat="dd/mm/yy"
                                placeholder="dd/mm/aaaa - dd/mm/aaaa"
                                showClear
                                showIcon
                                className="w-full"
                            />
                        </div>
                        {(hayFiltroFecha) && (
                            <div className="field col-12 md:col-3 flex align-items-end">
                                <Button
                                    label="Limpiar fechas"
                                    icon="pi pi-times"
                                    className="p-button-outlined p-button-secondary w-full"
                                    onClick={() => setFechasVenta(null)}
                                    style={{ borderRadius: '8px' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Barra inferior: contador + búsqueda global */}
                <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="flex align-items-center gap-3">
                        <div className="bg-primary-reverse text-primary border-round px-4 py-2 flex align-items-center gap-2">
                            <i className="pi pi-check-square text-xl" />
                            <div>
                                <span className="block text-sm">Total Mostrados</span>
                                <span className="block font-bold text-xl">{cantidadLotes} lotes</span>
                            </div>
                        </div>
                        {hayFiltroFecha && (
                            <span style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '20px',
                                padding: '0.25rem 0.85rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}>
                                <i className="pi pi-calendar" style={{ fontSize: '0.75rem' }} />
                                Filtrando por fecha de venta
                            </span>
                        )}
                    </div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <div className="p-input-icon-left" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                            <i className="pi pi-search" style={{ position: 'absolute', left: '0.85rem', zIndex: 1, color: 'var(--theme-primary)', pointerEvents: 'none' }} />
                            <InputText
                                value={globalFilter}
                                onChange={(e) => onGlobalFilterChange(e.target.value)}
                                placeholder="Buscar lote, cliente, ubicación..."
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
        <div className="usuario-page reporte-lotes-page">
            <div className="container">
                <PageHeader
                    title="Reporte de Lotes"
                    description="Vista general de todos los lotes, precios y estado comercial — LOTIZACIÓN PRIMAVERA."
                    icon="pi pi-map"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <DataTable
                            ref={dt}
                            value={lotesFiltradosPorFecha}
                            onValueChange={(e) => setFilteredLotes(e)}
                            dataKey="id"
                            paginator
                            rows={15}
                            rowsPerPageOptions={[15, 25, 50, 100]}
                            loading={loading}
                            filters={filters}
                            globalFilterFields={['loteDescripcion', 'etapa', 'mz', 'numLote', 'clienteNombre', 'estadoVenta']}
                            emptyMessage="No se encontraron lotes."
                            header={renderHeader()}
                            className="text-base"
                            exportFilename="Reporte_Lotes"
                        >
                            <Column
                                header="N°"
                                body={rowNumberTemplate}
                                style={{ width: '60px', textAlign: 'center' }}
                            />
                            <Column field="etapa" header="Etapa" body={etapaBodyTemplate} sortable style={{ minWidth: '100px', fontSize: '1rem' }} />
                            <Column field="mz" header="Mz." body={mzBodyTemplate} sortable style={{ minWidth: '90px', fontSize: '1rem', fontWeight: '600' }} />
                            <Column field="numLote" header="Lt." body={loteBodyTemplate} sortable style={{ minWidth: '90px' }} />

                            <Column field="precioVenta" header="Precio Oficina" body={(row) => formatCurrency(row.precioVenta)} sortable style={{ minWidth: '140px', fontSize: '1rem' }} />
                            <Column field="precioVendido" header="Precio Final (Venta)" body={(row) => formatCurrency(row.precioVendido)} sortable style={{ minWidth: '150px', fontSize: '1.05rem', fontWeight: 'bold' }} />

                            <Column
                                field="fechaVenta"
                                header="Fecha de Venta"
                                body={fechaVentaTemplate}
                                sortable
                                style={{ minWidth: '150px' }}
                            />

                            <Column field="clienteNombre" header="Cliente Asignado" sortable style={{ minWidth: '220px', fontSize: '1rem' }} />
                            <Column field="estadoVenta" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '130px' }} />
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReporteLotes;
