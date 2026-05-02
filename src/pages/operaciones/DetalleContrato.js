import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ContratoService } from '../../service/ContratoService';
import { CuotaService } from '../../service/CuotaService';
import { PagoService } from '../../service/PagoService';
import { ContratoHistorialService } from '../../service/ContratoHistorialService';

import './DetalleContrato.css';

const DetalleContrato = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [contrato, setContrato] = useState(null);
    const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);
    const [voucherViewer, setVoucherViewer] = useState(null);
    const [historiales, setHistoriales] = useState([]);
    const [pdfViewer, setPdfViewer] = useState(null);
    const [showGenerarDialog, setShowGenerarDialog] = useState(false);
    const [nuevoEstadoSeleccionado, setNuevoEstadoSeleccionado] = useState('ACTIVO');
    const [generandoPdf, setGenerandoPdf] = useState(false);

    const buildVoucherUrl = (url) => url ? `http://localhost:8080/${url.replace(/^\//, '')}` : null;
    const isPdf = (url) => url && url.toLowerCase().endsWith('.pdf');

    useEffect(() => {
        if (id) {
            cargarDetalleContrato(id);
        }
    }, [id]);

    const cargarDetalleContrato = async (contratoId) => {
        setLoading(true);
        try {
            const data = await ContratoService.obtener(contratoId, axiosInstance);
            const cuotasRaw = await CuotaService.listarPorContrato(contratoId, axiosInstance);
            const histRaw = await ContratoHistorialService.listarPorContrato(contratoId, axiosInstance);
            
            setHistoriales(Array.isArray(histRaw) ? histRaw : []);
            
            const cuotasList = Array.isArray(cuotasRaw) ? cuotasRaw : [];
            
            // Si el backend incluye las cuotas, calculamos el total pagado de verdad:
            let totalPagadoReal = 0;
            let cuotasAtrasadas = 0;
            let cuotasPagadas = 0;
            
            const cuotasFormateadas = cuotasList.map(cuota => {
                const pagadoEnCuota = cuota.montoPagado || 0;
                totalPagadoReal += pagadoEnCuota;
                
                if(cuota.estado === 'VENCIDA' || cuota.estado === 'ATRASADA') cuotasAtrasadas++;
                if(cuota.estado === 'PAGADO') cuotasPagadas++;
                
                return {
                    ...cuota,
                    numero: cuota.numeroCuota !== undefined ? cuota.numeroCuota : cuota.numero,
                    vencimiento: cuota.fechaVencimiento ? new Date(cuota.fechaVencimiento).toLocaleDateString() : 'N/A',
                    montoTotal: cuota.montoTotal || cuota.monto || 0,
                    montoPagado: pagadoEnCuota,
                    estado: cuota.estado || 'PENDIENTE',
                    pagos: [] // Lo llenaremos on-demand al hacer click
                };
            });

            // Si no hay cuotas aún, usamos el abono inicial como fallback
            const abonoInicial = data.abonoInicialReal || data.montoInicial || 0;
            if (totalPagadoReal === 0 && abonoInicial > 0 && cuotasList.length === 0) {
                totalPagadoReal = abonoInicial;
            }
            
            const precioTotal = data.precioTotal || 1;

            // Determinar si la Cuota 0 (Inicial) está incompleta
            const cuota0 = cuotasFormateadas.find(c => c.numero === 0 || c.tipo === 'INICIAL');
            const faltaPagarInicial = cuota0 ? Math.max(0, cuota0.montoTotal - cuota0.montoPagado) : 0;

            setContrato({
                id: Number(contratoId),
                codigo: `C-${contratoId.toString().padStart(4, '0')}`,
                fechaEmision: data.fechaRegistro ? new Date(data.fechaRegistro).toLocaleDateString() : 'N/A',
                vendedor: data.vendedor ? `${data.vendedor.nombres} ${data.vendedor.apellidos}` : 'No asignado',
                cliente: { 
                    nombres: data.cliente?.nombres || 'Desconocido', 
                    apellidos: data.cliente?.apellidos || '', 
                    numeroDocumento: data.cliente?.numeroDocumento || 'N/A',
                    telefono: data.cliente?.telefono || 'N/A',
                    email: data.cliente?.email || 'N/A'
                },
                lote: { 
                    descripcion: data.lote?.descripcion || (data.lote?.numero ? `Mza ${data.lote?.manzana?.nombre || ''} - Lote ${data.lote?.numero}` : 'No asignado'), 
                    area: data.lote?.area ? `${data.lote.area} m2` : 'N/A', 
                    proyecto: data.lote?.manzana?.etapa?.urbanizacion?.nombre || 'N/A' 
                },
                finanzas: {
                    precioTotal: data.precioTotal || 0,
                    montoInicial: data.montoInicialAcordado || 0,
                    saldoFinanciar: data.saldoFinanciar || Math.max(0, (data.precioTotal || 0) - (data.montoInicialAcordado || 0)),
                    totalPagado: totalPagadoReal,
                    saldoDeudor: (data.precioTotal || 0) - totalPagadoReal,
                    cuotasTotales: data.cantidadCuotas || 0,
                    cuotasPagadas: cuotasPagadas,
                    cuotasAtrasadas: cuotasAtrasadas,
                    progresoPago: Math.min(100, Math.round((totalPagadoReal / precioTotal) * 100)),
                    faltaPagarInicial: faltaPagarInicial
                },
                estadoLote: data.lote?.estadoVenta || 'SEPARADO',
                estadoContrato: data.estado || 'ACTIVO',
                cuotas: cuotasFormateadas
            });
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el contrato o sus cuotas.' });
        } finally {
            setLoading(false);
        }
    };

    const seleccionarCuota = async (cuota) => {
        setCuotaSeleccionada(cuota);
        if (!cuota) return;
        try {
            const pagosRaw = await PagoService.listarPorCuota(cuota.id, axiosInstance);
            const pagosFormateados = (pagosRaw || []).map(p => ({
                ...p,
                id: `REC-${p.id}`,
                fechaPago: p.fechaPago ? new Date(p.fechaPago).toLocaleString() : 'N/A',
                montoAbonado: p.montoAbonado || p.monto || 0,
                metodoPago: p.metodoPago || p.metodo || 'No especificado'
            }));
            setCuotaSeleccionada(prev => ({ ...prev, pagos: pagosFormateados }));
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'warn', summary: 'Pagos', detail: 'No se pudieron cargar los recibos de esta cuota.' });
        }
    };

    const verHistorialPdf = async (historialId) => {
        try {
            const blob = await ContratoHistorialService.descargarPdf(historialId, axiosInstance);
            const url = URL.createObjectURL(blob);
            setPdfViewer(url);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el PDF histórico.' });
        }
    };

    const handleGenerarDocumento = async () => {
        setGenerandoPdf(true);
        try {
            await ContratoService.generarDocumento(contrato.id, nuevoEstadoSeleccionado, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Documento generado e historial actualizado.' });
            setShowGenerarDialog(false);
            cargarDetalleContrato(contrato.id); // Recargar para mostrar el nuevo historial
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al generar el documento.' });
        } finally {
            setGenerandoPdf(false);
        }
    };

    // ==========================================
    // TEMPLATES
    // ==========================================
    const estadoCuotaTemplate = (r) => {
        if (r.estado === 'PAGADO') return <Tag severity="success" value="PAGADO" />;
        if (r.estado === 'PENDIENTE') return <Tag severity="info" value="PENDIENTE" />;
        if (r.estado === 'VENCIDA') return <Tag severity="danger" value="VENCIDA" icon="pi pi-exclamation-triangle" />;
        return <Tag value={r.estado} />;
    };

    if (loading) {
        return (
            <div className="p-4">
                <Skeleton width="300px" height="3rem" className="mb-4" />
                <div className="grid">
                    <div className="col-12 md:col-4"><Skeleton height="150px" /></div>
                    <div className="col-12 md:col-4"><Skeleton height="150px" /></div>
                    <div className="col-12 md:col-4"><Skeleton height="150px" /></div>
                </div>
                <Skeleton height="400px" className="mt-4" />
            </div>
        );
    }

    if (!contrato) return <div>Contrato no encontrado</div>;

    return (
        <div className="detallecontrato-page">
            <Toast ref={toast} />

            {/* ===== MODAL VISOR DE VOUCHER ===== */}
            <Dialog
                header={<><i className="pi pi-image text-blue-500 mr-2"></i>Comprobante de Pago</>}
                visible={!!voucherViewer}
                style={{ width: '700px', maxWidth: '95vw' }}
                onHide={() => setVoucherViewer(null)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Descargar" icon="pi pi-download" className="p-button-info" onClick={() => window.open(voucherViewer, '_blank')} />
                        <Button label="Cerrar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setVoucherViewer(null)} />
                    </div>
                }
            >
                {voucherViewer && (
                    <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px', background: '#f8f9fa', borderRadius: '8px' }}>
                        {isPdf(voucherViewer) ? (
                            <iframe src={voucherViewer} title="Voucher" style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }} />
                        ) : (
                            <img src={voucherViewer} alt="Voucher de Pago" style={{ maxWidth: '100%', maxHeight: '550px', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                        )}
                    </div>
                )}
            </Dialog>

            {/* ===== MODAL VISOR DE PDF HISTORICO ===== */}
            <Dialog
                header={<><i className="pi pi-file-pdf text-red-500 mr-2"></i>Documento Histórico</>}
                visible={!!pdfViewer}
                style={{ width: '700px', maxWidth: '95vw' }}
                onHide={() => {
                    if (pdfViewer) URL.revokeObjectURL(pdfViewer);
                    setPdfViewer(null);
                }}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cerrar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => {
                            if (pdfViewer) URL.revokeObjectURL(pdfViewer);
                            setPdfViewer(null);
                        }} />
                    </div>
                }
            >
                {pdfViewer && (
                    <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <iframe src={pdfViewer} title="Documento Histórico" style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }} />
                    </div>
                )}
            </Dialog>

            {/* ===== MODAL GENERAR DOCUMENTO ===== */}
            <Dialog
                header={<><i className="pi pi-cog text-primary mr-2"></i>Generar Documento Oficial</>}
                visible={showGenerarDialog}
                style={{ width: '400px' }}
                onHide={() => setShowGenerarDialog(false)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setShowGenerarDialog(false)} disabled={generandoPdf} />
                        <Button label="Generar" icon="pi pi-check" className="btn-primary-custom" onClick={handleGenerarDocumento} loading={generandoPdf} />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 pt-2">
                    <p className="m-0 text-600">Seleccione el estado que se asignará al contrato y para el cual se generará el documento oficial.</p>
                    <div className="flex flex-column gap-2">
                        <label className="font-bold text-700">Estado del Contrato</label>
                        <Dropdown 
                            value={nuevoEstadoSeleccionado} 
                            options={[
                                { label: 'Separado (Abono Parcial)', value: 'SEPARADO' },
                                { label: 'Activo (Venta Concretada)', value: 'ACTIVO' },
                                { label: 'Finalizado (Pagado al 100%)', value: 'FINALIZADO' },
                                { label: 'Resuelto (Anulado)', value: 'RESUELTO' }
                            ]} 
                            onChange={(e) => setNuevoEstadoSeleccionado(e.value)} 
                            placeholder="Seleccione un estado" 
                            className="w-full"
                        />
                    </div>
                </div>
            </Dialog>
            
            {/* Header de la Página con Botón de Regreso */}
            <div className="flex justify-content-between align-items-center mb-4 pt-3 pl-3 pr-3">
                <div className="flex align-items-center">
                    <Button icon="pi pi-arrow-left" className="p-button-rounded p-button-text text-700 hover:surface-200 transition-colors mr-3" aria-label="Volver" onClick={() => navigate('/contrato/lista')} />
                    <div>
                        <h1 className="m-0 text-3xl font-bold text-800 flex align-items-center">
                            <i className="pi pi-file text-primary mr-3 text-3xl"></i> 
                            Detalle del Contrato {contrato.codigo}
                            <Tag className="ml-3" value={contrato.estadoContrato} severity={contrato.estadoContrato === 'ACTIVO' ? 'success' : 'info'} />
                        </h1>
                        <span className="text-500 text-sm ml-5 pl-2">Emitido el {contrato.fechaEmision} por {contrato.vendedor}</span>
                    </div>
                </div>
                <div>
                    <Button label="Generar Documento" icon="pi pi-file-pdf" className="p-button-outlined p-button-danger mr-3 border-round-xl font-bold shadow-1" onClick={() => setShowGenerarDialog(true)} />
                    <Button label="Ir a Cobranza" icon="pi pi-wallet" className="btn-primary-custom border-round-xl shadow-2" onClick={() => navigate('/cuotas-pagos', { state: { buscarContrato: contrato.cliente.numeroDocumento } })} />
                </div>
            </div>

            <div className="main-content px-3 pb-4">
                
                {/* ========================================================= */}
                {/* 1. SECCIÓN SUPERIOR: TARJETAS DE RESUMEN (MAESTRO) */}
                {/* ========================================================= */}
                <div className="grid mb-4">
                    
                    {/* Tarjeta 1: Cliente */}
                    <div className="col-12 lg:col-4">
                        <div className="resumen-card shadow-2 border-none">
                            <div className="icon-wrapper bg-blue-50 text-blue-600">
                                <i className="pi pi-user text-3xl"></i>
                            </div>
                            <div className="resumen-info w-full">
                                <span className="text-xs font-bold text-500 uppercase tracking-wide">Titular del Contrato</span>
                                <span className="font-black text-xl text-800 mt-1">{contrato.cliente.nombres} {contrato.cliente.apellidos}</span>
                                <div className="flex flex-column gap-1 mt-2 text-sm text-600">
                                    <span><i className="pi pi-id-card mr-2 text-400"></i>DNI: {contrato.cliente.numeroDocumento}</span>
                                    <span><i className="pi pi-phone mr-2 text-400"></i>{contrato.cliente.telefono}</span>
                                    <span><i className="pi pi-envelope mr-2 text-400"></i>{contrato.cliente.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 2: Lote */}
                    <div className="col-12 lg:col-4">
                        <div className="resumen-card shadow-2 border-none">
                            <div className="icon-wrapper bg-green-50 text-green-600">
                                <i className="pi pi-map-marker text-3xl"></i>
                            </div>
                            <div className="resumen-info w-full">
                                <div className="flex justify-content-between align-items-start">
                                    <span className="text-xs font-bold text-500 uppercase tracking-wide">Inmueble Adquirido</span>
                                    <Tag severity={contrato.estadoLote === 'VENDIDO' ? 'success' : 'warning'} value={contrato.estadoLote} />
                                </div>
                                <span className="font-black text-xl text-800 mt-1">{contrato.lote.descripcion}</span>
                                <div className="flex flex-column gap-1 mt-2 text-sm text-600">
                                    <span><i className="pi pi-building mr-2 text-400"></i>Proyecto: {contrato.lote.proyecto}</span>
                                    <span><i className="pi pi-clone mr-2 text-400"></i>Área: {contrato.lote.area}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 3: Finanzas */}
                    <div className="col-12 lg:col-4">
                        <div className="resumen-card shadow-2 border-none bg-blue-900 text-white">
                            <div className="resumen-info w-full">
                                <div className="flex justify-content-between mb-2">
                                    <span className="text-sm font-medium text-blue-200 uppercase">Precio Total</span>
                                    <span className="text-sm font-medium text-blue-200 uppercase">Total Pagado</span>
                                </div>
                                <div className="flex justify-content-between mb-2 border-bottom-1 border-blue-800 pb-2">
                                    <span className="text-2xl font-bold">S/ {contrato.finanzas.precioTotal.toLocaleString()}</span>
                                    <span className="text-2xl font-bold text-green-400">S/ {contrato.finanzas.totalPagado.toLocaleString()}</span>
                                </div>
                                
                                <div className="flex justify-content-between align-items-center mb-2">
                                    <span className="text-sm font-medium text-blue-200" title="Saldo a Financiar (Después de la Inicial)">A Financiar: S/ {contrato.finanzas.saldoFinanciar.toLocaleString()}</span>
                                    <span className="text-sm font-bold text-orange-300">Deuda Real: S/ {contrato.finanzas.saldoDeudor.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-content-between align-items-center mb-1">
                                    <span className="text-xs font-medium text-blue-300">Progreso de Pago</span>
                                    <span className="text-xs font-bold text-blue-200">{contrato.finanzas.progresoPago}%</span>
                                </div>
                                <ProgressBar value={contrato.finanzas.progresoPago} displayValueTemplate={() => ''} style={{ height: '8px' }} color="var(--green-400)" className="bg-blue-800 border-none mb-2"></ProgressBar>

                                {contrato.finanzas.faltaPagarInicial > 0 && (
                                    <div className="mt-2 bg-orange-500 text-white p-2 border-round text-xs font-bold flex align-items-center justify-content-center shadow-1">
                                        <i className="pi pi-exclamation-circle mr-2 text-base"></i>
                                        Cuota 0 Incompleta (Falta: S/ {contrato.finanzas.faltaPagarInicial.toLocaleString()})
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 2. SECCIÓN INFERIOR: SPLIT VIEW (CRONOGRAMA VS RECIBOS) */}
                {/* ========================================================= */}
                <TabView className="mt-4">
                    <TabPanel header="Estado de Cuenta" leftIcon="pi pi-wallet">
                        <div className="grid h-full" style={{ minHeight: '600px' }}>
                            
                            {/* PANEL IZQUIERDO: CRONOGRAMA INTERACTIVO */}
                            <div className="col-12 lg:col-8 flex flex-column">
                                <div className="split-panel flex-1 shadow-2 border-none">
                                    <div className="bg-white border-bottom-1 surface-border p-4 flex justify-content-between align-items-center">
                                        <div>
                                            <h2 className="m-0 text-800 flex align-items-center"><i className="pi pi-calendar text-primary mr-2"></i> Cronograma de Cuotas</h2>
                                            <span className="text-500 text-sm mt-1 block">Seleccione una cuota para ver sus pagos a la derecha.</span>
                                        </div>
                                        {contrato.finanzas.cuotasAtrasadas > 0 && (
                                            <Tag severity="danger" icon="pi pi-exclamation-triangle" value={`${contrato.finanzas.cuotasAtrasadas} Cuota(s) Atrasada(s)`} className="text-base px-3 py-2" />
                                        )}
                                    </div>
                                    
                                    <DataTable 
                                        value={contrato.cuotas} 
                                        selectionMode="single" 
                                        selection={cuotaSeleccionada} 
                                        onSelectionChange={(e) => seleccionarCuota(e.value)}
                                        dataKey="id"
                                        scrollable scrollHeight="500px" 
                                        className="p-datatable-lg interactive-table"
                                        rowClassName={(r) => ({ 'bg-red-50': r.estado === 'VENCIDA' })}
                                    >
                                        <Column field="numero" header="N°" body={(r) => r.numero === 0 ? '0 (Ini)' : r.numero} style={{ width: '8%', fontWeight: 'bold' }}></Column>
                                        <Column field="vencimiento" header="Vence" style={{ width: '18%' }} body={(r) => <><i className="pi pi-calendar mr-2 text-400"></i>{r.vencimiento}</>}></Column>
                                        <Column header="Monto" body={(r) => `S/ ${r.montoTotal.toLocaleString('en-US',{minimumFractionDigits:2})}`} style={{ width: '20%', textAlign: 'right', fontWeight: 'bold', color: 'var(--surface-800)' }}></Column>
                                        <Column header="Deuda" body={(r) => r.montoTotal - r.montoPagado > 0 ? <span className="text-orange-600 font-bold">S/ {(r.montoTotal - r.montoPagado).toLocaleString('en-US',{minimumFractionDigits:2})}</span> : '-'} style={{ width: '20%', textAlign: 'right' }}></Column>
                                        <Column header="Estado" body={estadoCuotaTemplate} style={{ width: '20%', textAlign: 'center' }}></Column>
                                        <Column body={() => <i className="pi pi-chevron-right text-400"></i>} style={{ width: '5%', textAlign: 'center' }}></Column>
                                    </DataTable>
                                </div>
                            </div>

                            {/* PANEL DERECHO: DETALLE DEL PAGO SELECCIONADO */}
                            <div className="col-12 lg:col-4 flex flex-column">
                                <div className="split-panel flex-1 border-none shadow-2 border-top-3 border-primary bg-gray-50">
                                    
                                    <div className="bg-white p-4 border-bottom-1 surface-border">
                                        <h3 className="m-0 flex align-items-center text-800"><i className="pi pi-receipt mr-2 text-primary"></i> Detalle de Abonos</h3>
                                    </div>
                                    
                                    <div className="p-4 flex-1 overflow-y-auto">
                                        {!cuotaSeleccionada ? (
                                            <div className="flex flex-column align-items-center justify-content-center h-full text-500 text-center">
                                                <div className="surface-200 border-circle w-6rem h-6rem flex align-items-center justify-content-center mb-3">
                                                    <i className="pi pi-search text-4xl text-400"></i>
                                                </div>
                                                <span className="font-bold text-xl mb-2 text-700">Explore los Pagos</span>
                                                <span className="text-sm px-3 line-height-3">Haga clic en cualquier fila del cronograma de la izquierda para desplegar aquí los vouchers y métodos de pago de esa cuota.</span>
                                            </div>
                                        ) : (
                                            <div className="fade-in">
                                                {/* Resumen de la Cuota seleccionada */}
                                                <div className="surface-0 border-1 surface-border border-round-xl p-4 mb-4 shadow-1 text-center bg-blue-50">
                                                    <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">Cuota N° {cuotaSeleccionada.numero}</span>
                                                    <div className="text-4xl font-black text-blue-900 mt-2 mb-3">S/ {cuotaSeleccionada.montoTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                                                    <div className="flex justify-content-center gap-3 text-sm font-medium text-600">
                                                        <span><i className="pi pi-calendar mr-1 text-blue-500"></i> Vence: {cuotaSeleccionada.vencimiento}</span>
                                                        <Divider layout="vertical" className="m-0" />
                                                        <span>{estadoCuotaTemplate(cuotaSeleccionada)}</span>
                                                    </div>
                                                </div>

                                                <div className="text-sm font-bold text-500 uppercase tracking-wide mb-3 pl-1">Historial de Recibos</div>
                                                
                                                {cuotaSeleccionada.pagos && cuotaSeleccionada.pagos.length > 0 ? (
                                                    <div className="flex flex-column gap-3">
                                                        {cuotaSeleccionada.pagos.map((pago, i) => (
                                                            <div key={i} className="surface-0 border-1 surface-border border-round-xl p-3 shadow-1 hover:border-primary transition-colors" style={{ cursor: pago.fotoVoucherUrl ? 'pointer' : 'default' }} title={pago.fotoVoucherUrl ? "Haga clic para ver el voucher" : "Sin voucher adjunto"} onClick={() => pago.fotoVoucherUrl && setVoucherViewer(buildVoucherUrl(pago.fotoVoucherUrl))}>
                                                                <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 surface-border pb-2">
                                                                    <div className="flex align-items-center">
                                                                        <i className={`pi ${pago.fotoVoucherUrl ? 'pi-image text-blue-500' : 'pi-file-pdf text-red-500'} text-xl mr-2`}></i>
                                                                        <span className="font-bold text-700">{pago.id}</span>
                                                                    </div>
                                                                    <span className="text-xs text-500 bg-surface-100 px-2 py-1 border-round">{pago.fechaPago}</span>
                                                                </div>
                                                                <div className="flex justify-content-between align-items-end">
                                                                    <div className="flex flex-column">
                                                                        <span className="text-xs text-500 mb-1">Método de pago</span>
                                                                        <span className="text-sm font-bold text-700 flex align-items-center"><i className="pi pi-wallet mr-2 text-primary"></i> {pago.metodoPago}</span>
                                                                    </div>
                                                                    <span className="font-black text-green-600 text-xl">S/ {pago.montoAbonado.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        
                                                        <div className="mt-3 p-3 bg-green-50 border-round-xl border-1 border-green-100 flex justify-content-between align-items-center">
                                                            <span className="text-base font-bold text-green-800">Total Pagado:</span>
                                                            <span className="text-2xl font-black text-green-700">S/ {cuotaSeleccionada.montoPagado.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="surface-0 border-dashed border-2 surface-border border-round-xl p-6 text-center text-400 mt-2 bg-surface-50">
                                                        <i className="pi pi-ban text-5xl mb-3 opacity-50"></i>
                                                        <p className="m-0 font-bold text-lg text-600">No hay abonos</p>
                                                        <p className="text-sm mt-2">Esta cuota aún no registra ningún pago en el sistema.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </TabPanel>
                    
                    <TabPanel header="Historial de Modificaciones" leftIcon="pi pi-history">
                        <div className="card border-none shadow-2 p-4 surface-0">
                            <h3 className="m-0 mb-3 flex align-items-center text-800"><i className="pi pi-history mr-2 text-primary"></i> Registro Histórico</h3>
                            <DataTable value={historiales} emptyMessage="No hay historial registrado." className="p-datatable-sm" paginator rows={10}>
                                <Column field="id" header="ID" style={{width: '5%'}}></Column>
                                <Column field="estado" header="Estado" body={(r) => <Tag value={r.estado} severity={r.estado === 'ACTIVO' ? 'success' : 'warning'} />} style={{width: '15%'}}></Column>
                                <Column field="fechaRegistro" header="Fecha" body={(r) => new Date(r.fechaRegistro).toLocaleString()} style={{width: '20%'}}></Column>
                                <Column field="observacion" header="Observación" style={{width: '40%'}}></Column>
                                <Column body={(r) => (
                                    <div className="flex gap-2 justify-content-center">
                                        {r.rutaDocumentoPdf && (
                                            <Button icon="pi pi-file-pdf" className="p-button-rounded p-button-danger p-button-text" title="Ver PDF Histórico" onClick={() => verHistorialPdf(r.id)} />
                                        )}
                                    </div>
                                )} style={{width: '20%', textAlign: 'center'}}></Column>
                            </DataTable>
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
};

export default DetalleContrato;