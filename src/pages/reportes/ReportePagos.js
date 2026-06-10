import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { PagoService } from '../../service/PagoService';
import '../Usuario.css';

const ReportePagos = () => {
    const { axiosInstance } = useAuth();
    const dt = useRef(null);
    const toast = useRef(null);

    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    
    // Pagination state
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 15,
        page: 0
    });

    // Filtros visuales
    const [globalFilter, setGlobalFilter] = useState('');
    const [fechasGeneracion, setFechasGeneracion] = useState(null);
    const [metodoPago, setMetodoPago] = useState(null);
    const [tipoComprobante, setTipoComprobante] = useState(null);
    const [estadoPago, setEstadoPago] = useState(null);

    const metodosList = [
        { label: 'Efectivo', value: 'EFECTIVO' },
        { label: 'Transferencia', value: 'TRANSFERENCIA' },
        { label: 'Depósito', value: 'DEPOSITO' },
        { label: 'Yape', value: 'YAPE' },
        { label: 'Plin', value: 'PLIN' },
        { label: 'Tarjeta', value: 'TARJETA' }
    ];

    const comprobantesList = [
        { label: 'Recibo de Ingreso', value: 'RECIBO_INGRESO' },
        { label: 'Boleta', value: 'BOLETA' },
        { label: 'Factura', value: 'FACTURA' },
        { label: 'Nota de Abono', value: 'NOTA_ABONO' }
    ];

    const estadosList = [
        { label: 'Procesado', value: 'PROCESADO' },
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'Anulado', value: 'ANULADO' }
    ];

    const cargarPagos = useCallback(async () => {
        setLoading(true);
        try {
            let fechaDesde = null;
            let fechaHasta = null;

            if (fechasGeneracion && fechasGeneracion[0]) {
                const fd = new Date(fechasGeneracion[0]);
                fechaDesde = fd.toISOString().split('T')[0];
            }
            if (fechasGeneracion && fechasGeneracion[1]) {
                const fh = new Date(fechasGeneracion[1]);
                fechaHasta = fh.toISOString().split('T')[0];
            }

            const filtros = {
                // termino: globalFilter || '', // El backend aún no soporta búsqueda por texto
                fechaDesde: fechaDesde || '',
                fechaHasta: fechaHasta || '',
                metodoPago: metodoPago || '',
                tipoComprobante: tipoComprobante || '',
                estado: estadoPago || ''
            };

            const data = await PagoService.listarPagosPaginados(lazyParams.page, lazyParams.rows, filtros, axiosInstance);
            
            let content = [];
            let total = 0;
            
            if (data && data.content) {
                // Spring Boot Page<T> directo
                content = data.content;
                total = data.totalElements || data.content.length;
            } else if (data && data.data && data.data.content) {
                // Wrapper personalizado ApiResponse<Page<T>>
                content = data.data.content;
                total = data.data.totalElements || data.data.content.length;
            } else if (Array.isArray(data)) {
                // List<T> directo
                content = data;
                total = data.length;
            } else if (data && Array.isArray(data.data)) {
                // Wrapper personalizado ApiResponse<List<T>>
                content = data.data;
                total = data.data.length;
            }
            
            setPagos(content);
            setTotalRecords(total);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pagos efectuados.' });
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, lazyParams, fechasGeneracion, metodoPago, tipoComprobante, estadoPago]);

    useEffect(() => {
        const timer = setTimeout(() => {
            cargarPagos();
        }, 400); // 400ms debounce
        return () => clearTimeout(timer);
    }, [cargarPagos]);

    const onPage = (event) => {
        setLazyParams(event);
    };

    const handleGlobalFilterChange = (e) => {
        setGlobalFilter(e.target.value);
        setLazyParams(prev => ({ ...prev, first: 0, page: 0 }));
    };

    const handleFechaChange = (e) => {
        setFechasGeneracion(e.value);
        setLazyParams(prev => ({ ...prev, first: 0, page: 0 }));
    };

    const handleMetodoChange = (e) => {
        setMetodoPago(e.value);
        setLazyParams(prev => ({ ...prev, first: 0, page: 0 }));
    };

    const handleTipoChange = (e) => {
        setTipoComprobante(e.value);
        setLazyParams(prev => ({ ...prev, first: 0, page: 0 }));
    };

    const handleEstadoChange = (e) => {
        setEstadoPago(e.value);
        setLazyParams(prev => ({ ...prev, first: 0, page: 0 }));
    };

    const formatCurrency = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        if (dateString.includes('T')) {
            const d = new Date(dateString);
            if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('es-PE');
        }
        const [anio, mes, dia] = dateString.split('-');
        if(anio && mes && dia) return `${dia}/${mes}/${anio}`;
        return dateString;
    };

    const estadoBodyTemplate = (rowData) => {
        const st = (rowData.estado || rowData.estadoPago || '').toUpperCase();
        let severity = 'info';
        if (st === 'PROCESADO') severity = 'success';
        else if (st === 'PENDIENTE' || st === 'POR_VALIDAR') severity = 'warning';
        else if (st === 'ANULADO') severity = 'danger';
        return <Tag value={st} severity={severity} className="font-bold px-2 py-1" />;
    };

    const getEtiquetaComprobante = (tipo) => {
        switch ((tipo || '').toUpperCase()) {
            case 'RECIBO_INGRESO': return 'Recibo de Ingreso';
            case 'NOTA_ABONO': return 'Nota de Abono';
            case 'BOLETA': return 'Boleta';
            case 'FACTURA': return 'Factura';
            case 'NOTA_CREDITO': return 'Nota de Crédito';
            case 'NOTA_DEBITO': return 'Nota de Débito';
            default: return 'Comprobante';
        }
    };

    const handleDescargarComprobante = async (pago) => {
        try {
            const etiqueta = getEtiquetaComprobante(pago?.tipoComprobante);
            toast.current?.show({ severity: 'info', summary: 'Descargando...', detail: `Generando ${etiqueta}` });

            let blob = null;
            if (pago?.numeroComprobante) {
                if ((pago?.tipoComprobante || '').toUpperCase() === 'RECIBO_INGRESO') {
                    blob = await PagoService.descargarReciboIngresoPdf(pago.numeroComprobante, axiosInstance);
                } else {
                    blob = await PagoService.descargarComprobantePdf(pago.numeroComprobante, axiosInstance);
                }
            } else if (pago?.id) {
                blob = await PagoService.descargarNotaVenta(pago.id, axiosInstance);
            }

            if (!blob) throw new Error('No se pudo resolver el comprobante.');

            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el comprobante.' });
        }
    };

    const limpiarFiltros = () => {
        setGlobalFilter('');
        setFechasGeneracion(null);
        setMetodoPago(null);
        setTipoComprobante(null);
        setEstadoPago(null);
        setLazyParams({ first: 0, rows: 15, page: 0 });
    };

    const exportCSV = () => {
        // En un escenario de lazy load real, exportar exporta solo la página actual.
        // Se requeriría un endpoint backend para exportar todo si el usuario lo necesita.
        dt.current?.exportCSV();
    };

    const renderHeader = () => {
        return (
            <div className="flex flex-column gap-3">
                <div style={{ padding: '0.5rem 0 1rem 0' }}>
                    <h3 className="text-lg font-bold mb-4 mt-0" style={{ color: 'var(--text-primary)' }}>Filtros de Búsqueda</h3>
                    <div className="formgrid grid">
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Rango de Fecha de Pago</label>
                            <Calendar
                                value={fechasGeneracion}
                                onChange={handleFechaChange}
                                selectionMode="range"
                                readOnlyInput
                                hideOnRangeSelection
                                dateFormat="dd/mm/yy"
                                placeholder="Fechas"
                                showClear
                                showIcon
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Método de Pago</label>
                            <Dropdown
                                value={metodoPago}
                                options={metodosList}
                                onChange={handleMetodoChange}
                                placeholder="Todos"
                                showClear
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Tipo de Comprobante</label>
                            <Dropdown
                                value={tipoComprobante}
                                options={comprobantesList}
                                onChange={handleTipoChange}
                                placeholder="Todos"
                                showClear
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm block mb-2 text-700">Estado del Pago</label>
                            <Dropdown
                                value={estadoPago}
                                options={estadosList}
                                onChange={handleEstadoChange}
                                placeholder="Todos"
                                showClear
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div className="flex align-items-center gap-3">
                        <div className="bg-primary-reverse text-primary border-round px-4 py-2 flex align-items-center gap-2">
                            <i className="pi pi-check-square text-xl" />
                            <div>
                                <span className="block text-sm">Total Registros (Backend)</span>
                                <span className="block font-bold text-xl">{totalRecords} pagos</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <div className="p-input-icon-left" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                            <i className="pi pi-search" style={{ position: 'absolute', left: '0.85rem', zIndex: 1, color: 'var(--theme-primary)', pointerEvents: 'none' }} />
                            <InputText
                                value={globalFilter}
                                onChange={handleGlobalFilterChange}
                                placeholder="Buscar cliente, contrato, comprobante..."
                                style={{ borderRadius: '8px', minWidth: '300px', paddingLeft: '2.5rem' }}
                            />
                        </div>
                        <Button icon="pi pi-filter-slash" className="p-button-outlined p-button-secondary" tooltip="Limpiar todos los filtros" tooltipOptions={{ position: 'bottom' }} onClick={limpiarFiltros} style={{ borderRadius: '8px' }} />
                        <Button icon="pi pi-download" className="btn-export" tooltip="Exportar a CSV" tooltipOptions={{ position: 'bottom' }} onClick={exportCSV} />
                    </div>
                </div>
            </div>
        );
    };

    // Templates
    const clienteContratoTemplate = (r) => {
        const cliente = r.cuota?.contrato?.cliente;
        const nombre = cliente ? `${cliente.nombres} ${cliente.apellidos}`.trim() : 'N/A';
        const doc = cliente?.numeroDocumento || '';
        const contratoNro = r.cuota?.contrato?.nroContrato || `C-${r.cuota?.contrato?.id}`;
        
        return (
            <div className="flex flex-column">
                <span className="font-bold text-800 text-sm">{nombre}</span>
                {doc && <span className="text-xs text-500 mt-1"><i className="pi pi-id-card text-400 mr-1"></i>DNI/RUC: {doc}</span>}
                <span className="text-xs text-blue-600 font-bold mt-1"><i className="pi pi-file text-blue-400 mr-1"></i>{contratoNro}</span>
            </div>
        );
    };

    const operacionTemplate = (r) => (
        <div className="flex flex-column">
            <span>{r.metodoPago}</span>
            {r.numeroOperacion && <small className="text-500">Op: {r.numeroOperacion}</small>}
        </div>
    );

    const comprobanteTemplate = (r) => (
        <div className="flex flex-column">
            <span className="font-bold text-800">{r.numeroComprobante || `REC-${r.id}`}</span>
        </div>
    );

    return (
        <div className="usuario-page reporte-pagos-page">
            <div className="container">
                <PageHeader
                    title="Reporte de Pagos Efectuados"
                    description="Visualiza todos los pagos realizados a nivel general con paginación optimizada."
                    icon="pi pi-money-bill"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <DataTable
                            ref={dt}
                            value={pagos}
                            lazy
                            first={lazyParams.first}
                            rows={lazyParams.rows}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            paginator
                            rowsPerPageOptions={[10, 15, 25, 50]}
                            loading={loading}
                            emptyMessage="No se encontraron pagos efectuados."
                            header={renderHeader()}
                            exportFilename="Reporte_Pagos_Efectuados"
                            className="p-datatable-sm shadow-1 border-round-lg overflow-hidden mt-3"
                        >
                            <Column field="numeroComprobante" header="Comprobante" body={comprobanteTemplate} style={{width: '12%'}}></Column>
                            <Column header="Cliente y Contrato" body={clienteContratoTemplate} style={{width: '25%'}}></Column>
                            <Column field="fechaPago" header="Fecha de Pago" body={(r) => formatDate(r.fechaPago)} style={{width: '12%'}}></Column>
                            <Column field="cuota.numeroCuota" header="Cuota N°" body={(r) => r.cuota?.numeroCuota === 0 ? 'Inicial' : (r.cuota?.numeroCuota || r.cuota?.numero)} align="center" style={{width: '8%'}}></Column>
                            <Column header="Método y Operación" body={operacionTemplate} style={{width: '15%'}}></Column>
                            <Column field="montoAbonado" header="Monto (S/)" body={(r) => <span className="font-bold text-green-700">{formatCurrency(r.montoAbonado)}</span>} align="right" style={{width: '10%'}}></Column>
                            <Column field="estado" header="Estado" body={estadoBodyTemplate} align="center" style={{width: '10%'}}></Column>
                            <Column header="Acciones" body={(r) => (
                                <div className="flex align-items-center justify-content-center">
                                    {(r.numeroComprobante || r.id) && (
                                        <Button
                                            icon="pi pi-file-pdf"
                                            className="p-button-rounded p-button-danger p-button-text"
                                            tooltip={`Descargar ${getEtiquetaComprobante(r.tipoComprobante)}`}
                                            onClick={() => handleDescargarComprobante(r)}
                                        />
                                    )}
                                </div>
                            )} align="center" style={{width: '8%'}}></Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportePagos;
