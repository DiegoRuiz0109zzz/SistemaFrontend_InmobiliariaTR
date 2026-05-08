import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useAuth } from '../../context/AuthContext';
import { CotizacionService } from '../../service/CotizacionService';
import { ContratoService } from '../../service/ContratoService';

import './HistorialComercial.css'; // Usaremos un CSS propio para el diseño premium

const TIPO_TODOS = 'TODOS';
const TIPO_COTIZACION = 'COTIZACION';
const TIPO_CONTRATO = 'CONTRATO';

const HistorialComercial = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);
    const navigate = useNavigate();

    // ESTADOS
    const [historial, setHistorial] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState(TIPO_TODOS);
    const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
    const [pagoFiltro, setPagoFiltro] = useState('TODOS');
    const [loading, setLoading] = useState(true);
    const [cotizacionDetalle, setCotizacionDetalle] = useState(null);

    const tipoOptions = [
        { label: 'Tipo: Todos', value: TIPO_TODOS },
        { label: 'Cotizaciones', value: TIPO_COTIZACION },
        { label: 'Contratos', value: TIPO_CONTRATO }
    ];

    const estadoOptions = [
        { label: 'Estado: Todos', value: 'TODOS' },
        { label: 'Vendido', value: 'VENDIDO' },
        { label: 'Separado', value: 'SEPARADO' },
        { label: 'Convertida', value: 'CONVERTIDA_A_CONTRATO' },
        { label: 'Activa', value: 'VIGENTE' }
    ];

    const pagoOptions = [
        { label: 'Deuda: Todos', value: 'TODOS' },
        { label: 'Pagos al Día', value: 'AL DIA' },
        { label: 'Atrasados', value: 'ATRASADO' }
    ];

    // ==========================================
    // LÓGICA DE DATOS
    // ==========================================
    const toTime = (value) => {
        const time = new Date(value || 0).getTime();
        return Number.isNaN(time) ? 0 : time;
    };

    const buildLoteLabel = (lote) => {
        if (!lote) return 'No asignado';
        if (lote.numero || lote.manzana?.nombre) {
            const manzana = lote.manzana?.nombre ? `Mz ${lote.manzana.nombre}` : '';
            const numero = lote.numero ? `Lote ${lote.numero}` : '';
            return `${manzana}${manzana && numero ? ' - ' : ''}${numero}`.trim();
        }
        return lote.descripcion || 'No asignado';
    };

    const mapCotizacion = (item) => {
        const nombre = `${item?.interesado?.nombres || ''} ${item?.interesado?.apellidos || ''}`.trim();
        return {
            id: item?.id,
            tipo: TIPO_COTIZACION,
            codigo: `Q-${item?.id?.toString().padStart(4, '0')}`,
            clienteNombre: nombre || 'Sin nombre',
            clienteDocumento: item?.interesado?.numeroDocumento || 'N/A',
            loteDescripcion: buildLoteLabel(item?.lote),
            total: item?.precioTotal || 0,
            pagado: 0, // Las cotizaciones no tienen pagos directos
            ultimaCuota: '-',
            estado: item?.estado || 'N/A',
            estadoPago: 'N/A',
            fecha: item?.fechaCotizacion || item?.createdAt || '',
            fechaOrden: toTime(item?.fechaCotizacion || item?.createdAt),
            raw: item
        };
    };

    const mapContrato = (item) => {
        const nombre = `${item?.cliente?.nombres || ''} ${item?.cliente?.apellidos || ''}`.trim();
        const estadoLote = item?.lote?.estadoVenta;
        
        // Asumiendo que el backend envía totales pagados (si no, por defecto 0)
        const totalPagado = item?.finanzas?.totalPagado || item?.montoPagado || 0;
        const estadoPago = item?.estadoPago || 'AL DIA'; // Simulado si el backend no lo envía
        const ultimaCuota = item?.ultimaFechaPago || '-';

        return {
            id: item?.id,
            tipo: TIPO_CONTRATO,
            codigo: `C-${item?.id?.toString().padStart(4, '0')}`,
            clienteNombre: nombre || 'Sin nombre',
            clienteDocumento: item?.cliente?.numeroDocumento || 'N/A',
            loteDescripcion: buildLoteLabel(item?.lote),
            total: item?.precioTotal || 0,
            pagado: totalPagado,
            ultimaCuota: ultimaCuota,
            estado: estadoLote || 'CONTRATO',
            estadoPago: estadoPago,
            fecha: item?.fechaRegistro || item?.createdAt || '',
            fechaOrden: toTime(item?.fechaRegistro || item?.createdAt),
            raw: item
        };
    };

    const cargarHistorial = async () => {
        setLoading(true);
        try {
            const [cotizacionesRes, contratosRes] = await Promise.all([
                CotizacionService.listar(axiosInstance),
                ContratoService.listar(axiosInstance)
            ]);

            const cotizaciones = Array.isArray(cotizacionesRes) ? cotizacionesRes : [];
            const contratos = Array.isArray(contratosRes) ? contratosRes : [];

            const combinado = [
                ...cotizaciones.map(mapCotizacion),
                ...contratos.map(mapContrato)
            ].sort((a, b) => b.fechaOrden - a.fechaOrden);

            setHistorial(combinado);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const convertirCotizacion = async (cotizacion) => {
        try {
            await CotizacionService.convertir(cotizacion.id, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Conversión Exitosa', detail: 'Cotización convertida a contrato.' });
            setCotizacionDetalle(null);
            cargarHistorial();
            setTimeout(() => navigate('/contrato/nuevo'), 800);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo convertir la cotización.' });
        }
    };

    // ==========================================
    // FILTROS Y KPIs DINÁMICOS
    // ==========================================
    const filteredHistorial = useMemo(() => {
        return historial.filter(item => {
            const matchesSearch = globalFilter ? 
                (item.clienteNombre.toLowerCase().includes(globalFilter.toLowerCase()) || 
                 item.codigo.toLowerCase().includes(globalFilter.toLowerCase()) || 
                 item.clienteDocumento.includes(globalFilter)) : true;
            const matchesTipo = tipoFiltro === TIPO_TODOS || item.tipo === tipoFiltro;
            const matchesEstado = estadoFiltro === 'TODOS' || item.estado === estadoFiltro;
            const matchesPago = pagoFiltro === 'TODOS' || item.estadoPago === pagoFiltro;
            
            return matchesSearch && matchesTipo && matchesEstado && matchesPago;
        });
    }, [historial, globalFilter, tipoFiltro, estadoFiltro, pagoFiltro]);

    const kpis = useMemo(() => {
        let contratos = 0, cotizaciones = 0, ingresos = 0, atrasos = 0;
        historial.forEach(item => {
            if (item.tipo === TIPO_CONTRATO) contratos++;
            if (item.tipo === TIPO_COTIZACION && item.estado === 'VIGENTE') cotizaciones++;
            ingresos += item.pagado || 0;
            if (item.estadoPago === 'ATRASADO') atrasos++;
        });
        return { contratos, cotizaciones, ingresos, atrasos };
    }, [historial]);

    // ==========================================
    // TEMPLATES PARA DATATABLE
    // ==========================================
    const operacionTemplate = (row) => (
        <div className="flex flex-column gap-1 align-items-start">
            <span className="font-bold text-800 text-base">{row.codigo}</span>
            <span className={`status-badge-mini ${row.tipo === TIPO_CONTRATO ? 'badge-contrato' : 'badge-cotizacion'}`}>
                {row.tipo}
            </span>
        </div>
    );

    const clienteTemplate = (row) => (
        <div className="flex flex-column">
            <span className="font-bold text-700">{row.clienteNombre}</span>
            <span className="text-xs text-500 flex align-items-center gap-1 mt-1">
                <i className="pi pi-id-card text-400"></i> Doc: <span className="font-medium text-600">{row.clienteDocumento}</span>
            </span>
        </div>
    );

    const loteTemplate = (row) => (
        <div className="flex flex-column gap-1 align-items-start">
            <span className="font-bold text-700 flex align-items-center gap-1 bg-gray-50 border-1 border-200 px-2 py-1 border-round-md">
                <i className="pi pi-map-marker text-400"></i> {row.loteDescripcion}
            </span>
        </div>
    );

    const estadoTemplate = (row) => (
        <span className={`status-badge-medium ${getBadgeColor(row.estado)}`}>
            {row.estado.replace(/_/g, ' ')}
        </span>
    );

    const pagadoTemplate = (row) => (
        <div className="flex flex-column align-items-end gap-2">
            <span className={`font-black text-base ${row.pagado > 0 ? 'text-green-600' : 'text-500'}`}>
                {row.pagado > 0 ? `S/ ${row.pagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
            </span>
            {row.tipo === TIPO_CONTRATO && (
                <span className={`status-badge-medium ${row.estadoPago === 'AL DIA' ? 'badge-success' : row.estadoPago === 'ATRASADO' ? 'badge-danger' : 'badge-info'}`}>
                    {row.estadoPago}
                </span>
            )}
        </div>
    );

    const fechaTemplate = (row) => {
        const fecha = new Date(row.fecha);
        const formattedDate = fecha.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
        return (
            <span className="historial-fecha-badge text-700 font-bold text-center">
                <i className="pi pi-calendar text-blue-500 mr-2"></i>{formattedDate}
            </span>
        );
    };

    const accionesTemplate = (row) => (
        <div className="flex align-items-center justify-content-center gap-2 opacity-100 lg:opacity-0 hover-actions transition-opacity">
            <Button icon="pi pi-eye" className="p-button-rounded p-button-info p-button-text hover:bg-blue-100 hover:text-blue-700" title="Ver Detalle" onClick={() => abrirDetalle(row)} />
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-secondary p-button-text hover:bg-gray-200 hover:text-700" title="Editar" onClick={() => toast.current?.show({ severity: 'info', summary: 'Edición', detail: 'Función en desarrollo.' })} />
        </div>
    );

    const getBadgeColor = (estado) => {
        if (estado === 'VENDIDO' || estado === 'VIGENTE') return 'badge-success';
        if (estado === 'SEPARADO' || estado === 'RESERVADO') return 'badge-warning';
        if (estado === 'EXPIRADA') return 'badge-danger';
        return 'badge-info'; // Convertida_A_Contrato, etc
    };

    const abrirDetalle = (rowData) => {
        if (rowData.tipo === TIPO_COTIZACION) {
            setCotizacionDetalle(rowData.raw || null);
        } else if (rowData.id != null) {
            navigate(`/detalle_contrato/${rowData.id}`);
        }
    };

    // ==========================================
    // RENDERIZADO
    // ==========================================
    return (
        <div className="historial-page surface-ground p-3 md:p-5 font-sans fade-in">
            <Toast ref={toast} />

            {/* HEADER DE LA PÁGINA */}
            <div className="historial-header flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-4">
                <div>
                    <div className="flex align-items-center gap-3">
                        <div className="bg-blue-600 p-2 border-round-xl text-white shadow-3 flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                            <i className="pi pi-history text-2xl"></i>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-800 m-0">Historial Comercial</h1>
                    </div>
                    <p className="text-500 mt-2 text-sm ml-6 pl-3 m-0">Gestiona y filtra todas las cotizaciones y contratos emitidos.</p>
                </div>
                <div className="historial-header-actions flex align-items-center gap-3 w-full md:w-auto">
                    <Button label="Exportar" icon="pi pi-download" className="historial-btn-neutral p-button-outlined p-button-secondary border-round-xl font-bold w-full md:w-auto text-700" />
                    <Button label="Nueva Operación" icon="pi pi-plus" className="historial-nueva-operacion text-white border-round-xl font-bold shadow-2 w-full md:w-auto" onClick={() => navigate('/cotizacion/nueva')} />
                </div>
            </div>

            {/* TARJETAS DE RESUMEN (KPIs) */}
            <div className="grid grid-nogutter gap-4 mb-5">
                <div className="col-12 md:col flex-1">
                    <div className="historial-kpi-card historial-kpi-blue surface-0 p-4 border-round-2xl border-1 surface-border shadow-1 flex align-items-center gap-4 hover:shadow-3 transition-all">
                        <div className="bg-blue-50 text-blue-600 p-3 border-round-xl flex align-items-center justify-content-center">
                            <i className="pi pi-file-edit text-3xl"></i>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-500 uppercase tracking-widest m-0 mb-1">Contratos Activos</p>
                            <div className="flex align-items-baseline gap-2">
                                <span className="text-2xl font-black text-800">{kpis.contratos}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col flex-1">
                    <div className="historial-kpi-card historial-kpi-purple surface-0 p-4 border-round-2xl border-1 surface-border shadow-1 flex align-items-center gap-4 hover:shadow-3 transition-all">
                        <div className="bg-purple-50 text-purple-600 p-3 border-round-xl flex align-items-center justify-content-center">
                            <i className="pi pi-file text-3xl"></i>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-500 uppercase tracking-widest m-0 mb-1">Cotizaciones Vigentes</p>
                            <div className="flex align-items-baseline gap-2">
                                <span className="text-2xl font-black text-800">{kpis.cotizaciones}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col flex-1">
                    <div className="historial-kpi-card historial-kpi-green surface-0 p-4 border-round-2xl border-1 surface-border shadow-1 flex align-items-center gap-4 hover:shadow-3 transition-all">
                        <div className="bg-green-50 text-green-600 p-3 border-round-xl flex align-items-center justify-content-center">
                            <i className="pi pi-chart-line text-3xl"></i>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-500 uppercase tracking-widest m-0 mb-1">Ingresos Recaudados</p>
                            <div className="flex align-items-baseline gap-2">
                                <span className="text-2xl font-black text-800">S/ {(kpis.ingresos / 1000).toFixed(1)}K</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col flex-1">
                    <div className="historial-kpi-card historial-kpi-danger surface-0 p-4 border-round-2xl border-1 border-red-200 shadow-1 flex align-items-center gap-4 hover:shadow-3 transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-red-50" style={{ width: '4rem', height: '4rem', borderBottomLeftRadius: '100%', zIndex: 0 }}></div>
                        <div className="bg-red-100 text-red-600 p-3 border-round-xl flex align-items-center justify-content-center relative z-1">
                            <i className="pi pi-exclamation-circle text-3xl"></i>
                        </div>
                        <div className="relative z-1">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest m-0 mb-1">Atrasos de Pago</p>
                            <div className="flex align-items-baseline gap-2">
                                <span className="text-2xl font-black text-red-600">{kpis.atrasos}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE FILTROS AVANZADOS */}
            <div className="historial-filters-card surface-0 p-4 border-round-2xl border-1 surface-border shadow-1 mb-5">
                {/* Búsqueda */}
                <div className="mb-3">
                    <div className="p-input-icon-left w-full">
                        <i className="pi pi-search text-500" />
                        <InputText 
                            value={globalFilter} 
                            onChange={(e) => setGlobalFilter(e.target.value)} 
                            placeholder="Buscar por cliente, documento o N° operación..." 
                            className="historial-search-input w-full border-round-xl bg-gray-50 border-none focus:bg-white transition-colors py-3"
                        />
                    </div>
                </div>
                
                {/* Filtros */}
                <div className="flex flex-column sm:flex-row gap-3">
                    <Dropdown value={tipoFiltro} options={tipoOptions} onChange={(e) => setTipoFiltro(e.value)} className="historial-filter-select flex-1 border-round-xl" />
                    <Dropdown value={estadoFiltro} options={estadoOptions} onChange={(e) => setEstadoFiltro(e.value)} className="historial-filter-select flex-1 border-round-xl" />
                    <Dropdown value={pagoFiltro} options={pagoOptions} onChange={(e) => setPagoFiltro(e.value)} className="historial-filter-select flex-1 border-round-xl" />
                    <Button icon="pi pi-refresh" className="historial-refresh-btn p-button-secondary p-button-outlined border-round-xl" onClick={cargarHistorial} title="Actualizar" />
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="historial-table-card surface-0 border-1 surface-border border-round-2xl shadow-1 overflow-hidden">
                <DataTable
                    value={filteredHistorial}
                    paginator
                    rows={10}
                    loading={loading}
                    responsiveLayout="scroll"
                    tableStyle={{ minWidth: '1260px' }}
                    emptyMessage={
                        <div className="p-6 text-center flex flex-column align-items-center">
                            <i className="pi pi-exclamation-circle text-6xl text-300 mb-3"></i>
                            <p className="text-600 font-bold text-lg m-0">No se encontraron resultados</p>
                            <p className="text-400 text-sm mt-1">Prueba ajustando los filtros o el término de búsqueda.</p>
                        </div>
                    }
                    className="premium-datatable historial-table historial-comercial-table"
                    rowHover
                >
                    <Column header="Operación" body={operacionTemplate} style={{ minWidth: '120px' }} />
                    <Column header="Cliente" body={clienteTemplate} style={{ minWidth: '220px' }} />
                    <Column header="Inmueble" body={loteTemplate} style={{ minWidth: '200px' }} />
                    <Column header="Estado" body={estadoTemplate} style={{ minWidth: '110px', textAlign: 'center' }} />
                    <Column header="Precio Total" body={(r) => <span className="font-black text-800 text-base">S/ {r.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>} style={{ minWidth: '130px', textAlign: 'right' }} />
                    <Column header="Total Pagado" body={pagadoTemplate} style={{ minWidth: '140px', textAlign: 'right', backgroundColor: 'rgba(16, 185, 129, 0.05)' }} />
                    <Column header="Último Pago" field="ultimaCuota" style={{ minWidth: '120px', textAlign: 'center', fontWeight: '500' }} />
                    <Column header="Fechas" body={fechaTemplate} style={{ minWidth: '130px', textAlign: 'center' }} />
                    <Column header="Acciones" body={accionesTemplate} style={{ minWidth: '100px', textAlign: 'center' }} />
                </DataTable>
            </div>

            {/* MODAL DETALLE DE COTIZACIÓN (Mantenido de tu código original, con diseño adaptado) */}
            <Dialog
                header={<><i className="pi pi-file-pdf text-primary mr-2 text-xl"></i> Detalles de Cotización {cotizacionDetalle?.id ? `Q-${cotizacionDetalle.id.toString().padStart(4, '0')}` : ''}</>}
                visible={!!cotizacionDetalle}
                style={{ width: '95vw', maxWidth: '1000px' }}
                onHide={() => setCotizacionDetalle(null)}
                footer={
                    <div className="flex justify-content-between align-items-center mt-3 pt-3 border-top-1 surface-border">
                        <span className="text-500 text-sm font-medium">
                            {cotizacionDetalle?.estado === 'VIGENTE' ? `Válida hasta: ${cotizacionDetalle?.fechaValidez}` : 'Esta cotización ya no puede ser procesada.'}
                        </span>
                        <div>
                            <Button label="Cerrar" icon="pi pi-times" onClick={() => setCotizacionDetalle(null)} className="p-button-text text-600 hover:text-800 mr-2 border-round-xl" />
                            <Button label="Convertir a Contrato" icon="pi pi-file-edit" className="p-button-success shadow-3 border-round-xl px-4 py-2 font-bold" disabled={cotizacionDetalle?.estado !== 'VIGENTE'} onClick={() => convertirCotizacion(cotizacionDetalle)} />
                        </div>
                    </div>
                }
            >
                {cotizacionDetalle && (
                    <div className="flex flex-column gap-4 pt-2">
                        {/* Estado y Banner */}
                        <div className={`p-4 border-round-2xl flex align-items-center justify-content-between ${
                            cotizacionDetalle.estado === 'VIGENTE' ? 'bg-green-50 border-1 border-green-200' :
                            cotizacionDetalle.estado === 'CONVERTIDA_A_CONTRATO' ? 'bg-blue-50 border-1 border-blue-200' :
                            'bg-red-50 border-1 border-red-200'
                        }`}>
                            <div>
                                <span className="font-bold block text-800 text-lg mb-1">Estado de la Oferta</span>
                                <span className="text-md text-700">Generada el <strong>{cotizacionDetalle.fechaCotizacion}</strong> por <strong>{cotizacionDetalle.vendedor?.nombres}</strong></span>
                            </div>
                            <div className="text-xl">
                                <Tag severity={cotizacionDetalle.estado === 'VIGENTE' ? 'success' : cotizacionDetalle.estado === 'EXPIRADA' ? 'danger' : 'info'} value={cotizacionDetalle.estado.replace(/_/g, ' ')} />
                            </div>
                        </div>

                        {/* Tarjetas de Detalle */}
                        <div className="grid grid-nogutter gap-4">
                            <div className="col-12 lg:col flex-1 surface-0 border-round-2xl border-1 surface-border p-4 shadow-1">
                                <div className="text-xs font-bold text-500 uppercase tracking-widest mb-3 border-bottom-1 surface-border pb-2"><i className="pi pi-user mr-2 text-blue-500"></i> Prospecto</div>
                                <h3 className="m-0 text-xl font-bold text-800 mb-3">{cotizacionDetalle.interesado?.nombres} {cotizacionDetalle.interesado?.apellidos}</h3>
                                <div className="text-600 text-sm flex flex-column gap-2">
                                    <span><strong>{cotizacionDetalle.interesado?.tipoDocumento}:</strong> {cotizacionDetalle.interesado?.numeroDocumento}</span>
                                    <span><strong>Teléfono:</strong> {cotizacionDetalle.interesado?.telefono || 'N/A'}</span>
                                    <span><strong>Correo:</strong> {cotizacionDetalle.interesado?.email || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="col-12 lg:col flex-1 surface-0 border-round-2xl border-2 border-green-200 p-4 shadow-2 relative overflow-hidden">
                                <i className="pi pi-map absolute text-green-500 opacity-10" style={{ right: '-20px', bottom: '-20px', fontSize: '8rem' }}></i>
                                <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3 border-bottom-1 border-green-100 pb-2"><i className="pi pi-map-marker mr-2"></i> Lote</div>
                                <div className="bg-green-50 border-round-xl p-3 text-center mb-3 border-1 border-green-100">
                                    <div className="text-3xl font-extrabold text-green-700">{cotizacionDetalle.lote?.numero ? `Lote ${cotizacionDetalle.lote.numero}` : 'Lote N/A'}</div>
                                    <div className="text-lg font-bold text-green-600">Mz. {cotizacionDetalle.lote?.manzana?.nombre || 'N/A'}</div>
                                </div>
                                <div className="text-sm text-700 flex flex-column gap-1">
                                    <div className="flex justify-content-between"><span>Área:</span> <strong>{cotizacionDetalle.lote?.area ? `${cotizacionDetalle.lote.area} m2` : 'N/A'}</strong></div>
                                    <div className="flex justify-content-between"><span>Proyecto:</span> <strong className="text-right">{cotizacionDetalle.lote?.manzana?.etapa?.urbanizacion?.nombre || 'N/A'}</strong></div>
                                </div>
                            </div>

                            <div className="col-12 lg:col flex-1 surface-50 border-round-2xl border-1 surface-border p-4 shadow-1">
                                <div className="text-xs font-bold text-500 uppercase tracking-widest mb-3 border-bottom-1 surface-border pb-2"><i className="pi pi-calculator mr-2 text-orange-500"></i> Financiero</div>
                                <div className="flex flex-column gap-3">
                                    <div className="bg-white p-2 border-round-lg border-1 surface-border">
                                        <span className="block text-xs text-500 uppercase tracking-widest mb-1">Precio Total</span>
                                        <span className="block font-black text-800 text-2xl">S/ {cotizacionDetalle.precioTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="bg-white p-2 border-round-lg border-1 surface-border border-left-3 border-blue-500">
                                        <span className="block text-xs text-500 uppercase tracking-widest mb-1">Cuota Inicial</span>
                                        <span className="block font-bold text-blue-600 text-xl">S/ {cotizacionDetalle.montoInicialAcordado?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="bg-white p-2 border-round-lg border-1 surface-border border-left-3 border-orange-500">
                                        <span className="block text-xs text-500 uppercase tracking-widest mb-1">Financiado</span>
                                        <span className="block font-bold text-orange-600 text-xl">{cotizacionDetalle.cantidadCuotas} <span className="text-sm">Cuotas</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default HistorialComercial;