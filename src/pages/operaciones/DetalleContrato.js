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
import PageHeader from '../../components/ui/PageHeader';

import './DetalleContrato.css';

const DetalleContrato = () => {
    const toast = useRef(null);

    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [contrato, setContrato] = useState(null);
    const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);

    useEffect(() => {
        if (id) {
            cargarDetalleContrato(id);
        }
    }, [id]);

    const cargarDetalleContrato = (contratoId) => {
        setLoading(true);
        // Simulamos la llamada a tu backend: ContratoService.obtenerDetalle(contratoIdUrl)
        setTimeout(() => {
            setContrato({
                id: Number(contratoId),
                codigo: `C-${contratoId}`,
                fechaEmision: '10/03/2026',
                vendedor: 'Carlos Asesor',
                cliente: { 
                    nombres: 'Juan', 
                    apellidos: 'Pérez Castillo', 
                    numeroDocumento: '72384732',
                    telefono: '987654321',
                    email: 'juan.perez@email.com'
                },
                lote: { 
                    descripcion: 'Manzana A - Lote 15', 
                    area: '120 m2', 
                    proyecto: 'Villa del Sol' 
                },
                finanzas: {
                    precioTotal: 15500,
                    montoInicial: 500,
                    totalPagado: 2500,
                    saldoDeudor: 13000,
                    cuotasTotales: 36,
                    cuotasPagadas: 2,
                    cuotasAtrasadas: 1,
                    progresoPago: 16
                },
                estadoLote: 'SEPARADO',
                cuotas: [
                    { id: 1, numero: 0, tipo: 'INICIAL', vencimiento: '15/03/2026', montoTotal: 500, montoPagado: 500, estado: 'PAGADO', pagos: [{ id: 'REC-101', montoAbonado: 500, fechaPago: '10/03/2026', metodoPago: 'Efectivo' }] },
                    { id: 2, numero: 1, tipo: 'MENSUAL', vencimiento: '15/04/2026', montoTotal: 1000, montoPagado: 1000, estado: 'PAGADO', pagos: [{ id: 'REC-145', montoAbonado: 1000, fechaPago: '12/04/2026', metodoPago: 'Yape / Plin' }] },
                    { id: 3, numero: 2, tipo: 'MENSUAL', vencimiento: '15/05/2026', montoTotal: 1000, montoPagado: 1000, estado: 'PAGADO', pagos: [{ id: 'REC-189', montoAbonado: 600, fechaPago: '10/05/2026', metodoPago: 'Transferencia BCP' }, { id: 'REC-192', montoAbonado: 400, fechaPago: '12/05/2026', metodoPago: 'Efectivo' }] },
                    { id: 4, numero: 3, tipo: 'MENSUAL', vencimiento: '15/06/2026', montoTotal: 1000, montoPagado: 0, estado: 'VENCIDA', pagos: [] },
                    { id: 5, numero: 4, tipo: 'MENSUAL', vencimiento: '15/07/2026', montoTotal: 363.64, montoPagado: 0, estado: 'PENDIENTE', pagos: [] },
                    { id: 6, numero: 5, tipo: 'MENSUAL', vencimiento: '15/08/2026', montoTotal: 363.64, montoPagado: 0, estado: 'PENDIENTE', pagos: [] }
                ]
            });
            setLoading(false);
        }, 1000);
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
            
            {/* Header de la Página con Botón de Regreso */}
            <div className="flex justify-content-between align-items-center mb-4 pt-3 pl-3 pr-3">
                <div className="flex align-items-center">
                    <Button icon="pi pi-arrow-left" className="p-button-rounded p-button-text p-button-secondary mr-3" aria-label="Volver" onClick={() => navigate('/contrato/lista')} />
                    <div>
                        <h1 className="m-0 text-3xl font-bold text-800 flex align-items-center">
                            <i className="pi pi-file text-primary mr-3 text-3xl"></i> 
                            Detalle del Contrato {contrato.codigo}
                        </h1>
                        <span className="text-500 text-sm ml-5 pl-2">Emitido el {contrato.fechaEmision} por {contrato.vendedor}</span>
                    </div>
                </div>
                <div>
                    <Button label="Imprimir Contrato" icon="pi pi-print" className="p-button-outlined p-button-secondary mr-2" />
                    <Button label="Estado de Cuenta" icon="pi pi-file-pdf" className="p-button-danger" />
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
                                <div className="flex justify-content-between mb-3 border-bottom-1 border-blue-800 pb-2">
                                    <span className="text-2xl font-bold">S/ {contrato.finanzas.precioTotal.toLocaleString()}</span>
                                    <span className="text-2xl font-bold text-green-400">S/ {contrato.finanzas.totalPagado.toLocaleString()}</span>
                                </div>
                                
                                <div className="flex justify-content-between align-items-center mb-1">
                                    <span className="text-sm font-bold text-orange-300">Saldo Deudor: S/ {contrato.finanzas.saldoDeudor.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-blue-200">{contrato.finanzas.progresoPago}%</span>
                                </div>
                                <ProgressBar value={contrato.finanzas.progresoPago} displayValueTemplate={() => ''} style={{ height: '8px' }} color="var(--green-400)" className="bg-blue-800 border-none"></ProgressBar>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 2. SECCIÓN INFERIOR: SPLIT VIEW (CRONOGRAMA VS RECIBOS) */}
                {/* ========================================================= */}
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
                                onSelectionChange={(e) => setCuotaSeleccionada(e.value)}
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
                                                    <div key={i} className="surface-0 border-1 surface-border border-round-xl p-3 shadow-1 hover:border-primary transition-colors cursor-pointer" title="Haga clic para ver o descargar voucher">
                                                        <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 surface-border pb-2">
                                                            <div className="flex align-items-center">
                                                                <i className="pi pi-file-pdf text-red-500 text-xl mr-2"></i>
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
            </div>
        </div>
    );
};

export default DetalleContrato;