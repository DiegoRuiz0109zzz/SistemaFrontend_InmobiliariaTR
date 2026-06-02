import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ContratoService } from '../../service/ContratoService';
import { CuotaService } from '../../service/CuotaService';

import './ListaContratos.css';

const ListaContratos = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);
    const navigate = useNavigate();

    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [documentoVisible, setDocumentoVisible] = useState(false);
    const [documentoUrl, setDocumentoUrl] = useState(null);
    const [documentoIsPdf, setDocumentoIsPdf] = useState(false);

    const cerrarDocumentoDialog = () => {
        if (documentoUrl) {
            URL.revokeObjectURL(documentoUrl);
        }
        setDocumentoUrl(null);
        setDocumentoIsPdf(false);
        setDocumentoVisible(false);
    };

    const dt = useRef(null);

    const exportCSV = () => {
        if (dt.current) {
            dt.current.exportCSV();
        }
    };


    // Filter states
    const [globalFilter, setGlobalFilter] = useState('');
    const [estadoContratoFilter, setEstadoContratoFilter] = useState('Todos');
    const [estadoPagosFilter, setEstadoPagosFilter] = useState('Todas las Deudas');
    const [proyectoFilter, setProyectoFilter] = useState('Todas las Ubicaciones');
    const [documentoFilter, setDocumentoFilter] = useState('Todos');
    const [inicialFilter, setInicialFilter] = useState('Todas');
    const [especialesFilter, setEspecialesFilter] = useState('Todas');
    const [fechaEmisionFilter, setFechaEmisionFilter] = useState(null);

    useEffect(() => {
        cargarContratos();
    }, []);

    const cargarContratos = async () => {
        setLoading(true);
        try {
            const response = await ContratoService.listar(axiosInstance);
            const contratosList = Array.isArray(response) ? response : [];

            const listaFormateada = await Promise.all(contratosList.map(async (item) => {
                let totalPagadoReal = item.abonoInicialReal || item.montoInicial || 0;
                let precioTotalCalculado = item.precioTotal || 1;
                let cuotasList = [];

                try {
                    const cuotasRaw = await CuotaService.listarPorContrato(item.id, axiosInstance);
                    cuotasList = Array.isArray(cuotasRaw) ? cuotasRaw : [];

                    if (cuotasList.length > 0) {
                        totalPagadoReal = cuotasList.reduce((acc, cuota) => acc + (cuota.montoPagado || 0), 0);
                        precioTotalCalculado = item.precioTotal || cuotasList.reduce((acc, cuota) => acc + (cuota.montoTotal || cuota.monto || 0), 0);
                    }
                } catch (error) {
                    console.warn(`No se pudieron cargar cuotas de contrato ${item.id}`, error);
                }

                const progresoReal = Math.min(100, Math.round((totalPagadoReal / precioTotalCalculado) * 100));

                // Determinar estado de pago
                let estadoPago = 'AL DIA';
                if (progresoReal >= 100) {
                    estadoPago = 'PAGADO TOTAL';
                } else {
                    let maxDiasAtraso = 0;
                    const tieneAtraso = cuotasList.some(c => {
                        const est = c.estado || '';
                        const estUpper = est.toUpperCase();
                        let currentAtraso = 0;

                        if (c.pagoADestiempo && c.diasRetraso) {
                            currentAtraso = c.diasRetraso;
                        }

                        const fechaVencimientoStr = c.vencimientoRaw || c.fechaVencimiento || c.vencimiento;
                        if (fechaVencimientoStr) {
                            let fecha;
                            if (fechaVencimientoStr.includes('/')) {
                                const [dia, mes, anio] = fechaVencimientoStr.split('/');
                                fecha = new Date(anio, mes - 1, dia);
                            } else if (fechaVencimientoStr.includes('-')) {
                                const [anio, mes, dia] = fechaVencimientoStr.split('T')[0].split('-');
                                fecha = new Date(anio, mes - 1, dia);
                            } else {
                                fecha = new Date(fechaVencimientoStr);
                            }
                            const hoy = new Date();
                            hoy.setHours(0, 0, 0, 0);
                            fecha.setHours(0, 0, 0, 0);
                            const diff = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
                            if (diff > 0 && (estUpper === 'VENCIDA' || estUpper === 'VENCIDO' || estUpper === 'ATRASADA' || estUpper === 'ATRASADO' || estUpper === 'PENDIENTE' || estUpper === 'PAGADO_PARCIAL')) {
                                currentAtraso = diff;
                            }
                        }

                        if (currentAtraso > maxDiasAtraso) maxDiasAtraso = currentAtraso;

                        return (estUpper === 'VENCIDA' || estUpper === 'VENCIDO' || estUpper === 'ATRASADA' || estUpper === 'ATRASADO' || c.pagoADestiempo || currentAtraso > 0);
                    });

                    if (tieneAtraso) {
                        estadoPago = maxDiasAtraso > 0 ? `VENCIDO (${maxDiasAtraso}d)` : 'PAG. DESTIEMPO';
                    }
                }

                // Determinar tipo inicial
                let tipoInicialFmt = item.tipoInicial || 'TOTAL';
                if (tipoInicialFmt.toUpperCase() === 'PARCIAL') tipoInicialFmt = 'PARCIAL';

                let estadoLoteValue = item.lote?.estadoVenta;
                
                if (tipoInicialFmt === 'PARCIAL') {
                    estadoLoteValue = 'SEPARADO';
                } else if (!estadoLoteValue) {
                    estadoLoteValue = totalPagadoReal < (item.montoInicialAcordado || 0) ? 'SEPARADO' : 'VENDIDO';
                }

                if (estadoLoteValue === 'VENDIDO') estadoLoteValue = 'ACTIVO';

                const documentoFirmadoUrl = typeof item.urlDocumentoFirmado === 'string'
                    ? item.urlDocumentoFirmado.trim()
                    : '';

                return {
                    ...item,
                    id: item.id,
                    codigo: `C-${item.id?.toString().padStart(4, '0')}`,
                    cliente: item.cliente || { nombres: 'Desconocido', apellidos: '', numeroDocumento: 'N/A' },
                    lote: item.lote || { descripcion: 'No asignado' },
                    precioTotal: precioTotalCalculado,
                    totalPagado: totalPagadoReal,
                    estadoLote: estadoLoteValue,
                    fechaEmision: item.fechaRegistro || item.createdAt,
                    fechaEmisionFmt: item.fechaRegistro ? new Date(item.fechaRegistro).toISOString().split('T')[0] : 'N/A',
                    progreso: progresoReal,
                    estadoPago,
                    tieneDocumento: Boolean(documentoFirmadoUrl),
                    tipoInicialFmt,
                    tieneEspeciales: !!item.cuotasEspeciales && item.cuotasEspeciales > 0
                };
            }));

            listaFormateada.sort((a, b) => b.id - a.id);
            setContratos(listaFormateada);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los contratos.' });
        } finally {
            setLoading(false);
        }
    };

    // Filter Options
    const estadoContratoOptions = [{ label: 'Todos', value: 'Todos' }, { label: 'Activo', value: 'ACTIVO' }, { label: 'Separado', value: 'SEPARADO' }];
    const estadoPagosOptions = [{ label: 'Todas las Deudas', value: 'Todas las Deudas' }, { label: 'Al Día', value: 'AL DIA' }, { label: 'Atrasado', value: 'ATRASADO' }, { label: 'Cancelado', value: 'CANCELADO' }];
    const documentoOptions = [{ label: 'Todos', value: 'Todos' }, { label: 'Firmado', value: 'FIRMADO' }, { label: 'Sin Firmar', value: 'SIN_FIRMAR' }];
    const inicialOptions = [{ label: 'Todas', value: 'Todas' }, { label: 'Total', value: 'TOTAL' }, { label: 'Parcial', value: 'PARCIAL' }];
    const especialesOptions = [{ label: 'Todas', value: 'Todas' }, { label: 'Con Especiales', value: 'CON_ESPECIAL' }, { label: 'Sin Especiales', value: 'SIN_ESPECIAL' }];

    const proyectoOptions = useMemo(() => {
        const urbs = new Set();
        contratos.forEach(c => {
            const u = c.lote?.manzana?.etapa?.urbanizacion?.nombre;
            if (u) urbs.add(u);
        });
        return [{ label: 'Todas las Ubicaciones', value: 'Todas las Ubicaciones' }, ...Array.from(urbs).map(u => ({ label: `Urb. ${u}`, value: u }))];
    }, [contratos]);

    // Apply Filters
    const filteredContratos = useMemo(() => {
        return contratos.filter(item => {
            let match = true;
            if (globalFilter) {
                const search = globalFilter.toLowerCase();
                const cliente = `${item.cliente.nombres} ${item.cliente.apellidos}`.toLowerCase();
                const doc = item.cliente.numeroDocumento?.toLowerCase() || '';
                const code = item.codigo.toLowerCase();
                if (!cliente.includes(search) && !doc.includes(search) && !code.includes(search)) match = false;
            }
            if (estadoContratoFilter !== 'Todos' && item.estadoLote !== estadoContratoFilter) match = false;
            if (estadoPagosFilter !== 'Todas las Deudas' && item.estadoPago !== estadoPagosFilter) match = false;
            if (proyectoFilter !== 'Todas las Ubicaciones' && item.lote?.manzana?.etapa?.urbanizacion?.nombre !== proyectoFilter) match = false;
            if (documentoFilter === 'FIRMADO' && !item.tieneDocumento) match = false;
            if (documentoFilter === 'SIN_FIRMAR' && item.tieneDocumento) match = false;
            if (inicialFilter !== 'Todas' && item.tipoInicialFmt !== inicialFilter) match = false;
            if (especialesFilter === 'CON_ESPECIAL' && !item.tieneEspeciales) match = false;
            if (especialesFilter === 'SIN_ESPECIAL' && item.tieneEspeciales) match = false;
            if (fechaEmisionFilter) {
                const itemDate = new Date(item.fechaEmision);
                if (itemDate.toDateString() !== fechaEmisionFilter.toDateString()) match = false;
            }
            return match;
        });
    }, [contratos, globalFilter, estadoContratoFilter, estadoPagosFilter, proyectoFilter, documentoFilter, inicialFilter, especialesFilter, fechaEmisionFilter]);

    // KPIs
    const kpis = useMemo(() => {
        const activos = contratos.length;
        const vendido = contratos.reduce((acc, c) => acc + c.precioTotal, 0);
        const recaudado = contratos.reduce((acc, c) => acc + c.totalPagado, 0);
        const progresoGlobal = vendido > 0 ? (recaudado / vendido) * 100 : 0;
        const atrasos = contratos.filter(c => c.estadoPago.includes('DESTIEMPO') || c.estadoPago.includes('VENCIDO')).length;
        return { activos, vendido, recaudado, progresoGlobal, atrasos };
    }, [contratos]);

    // Templates
    const contratoTemplate = (row) => (
        <div className="flex align-items-center gap-2">
            <div className="flex align-items-center justify-content-center border-round text-blue-500 bg-blue-50" style={{ width: '32px', height: '32px' }}>
                <i className="pi pi-file" />
            </div>
            <div className="flex flex-column">
                <span className="font-bold text-800">{row.codigo}</span>
                <span className="text-xs text-500 flex align-items-center gap-1 mt-1"><i className="pi pi-calendar" style={{ fontSize: '0.7rem' }}></i> {row.fechaEmisionFmt}</span>
            </div>
        </div>
    );

    const clienteTemplate = (row) => (
        <div className="flex flex-column">
            <span className="font-bold text-800 text-sm">{row.cliente.nombres} {row.cliente.apellidos}</span>
            <span className="text-xs text-500 flex align-items-center gap-1 mt-1"><i className="pi pi-id-card text-400" style={{ fontSize: '0.7rem' }}></i> Doc: {row.cliente.numeroDocumento}</span>
        </div>
    );

    const inmuebleTemplate = (row) => {
        const mz = row.lote?.manzana?.nombre || '';
        const loteNum = row.lote?.numero || '';
        const urb = row.lote?.manzana?.etapa?.urbanizacion?.nombre || '';
        const etapa = row.lote?.manzana?.etapa?.nombre || '';
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

    const estadoDocTemplate = (row) => (
        <div className="flex flex-column align-items-center gap-2">
            <span className={`dt-tag ${row.estadoLote === 'ACTIVO' ? 'dt-tag-activo' : 'dt-tag-separado'}`}>{row.estadoLote}</span>
            <div className={`flex align-items-center justify-content-center border-round px-2 py-1 ${row.tieneDocumento ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <i className={row.tieneDocumento ? "pi pi-file-check mr-1" : "pi pi-file-excel mr-1"} style={{ fontSize: '0.8rem' }}></i>
                <span className="text-xs font-bold" style={{ fontSize: '0.7rem' }}>{row.tieneDocumento ? 'Firmado' : 'Sin Doc'}</span>
            </div>
        </div>
    );

    const precioVentaTemplate = (row) => (
        <span className="font-black text-800">S/ {row.precioTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    );

    const recaudadoTemplate = (row) => (
        <span className="font-black text-green-600">S/ {row.totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    );

    const progresoEstadoTemplate = (row) => {
        let estadoBadge;
        if (row.estadoPago === 'PAGADO TOTAL') {
            estadoBadge = <span className="dt-tag-pagado-total" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>PAGADO TOTAL</span>;
        } else if (row.estadoPago.includes('VENCIDO') || row.estadoPago.includes('DESTIEMPO')) {
            estadoBadge = <span className="dt-tag-destiempo" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}><i className="pi pi-exclamation-triangle text-xs mr-1"></i> {row.estadoPago}</span>;
        } else {
            estadoBadge = <span className="dt-tag-bordered dt-tag-aldia" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>AL DIA</span>;
        }

        const colorBarra = row.estadoPago.includes('VENCIDO') ? 'var(--red-500)' : 'var(--green-500)';

        return (
            <div className="flex flex-column align-items-center gap-2" style={{ minWidth: '90px', margin: '0 auto' }}>
                {estadoBadge}
                <div className="w-full mt-1">
                    <div className="flex justify-content-center align-items-center mb-1">
                        <span className="text-xs font-bold text-600">{row.progreso}% Pagado</span>
                    </div>
                    <ProgressBar value={row.progreso} displayValueTemplate={() => ''} style={{ height: '6px', width: '100%', borderRadius: '4px' }} color={colorBarra}></ProgressBar>
                </div>
            </div>
        );
    };

    const abrirVisorDocumento = async (row) => {
        if (!row.tieneDocumento) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'No hay documento firmado asociado al contrato.' });
            return;
        }

        try {
            const blob = await ContratoService.descargarDocumentoFirmado(row.id, axiosInstance);
            const url = URL.createObjectURL(blob);
            setDocumentoUrl(url);
            setDocumentoIsPdf((blob?.type || '').toLowerCase().includes('pdf'));
            setDocumentoVisible(true);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el documento.' });
        }
    };

    const isPdf = () => documentoIsPdf;

    const accionesTemplate = (row) => (
        <div className="flex align-items-center justify-content-center gap-4 dt-actions-group">

            <Button icon="pi pi-file-pdf" className="p-button-text p-button-info p-button-rounded text-3xl" onClick={() => abrirVisorDocumento(row)} tooltip="Ver Documento" tooltipOptions={{ position: 'top' }} />
            <Button label="Ver Detalle" className="btn-primary-custom shadow-2 border-round-xl font-bold" onClick={() => navigate(`/detalle_contrato/${row.id}`)} />
            {/* <Button icon="pi pi-file-edit" className="p-button-text p-button-danger p-button-rounded text-3xl" tooltip="Editar" tooltipOptions={{ position: 'top' }} /> */}
        </div>
    );

    return (
        <div className="listacontratos-premium">
            <Toast ref={toast} />

            <Dialog header={<><i className="pi pi-file-pdf text-blue-500 mr-2"></i>Documento Firmado</>} visible={documentoVisible} style={{ width: 'min(900px, 95vw)', height: '80vh' }} onHide={cerrarDocumentoDialog} modal>
                {documentoUrl && (
                    <div className="flex justify-content-center align-items-center h-full border-round overflow-hidden">
                        {isPdf() ? (
                            <iframe src={documentoUrl} title="Documento" className="w-full h-full border-none" style={{ minHeight: '65vh' }} />
                        ) : (
                            <img src={documentoUrl} alt="Documento" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
                        )}
                    </div>
                )}
            </Dialog>

            {/* Header Area */}
            <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-4 gap-3">
                <div className="flex align-items-center gap-3">
                    <div className="bg-blue-600 text-white p-3 border-round-xl shadow-2 flex align-items-center justify-content-center">
                        <i className="pi pi-history text-2xl"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-800 m-0">Historial Comercial</h1>
                        <p className="text-500 text-sm mt-1 m-0 font-medium">Monitorea ventas, cobranzas y el estado de la documentación de tus clientes.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button label="Exportar" icon="pi pi-download" className="p-button-outlined p-button-secondary border-round-xl font-bold bg-white" onClick={exportCSV} />
                    <Button label="Nuevo Contrato" icon="pi pi-plus" className="btn-primary-custom shadow-2 border-round-xl font-bold" onClick={() => navigate('/contrato/nuevo')} />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-nogutter gap-3 mb-4">
                <div className="col flex-1">
                    <div className="kpi-card surface-0 p-4 border-round-2xl shadow-1 flex align-items-center gap-4">
                        <div className="kpi-icon bg-blue-50 text-blue-500 border-round-lg flex align-items-center justify-content-center p-3">
                            <i className="pi pi-file-check text-2xl"></i>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-500 uppercase m-0 mb-1 tracking-widest">Contratos Activos</p>
                            <div className="flex align-items-baseline gap-2">
                                <span className="text-3xl font-black text-800">{kpis.activos}</span>
                                <span className="text-xs text-500 font-medium">Operaciones</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col flex-1">
                    <div className="kpi-card surface-0 p-4 border-round-2xl shadow-1 flex align-items-center gap-4">
                        <div className="kpi-icon bg-teal-50 text-teal-500 border-round-lg flex align-items-center justify-content-center p-3">
                            <i className="pi pi-chart-line text-2xl"></i>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-500 uppercase m-0 mb-1 tracking-widest">Total Vendido</p>
                            <div className="flex align-items-baseline gap-2">
                                <span className="text-2xl font-black text-800">S/ {kpis.vendido.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col flex-1">
                    <div className="kpi-card surface-0 p-4 border-round-2xl shadow-1 flex align-items-center gap-4 border-left-3 border-purple-500">
                        <div className="kpi-icon bg-purple-50 text-purple-500 border-round-lg flex align-items-center justify-content-center p-3">
                            <i className="pi pi-wallet text-2xl"></i>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-500 uppercase m-0 mb-1 tracking-widest">Total Recaudado</p>
                            <span className="text-2xl font-black text-purple-600 block mb-1">S/ {kpis.recaudado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 border-round-sm">Avance: {kpis.progresoGlobal.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                <div className="col flex-1">
                    <div className="kpi-card surface-0 p-4 border-round-2xl shadow-1 flex align-items-center gap-4 border-1 border-red-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-red-50" style={{ width: '5rem', height: '5rem', borderBottomLeftRadius: '100%', zIndex: 0 }}></div>
                        <div className="kpi-icon bg-red-100 text-red-500 border-round-lg flex align-items-center justify-content-center p-3 relative z-1">
                            <i className="pi pi-exclamation-circle text-2xl"></i>
                        </div>
                        <div className="relative z-1">
                            <p className="text-xs font-bold text-red-400 uppercase m-0 mb-1 tracking-widest">Atrasos de Pago</p>
                            <div className="flex align-items-baseline gap-2">
                                <span className="text-3xl font-black text-red-600">{kpis.atrasos}</span>
                                <span className="text-xs text-red-400 font-bold border-1 border-red-200 px-2 py-1 border-round-sm bg-white">Clientes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="surface-0 p-4 border-round-2xl shadow-1 mb-4">
                <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-3">
                    <h3 className="m-0 text-lg font-bold text-700 flex align-items-center gap-2">
                        <i className="pi pi-filter text-blue-500"></i> Filtros de Búsqueda
                    </h3>
                    <span className="p-input-icon-left w-full md:w-25rem shadow-1 border-round-xl">
                        <i className="pi pi-search" />
                        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar cliente, DNI o N° contrato..." className="w-full bg-white border-1 surface-border border-round-xl p-3" />
                    </span>
                </div>

                <div className="grid grid-nogutter gap-3 filter-grid">
                    <div className="col">
                        <label className="block text-xs font-bold text-600 mb-2 uppercase">Est. Contrato</label>
                        <Dropdown value={estadoContratoFilter} options={estadoContratoOptions} onChange={(e) => setEstadoContratoFilter(e.value)} className="w-full bg-white border-1 surface-border shadow-1 border-round-lg font-bold" />
                    </div>
                    <div className="col">
                        <label className="block text-xs font-bold text-600 mb-2 uppercase">Est. Pagos</label>
                        <Dropdown value={estadoPagosFilter} options={estadoPagosOptions} onChange={(e) => setEstadoPagosFilter(e.value)} className="w-full bg-white border-1 surface-border shadow-1 border-round-lg font-bold" />
                    </div>
                    <div className="col">
                        <label className="block text-xs font-bold text-600 mb-2 uppercase">Proyecto y Lote</label>
                        <Dropdown value={proyectoFilter} options={proyectoOptions} onChange={(e) => setProyectoFilter(e.value)} className="w-full bg-white border-1 surface-border shadow-1 border-round-lg font-bold" />
                    </div>
                    <div className="col">
                        <label className="block text-xs font-bold text-600 mb-2 uppercase">Documento</label>
                        <Dropdown value={documentoFilter} options={documentoOptions} onChange={(e) => setDocumentoFilter(e.value)} className="w-full bg-white border-1 surface-border shadow-1 border-round-lg font-bold" />
                    </div>
                </div>

                <div className="grid grid-nogutter gap-3 mt-3 filter-grid">
                    <div className="col">
                        <label className="block text-xs font-bold text-600 mb-2 uppercase">Inicial</label>
                        <Dropdown value={inicialFilter} options={inicialOptions} onChange={(e) => setInicialFilter(e.value)} className="w-full bg-white border-1 surface-border shadow-1 border-round-lg font-bold" />
                    </div>
                    <div className="col">
                        <label className="block text-xs font-bold text-600 mb-2 uppercase">Especiales</label>
                        <Dropdown value={especialesFilter} options={especialesOptions} onChange={(e) => setEspecialesFilter(e.value)} className="w-full bg-white border-1 surface-border shadow-1 border-round-lg font-bold" />
                    </div>
                    <div className="col">
                        <label className="block text-xs font-bold text-600 mb-2 uppercase">Fecha Emisión</label>
                        <Calendar value={fechaEmisionFilter} onChange={(e) => setFechaEmisionFilter(e.value)} placeholder="dd/mm/aaaa" dateFormat="dd/mm/yy" className="w-full shadow-1 border-round-lg calendar-custom font-bold" showIcon />
                    </div>
                    <div className="col"></div>
                </div>
            </div>

            {/* DataTable */}
            <div className="surface-0 border-round-2xl shadow-1 overflow-hidden">
                <DataTable
                    ref={dt}
                    value={filteredContratos}
                    paginator
                    rows={7}
                    loading={loading}
                    className="premium-table"
                    stripedRows={false}
                    emptyMessage="No se encontraron contratos con estos filtros."
                    exportFilename="Contratos"
                    paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
                    currentPageReportTemplate="Mostrando {last} contratos"
                >
                    <Column header="1. CONTRATO" body={contratoTemplate} style={{ minWidth: '150px' }} />
                    <Column header="2. CLIENTE" body={clienteTemplate} style={{ minWidth: '220px' }} />
                    <Column header="3. INMUEBLE" body={inmuebleTemplate} style={{ minWidth: '250px' }} />
                    <Column header="4. ESTADO" body={estadoDocTemplate} style={{ minWidth: '120px', textAlign: 'center' }} />
                    <Column header="5. PRECIO VENTA" body={precioVentaTemplate} style={{ minWidth: '130px', textAlign: 'center', fontWeight: 'bold' }} />
                    <Column header="6. RECAUDADO" body={recaudadoTemplate} style={{ minWidth: '130px', textAlign: 'center', fontWeight: 'bold', backgroundColor: 'var(--green-50)' }} />
                    <Column header="7. PROGRESO PAGO" body={progresoEstadoTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                    <Column header="8. ACCIONES" body={accionesTemplate} style={{ minWidth: '130px', textAlign: 'center' }} />
                </DataTable>
            </div>
        </div>
    );
};

export default ListaContratos;