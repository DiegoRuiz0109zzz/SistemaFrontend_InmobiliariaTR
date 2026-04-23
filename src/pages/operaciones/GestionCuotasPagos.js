import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ContratoService } from '../../service/ContratoService';
import { CuotaService } from '../../service/CuotaService';
import { PagoService } from '../../service/PagoService';

import './GestionCuotasPagos.css';

const GestionCuotasPagos = () => {
    const toast = useRef(null);
    const location = useLocation();
    const { axiosInstance } = useAuth();

    // ==========================================
    // ESTADOS DEL BUSCADOR Y RESUMEN
    // ==========================================
    const [criterioBusqueda, setCriterioBusqueda] = useState('');
    const [contratoActivo, setContratoActivo] = useState(null);

    // ==========================================
    // ESTADOS DE PAGOS Y MODALES
    // ==========================================
    const [cuotaPagar, setCuotaPagar] = useState(null);
    const [montoAbonar, setMontoAbonar] = useState(0);
    const [metodoPago, setMetodoPago] = useState('Transferencia BCP');
    const [numOperacion, setNumOperacion] = useState('');
    const [detalleCuota, setDetalleCuota] = useState(null); // Para el Modal de detalles

    // Selectores
    const metodosPago = [
        { label: 'Transferencia BCP', value: 'Transferencia BCP' },
        { label: 'Transferencia BBVA', value: 'Transferencia BBVA' },
        { label: 'Yape / Plin', value: 'Yape / Plin' },
        { label: 'Efectivo (Caja)', value: 'Efectivo (Caja)' }
    ];

    // Historial de pagos
    const [historialPagos, setHistorialPagos] = useState([]);

    const normalizeText = (value) => (value || '').toString().toLowerCase();
    const formatMoney = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const buildLoteLabel = (contrato) => {
        if (!contrato?.lote) return '';
        const manzana = contrato?.lote?.manzana?.nombre || '';
        const etapa = contrato?.lote?.manzana?.etapa?.nombre || '';
        const urbanizacion = contrato?.lote?.manzana?.etapa?.urbanizacion?.nombre || '';
        const loteNumero = contrato?.lote?.numero || '';
        return `${urbanizacion} / ${etapa} / Mz ${manzana} - Lote ${loteNumero}`.replace(/^\s*\/\s*/g, '').trim();
    };

    const mapCuotas = (cuotas) => (cuotas || []).map((cuota) => ({
        id: cuota.id,
        numero: cuota.numeroCuota,
        tipo: cuota.numeroCuota === 0 ? 'INICIAL' : 'MENSUAL',
        vencimiento: cuota.fechaVencimiento,
        monto: cuota.montoTotal || 0,
        pagado: cuota.montoPagado || 0,
        estado: cuota.estado
    }));

    const cargarPagosHistorial = async (contratoResumen, cuotas) => {
        if (!contratoResumen || cuotas.length === 0) {
            setHistorialPagos([]);
            return;
        }

        try {
            const pagosPorCuota = await Promise.all(
                cuotas.map((cuota) => PagoService.listarPorCuota(cuota.id, axiosInstance))
            );
            const flattened = pagosPorCuota.flat().map((pago) => ({
                id: pago.id,
                contrato: contratoResumen.id,
                cliente: contratoResumen.cliente,
                monto: pago.montoAbonado || pago.monto || 0,
                metodo: pago.metodoPago || pago.metodo || '---',
                fecha: pago.fechaPago || pago.fecha || '',
                estado: pago.estado || 'Procesado'
            }));
            setHistorialPagos(flattened);
        } catch (error) {
            setHistorialPagos([]);
        }
    };

    // ==========================================
    // LÓGICA DE BÚSQUEDA Y PAGOS
    // ==========================================
    useEffect(() => {
        if (location.state?.buscarContrato) {
            setCriterioBusqueda(location.state.buscarContrato);
            buscarContrato(location.state.buscarContrato);
            // Limpiar state del historial para evitar búsquedas repetidas al retroceder
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const buscarContrato = async (paramCriterio) => {
        const busqueda = typeof paramCriterio === 'string' ? paramCriterio : criterioBusqueda;
        
        if (busqueda.length < 4) {
            toast.current.show({ severity: 'warn', summary: 'Búsqueda inválida', detail: 'Ingrese al menos 4 caracteres del DNI o N° de Contrato.' });
            return;
        }

        try {
            const criterio = normalizeText(busqueda);
            const contratos = await ContratoService.listar(axiosInstance);
            const listado = Array.isArray(contratos) ? contratos : [];
            const encontrado = listado.find((contrato) => {
                const contratoId = normalizeText(contrato?.id);
                const documento = normalizeText(contrato?.cliente?.numeroDocumento);
                const nombres = normalizeText(`${contrato?.cliente?.nombres || ''} ${contrato?.cliente?.apellidos || ''}`);
                return contratoId.includes(criterio) || documento.includes(criterio) || nombres.includes(criterio);
            });

            if (!encontrado) {
                setContratoActivo(null);
                setHistorialPagos([]);
                toast.current.show({ severity: 'warn', summary: 'Sin resultados', detail: 'No se encontró un contrato con ese criterio.' });
                return;
            }

            const cuotasRaw = await CuotaService.listarPorContrato(encontrado.id, axiosInstance);
            const cuotas = mapCuotas(cuotasRaw || []);
            const totalPagado = cuotas.reduce((acc, cuota) => acc + (cuota.pagado || 0), 0);
            const precioTotal = encontrado.precioTotal || cuotas.reduce((acc, cuota) => acc + (cuota.monto || 0), 0);
            const saldoDeudor = precioTotal - totalPagado;
            const cuotasAtrasadas = cuotas.filter((cuota) => cuota.estado === 'VENCIDA').length;

            const resumenContrato = {
                id: encontrado.id,
                cliente: `${encontrado?.cliente?.nombres || ''} ${encontrado?.cliente?.apellidos || ''}`.trim(),
                lote: buildLoteLabel(encontrado),
                precioTotal,
                totalPagado,
                saldoDeudor,
                cuotasAtrasadas,
                cuotas
            };

            setContratoActivo(resumenContrato);
            setCuotaPagar(null);
            await cargarPagosHistorial(resumenContrato, cuotas);
            toast.current.show({ severity: 'success', summary: 'Encontrado', detail: 'Estado de cuenta cargado correctamente.' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el estado de cuenta.' });
        }
    };

    const abrirPanelPago = (cuota) => {
        setCuotaPagar(cuota);
        setMontoAbonar(cuota.monto - cuota.pagado);
    };

    const cargarDetalleCuota = async (cuota) => {
        try {
            const pagos = await PagoService.listarPorCuota(cuota.id, axiosInstance);
            setDetalleCuota({ ...cuota, pagos: pagos || [] });
        } catch (error) {
            setDetalleCuota({ ...cuota, pagos: [] });
            toast.current?.show({ severity: 'warn', summary: 'Detalle', detail: 'No se pudieron cargar los pagos de la cuota.' });
        }
    };

    const registrarPago = async () => {
        if (!cuotaPagar?.id) {
            toast.current.show({ severity: 'warn', summary: 'Pago inválido', detail: 'Seleccione una cuota válida.' });
            return;
        }
        if (montoAbonar <= 0) {
            toast.current.show({ severity: 'warn', summary: 'Monto inválido', detail: 'El monto debe ser mayor a cero.' });
            return;
        }

        try {
            const payload = {
                cuotaId: cuotaPagar.id,
                montoAbonado: montoAbonar,
                metodoPago,
                numeroOperacion: numOperacion
            };
            await PagoService.registrar(payload, axiosInstance);

            const cuotasRaw = await CuotaService.listarPorContrato(contratoActivo.id, axiosInstance);
            const cuotas = mapCuotas(cuotasRaw || []);
            const totalPagado = cuotas.reduce((acc, cuota) => acc + (cuota.pagado || 0), 0);
            const precioTotal = contratoActivo.precioTotal || cuotas.reduce((acc, cuota) => acc + (cuota.monto || 0), 0);
            const saldoDeudor = precioTotal - totalPagado;
            const cuotasAtrasadas = cuotas.filter((cuota) => cuota.estado === 'VENCIDA').length;

            const resumenContrato = {
                ...contratoActivo,
                totalPagado,
                saldoDeudor,
                cuotasAtrasadas,
                cuotas
            };

            setContratoActivo(resumenContrato);
            await cargarPagosHistorial(resumenContrato, cuotas);
            toast.current.show({ severity: 'success', summary: 'Pago Registrado', detail: `Se generó el recibo por S/ ${montoAbonar}` });
            setCuotaPagar(null);
            setMontoAbonar(0);
            setNumOperacion('');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pago.' });
        }
    };

    // ==========================================
    // TEMPLATES PRIMEREACT
    // ==========================================
    const estadoLoteTemplate = (estado) => {
        switch (estado) {
            case 'PAGADO': return <Tag severity="success" value="PAGADO" icon="pi pi-check-circle" />;
            case 'PENDIENTE': return <Tag severity="info" value="PENDIENTE" icon="pi pi-clock" />;
            case 'VENCIDA': return <Tag severity="danger" value="VENCIDA" icon="pi pi-exclamation-triangle" />;
            default: return <Tag value={estado} />;
        }
    };

    const estadoReciboTemplate = (estado) => {
        return estado === 'Procesado' ? <Tag severity="success" value={estado} /> : <Tag severity="warning" value={estado} />;
    };

    const accionesCuotaTemplate = (rowData) => {
        return (
            <div className="flex justify-content-center align-items-center gap-2">
                {rowData.pagado > 0 && (
                    <Button icon="pi pi-eye" className="p-button-rounded p-button-outlined p-button-secondary p-button-sm" tooltip="Ver Detalles de Pago" onClick={() => cargarDetalleCuota(rowData)} />
                )}
                {rowData.estado !== 'PAGADO' ? (
                    <Button label="Cobrar" icon="pi pi-dollar" className="p-button-sm p-button-success shadow-1" onClick={() => abrirPanelPago(rowData)} />
                ) : (
                    <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 border-round">Completado</span>
                )}
            </div>
        );
    };

    return (
        <div className="tesoreria-page">
            <Toast ref={toast} />
            <PageHeader title="Caja y Cobranzas" subtitle="Gestión de Pagos y Estados de Cuenta" icon="pi pi-wallet" />

            {/* ========================================== */}
            {/* DIALOG: DETALLE DE PAGOS POR CUOTA */}
            {/* ========================================== */}
            <Dialog 
                header={<><i className="pi pi-list text-primary mr-2"></i>Detalle de Abonos - Cuota N° {detalleCuota?.numero}</>} 
                visible={!!detalleCuota} 
                style={{ width: '450px' }} 
                onHide={() => setDetalleCuota(null)}
            >
                {detalleCuota && (
                    <div className="detalle-modal-content">
                        <div className="flex justify-content-between align-items-center bg-blue-50 p-3 border-round mb-3 border-1 border-blue-100">
                            <div>
                                <span className="text-sm font-bold text-blue-800"><i className="pi pi-calendar mr-2"></i>Vence: {detalleCuota.vencimiento}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-blue-600 uppercase">Monto Total</div>
                                <div className="text-xl font-black text-blue-900">S/ {formatMoney(detalleCuota.monto)}</div>
                            </div>
                        </div>

                        {detalleCuota.pagos && detalleCuota.pagos.length > 0 ? (
                            <DataTable value={detalleCuota.pagos} size="small" className="p-datatable-sm custom-table">
                                <Column field="id" header="Recibo"></Column>
                                <Column field="fecha" header="Fecha"></Column>
                                <Column field="metodo" header="Método"></Column>
                                <Column header="Abono" body={(r) => <span className="font-bold text-green-600">S/ {formatMoney(r?.montoAbonado ?? r?.monto)}</span>} style={{ textAlign: 'right' }}></Column>
                            </DataTable>
                        ) : (
                            <div className="text-center p-4 text-500">
                                <i className="pi pi-info-circle text-4xl mb-2 opacity-50"></i>
                                <p>No se encontraron pagos para esta cuota.</p>
                            </div>
                        )}
                        <div className="text-right mt-3 pt-3 border-top-1 surface-border">
                            <span className="text-sm font-bold text-600 uppercase mr-3">Suma Pagada:</span>
                            <span className="text-lg font-black text-green-700">S/ {formatMoney(detalleCuota.pagado)}</span>
                        </div>
                    </div>
                )}
            </Dialog>

            <div className="main-content">
                <TabView>
                    {/* ========================================== */}
                    {/* PESTAÑA 1: ESTADO DE CUENTA */}
                    {/* ========================================== */}
                    <TabPanel header="Estado de Cuenta" leftIcon="pi pi-chart-bar mr-2">
                        <div className="grid mt-3">
                            
                            {/* COLUMNA IZQUIERDA: BUSCADOR Y RESUMEN */}
                            <div className="col-12 lg:col-4">
                                {/* Búsqueda */}
                                <div className="custom-card mb-4">
                                    <div className="card-header">
                                        <i className="pi pi-search text-primary"></i>
                                        <span className="font-bold text-lg ml-2">Buscar Contrato</span>
                                    </div>
                                    <div className="p-fluid mt-3">
                                        <label className="font-medium text-sm mb-2 block">DNI Cliente o N° Contrato</label>
                                        <div className="p-inputgroup">
                                            <InputText value={criterioBusqueda} onChange={(e) => setCriterioBusqueda(e.target.value)} placeholder="Ej: 72384732 o C-108" />
                                            <Button icon="pi pi-search" className="p-button-success" onClick={buscarContrato} />
                                        </div>
                                    </div>
                                </div>

                                {/* Resumen de Contrato Activo */}
                                {contratoActivo && (
                                    <div className="custom-card fade-in">
                                        <div className="flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <span className="text-xs font-bold text-500 uppercase">Contrato Activo</span>
                                                <h3 className="m-0 text-xl font-black text-800">{contratoActivo.id}</h3>
                                            </div>
                                            {contratoActivo.cuotasAtrasadas > 0 ? (
                                                <Tag severity="danger" value="CON ATRASO" />
                                            ) : (
                                                <Tag severity="success" value="AL DÍA" />
                                            )}
                                        </div>

                                        <div className="info-box mb-4 bg-gray-50 border-gray-200">
                                            <div className="font-bold text-800 flex align-items-center">
                                                <i className="pi pi-user mr-2 text-primary"></i> {contratoActivo.cliente}
                                            </div>
                                            <div className="text-sm text-600 mt-1 ml-4">{contratoActivo.lote}</div>
                                        </div>

                                        <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 mb-2">
                                            <span className="text-sm font-medium text-600">Precio Total</span>
                                            <span className="font-bold text-800">S/ {contratoActivo.precioTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 mb-2">
                                            <span className="text-sm font-medium text-green-600">Total Pagado</span>
                                            <span className="font-bold text-green-700">S/ {contratoActivo.totalPagado.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-sm font-medium text-orange-600">Saldo Deudor</span>
                                            <span className="font-bold text-orange-700 text-lg">S/ {contratoActivo.saldoDeudor.toLocaleString()}</span>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-content-between text-xs mb-1 font-bold">
                                                <span className="text-primary">Progreso de Pago</span>
                                                <span>{Math.round((contratoActivo.totalPagado / contratoActivo.precioTotal) * 100)}%</span>
                                            </div>
                                            <ProgressBar value={Math.round((contratoActivo.totalPagado / contratoActivo.precioTotal) * 100)} displayValueTemplate={() => ''} style={{ height: '8px' }} color="var(--green-500)"></ProgressBar>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* COLUMNA DERECHA: CRONOGRAMA O PANEL DE PAGO */}
                            <div className="col-12 lg:col-8">
                                {!contratoActivo ? (
                                    <div className="custom-card h-full flex flex-column align-items-center justify-content-center text-400 p-5">
                                        <i className="pi pi-file-excel text-7xl mb-4 opacity-30 text-primary"></i>
                                        <p className="m-0 text-xl font-medium text-600">Ningún contrato seleccionado</p>
                                        <p className="m-0 mt-2 text-sm">Busque un cliente o contrato para ver su estado de cuenta.</p>
                                    </div>
                                ) : cuotaPagar ? (
                                    
                                    /* PANEL SECUNDARIO: REGISTRAR PAGO */
                                    <div className="custom-card h-full border-top-3 border-green-500 fade-in slide-in-right">
                                        <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-3 mb-4">
                                            <div>
                                                <h2 className="m-0 text-xl font-bold flex align-items-center text-800">
                                                    <i className="pi pi-credit-card text-green-600 mr-2 text-2xl"></i> Registrar Recibo de Pago
                                                </h2>
                                                <p className="m-0 text-sm text-500 mt-1">Cuota N° {cuotaPagar.numero} ({cuotaPagar.tipo}) - Vence: {cuotaPagar.vencimiento}</p>
                                            </div>
                                            <Button label="Volver" icon="pi pi-arrow-left" className="p-button-text p-button-secondary" onClick={() => setCuotaPagar(null)} />
                                        </div>

                                        <div className="grid">
                                            <div className="col-12 md:col-6 p-fluid">
                                                <div className="bg-blue-50 border-round p-3 mb-4 border-1 border-blue-200">
                                                    <div className="flex justify-content-between mb-2">
                                                        <span className="text-sm font-medium text-blue-700">Monto Total de Cuota</span>
                                                        <span className="font-bold text-blue-900">S/ {cuotaPagar.monto.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                                                    </div>
                                                    <div className="flex justify-content-between align-items-center">
                                                        <span className="text-sm font-medium text-blue-700">Falta Pagar</span>
                                                        <span className="font-black text-xl text-blue-700">S/ {(cuotaPagar.monto - cuotaPagar.pagado).toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                                                    </div>
                                                </div>

                                                <div className="field">
                                                    <label className="font-bold text-700">Monto a Abonar (S/)</label>
                                                    <InputNumber value={montoAbonar} onValueChange={(e) => setMontoAbonar(e.value)} mode="currency" currency="PEN" className="input-highlight-green" />
                                                    <small className="text-500">* Se permiten pagos parciales.</small>
                                                </div>

                                                <div className="field">
                                                    <label className="font-medium text-700">Método de Pago</label>
                                                    <Dropdown value={metodoPago} options={metodosPago} onChange={(e) => setMetodoPago(e.value)} placeholder="Seleccione un método" />
                                                </div>

                                                <div className="field">
                                                    <label className="font-medium text-700">Número de Operación</label>
                                                    <InputText value={numOperacion} onChange={(e) => setNumOperacion(e.target.value)} placeholder="Ej: 0948372" />
                                                </div>
                                            </div>

                                            <div className="col-12 md:col-6 flex flex-column">
                                                <label className="font-medium text-700 mb-2">Comprobante / Voucher (Opcional)</label>
                                                <div className="flex-grow-1 border-2 border-dashed surface-border border-round flex flex-column align-items-center justify-content-center p-5 surface-50 hover:surface-100 transition-colors cursor-pointer text-center">
                                                    <i className="pi pi-cloud-upload text-5xl text-400 mb-3"></i>
                                                    <span className="font-medium text-600">Haga clic o arrastre la imagen aquí</span>
                                                    <span className="text-xs text-400 mt-1">Formatos: JPG, PNG, PDF</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-content-end mt-4 pt-3 border-top-1 surface-border gap-2">
                                            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setCuotaPagar(null)} />
                                            <Button label="Confirmar y Generar Recibo" icon="pi pi-check-circle" className="p-button-success" onClick={registrarPago} />
                                        </div>
                                    </div>

                                ) : (
                                    
                                    /* PANEL PRINCIPAL: TABLA ESTADO DE CUENTA */
                                    <div className="custom-card h-full flex flex-column fade-in p-0 overflow-hidden">
                                        <div className="card-header p-4 surface-50 border-bottom-1 surface-border m-0 flex justify-content-between align-items-center">
                                            <div className="flex align-items-center">
                                                <i className="pi pi-list text-primary text-xl mr-2"></i>
                                                <span className="font-bold text-lg text-800">Cronograma de Cuotas</span>
                                            </div>
                                        </div>

                                        <DataTable value={contratoActivo.cuotas} scrollable scrollHeight="500px" className="p-datatable-sm custom-table" rowClassName={(data) => ({ 'bg-red-50': data.estado === 'VENCIDA' })}>
                                            <Column field="numero" header="N°" style={{ width: '8%' }} body={(r) => r.numero === 0 ? '0 (Inicial)' : r.numero}></Column>
                                            <Column field="vencimiento" header="Vencimiento" style={{ width: '15%' }} body={(r) => <><i className="pi pi-calendar mr-2 text-400"></i>{r.vencimiento}</>}></Column>
                                            <Column header="Monto" body={(r) => `S/ ${r.monto.toLocaleString('en-US',{minimumFractionDigits:2})}`} style={{ width: '17%', textAlign: 'right', fontWeight: '500' }}></Column>
                                            <Column header="Deuda" body={(r) => r.monto - r.pagado > 0 ? <span className="font-bold text-orange-600">S/ {(r.monto - r.pagado).toLocaleString('en-US',{minimumFractionDigits:2})}</span> : '-'} style={{ width: '17%', textAlign: 'right' }}></Column>
                                            <Column header="Estado" body={(r) => estadoLoteTemplate(r.estado)} style={{ width: '20%', textAlign: 'center' }}></Column>
                                            <Column header="Acción" body={accionesCuotaTemplate} style={{ width: '23%', textAlign: 'center' }}></Column>
                                        </DataTable>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabPanel>

                    {/* ========================================== */}
                    {/* PESTAÑA 2: HISTORIAL DE RECIBOS */}
                    {/* ========================================== */}
                    <TabPanel header="Historial de Recibos" leftIcon="pi pi-history mr-2">
                        <div className="custom-card mt-3 fade-in">
                            <div className="flex justify-content-between align-items-center mb-4">
                                <h2 className="text-lg font-bold m-0 text-800">Recibos Emitidos Recientemente</h2>
                                <Button label="Exportar a Excel" icon="pi pi-file-excel" className="p-button-success p-button-outlined p-button-sm" />
                            </div>
                            
                            <DataTable value={historialPagos} paginator rows={10} className="p-datatable-sm custom-table shadow-1">
                                <Column header="ID Recibo" body={(r) => <span className="font-bold text-700">REC-{r.id}</span>} style={{ minWidth: '100px' }}></Column>
                                <Column field="contrato" header="Contrato" style={{ minWidth: '100px', fontWeight: 'bold', color: 'var(--primary-color)' }}></Column>
                                <Column field="cliente" header="Cliente" style={{ minWidth: '150px' }}></Column>
                                <Column field="metodo" header="Método" style={{ minWidth: '150px' }}></Column>
                                <Column header="Monto" body={(r) => <span className="font-bold text-green-700">S/ {r.monto.toLocaleString('en-US',{minimumFractionDigits:2})}</span>} style={{ minWidth: '120px', textAlign: 'right' }}></Column>
                                <Column field="fecha" header="Fecha/Hora" style={{ minWidth: '150px' }}></Column>
                                <Column header="Estado" body={(r) => estadoReciboTemplate(r.estado)} style={{ minWidth: '120px', textAlign: 'center' }}></Column>
                                <Column header="Acción" body={() => <Button icon="pi pi-file-pdf" className="p-button-rounded p-button-text p-button-secondary" tooltip="Descargar PDF" />} style={{ width: '5rem', textAlign: 'center' }}></Column>
                            </DataTable>
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
};

export default GestionCuotasPagos;