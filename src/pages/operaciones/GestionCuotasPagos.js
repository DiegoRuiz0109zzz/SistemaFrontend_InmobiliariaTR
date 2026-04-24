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
    const [expandedRows, setExpandedRows] = useState(null);
    const [contratoActivo, setContratoActivo] = useState(null);

    // ==========================================
    // ESTADOS DE PAGOS Y MODALES
    // ==========================================
    const [cuotaPagar, setCuotaPagar] = useState(null);
    const [montoAbonar, setMontoAbonar] = useState(0);
    const [metodoPago, setMetodoPago] = useState('Transferencia BCP');
    const [numOperacion, setNumOperacion] = useState('');
    const [voucherFileRegistro, setVoucherFileRegistro] = useState(null);

    // Modal Procesar Pago Pendiente
    const [pagoPendiente, setPagoPendiente] = useState(null);
    const [metodoPagoPendiente, setMetodoPagoPendiente] = useState('Transferencia BCP');
    const [numOperacionPendiente, setNumOperacionPendiente] = useState('');
    const [voucherFile, setVoucherFile] = useState(null);
    const [voucherViewer, setVoucherViewer] = useState(null); // URL del voucher a visualizar

    const abrirDialogoProcesar = (pago) => {
        setPagoPendiente(pago);
        setMetodoPagoPendiente(pago.metodo !== '---' ? pago.metodo : 'Transferencia BCP');
        setNumOperacionPendiente(pago.numeroOperacion || '');
        setVoucherFile(null);
    };

    const procesarPagoPendienteAction = async () => {
        try {
            const formData = new FormData();
            formData.append('metodoPago', metodoPagoPendiente);
            formData.append('numeroOperacion', numOperacionPendiente);
            if (voucherFile) {
                formData.append('voucher', voucherFile);
            }

            await PagoService.procesarPendiente(pagoPendiente.id, formData, axiosInstance);
            toast.current.show({ severity: 'success', summary: 'Pago Procesado', detail: 'El recibo ha sido validado correctamente.' });
            setPagoPendiente(null);
            buscarContrato(criterioBusqueda); // Refrescar vista
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el pago.' });
        }
    };

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
    const isPendiente = (estado) => {
        if (!estado) return false;
        return estado.toUpperCase() === 'POR_VALIDAR';
    };

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
                cuotas.map(async (cuota) => {
                    const pagos = await PagoService.listarPorCuota(cuota.id, axiosInstance);
                    return (pagos || []).map(p => ({ ...p, cuotaId: cuota.id }));
                })
            );
            const flattened = pagosPorCuota.flat().map((pago) => ({
                id: pago.id,
                cuotaId: pago.cuotaId,
                contrato: contratoResumen.id,
                cliente: contratoResumen.cliente,
                monto: pago.montoAbonado || pago.monto || 0,
                metodo: pago.metodoPago || pago.metodo || '---',
                numeroOperacion: pago.numeroOperacion || '',
                fotoVoucherUrl: pago.fotoVoucherUrl || '',
                fecha: pago.fechaPago || pago.fecha || '',
                estado: pago.estado || 'PROCESADO'
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
            const montoInicial = encontrado.montoInicialAcordado || 0;
            const saldoFinanciar = encontrado.saldoFinanciar || Math.max(0, precioTotal - montoInicial);
            const saldoDeudor = precioTotal - totalPagado;
            const cuotasAtrasadas = cuotas.filter((cuota) => cuota.estado === 'VENCIDA').length;

            const resumenContrato = {
                id: encontrado.id,
                cliente: `${encontrado?.cliente?.nombres || ''} ${encontrado?.cliente?.apellidos || ''}`.trim(),
                lote: buildLoteLabel(encontrado),
                precioTotal,
                saldoFinanciar,
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
        setVoucherFileRegistro(null);
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
            const formData = new FormData();
            formData.append('cuotaId', cuotaPagar.id);
            formData.append('montoAbonado', montoAbonar);
            formData.append('metodoPago', metodoPago);
            formData.append('numeroOperacion', numOperacion);
            if (voucherFileRegistro) {
                formData.append('voucher', voucherFileRegistro);
            }

            await PagoService.registrar(formData, axiosInstance);

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
        return (estado === 'Procesado' || estado === 'PROCESADO') ? <Tag severity="success" value="PROCESADO" /> : <Tag severity="warning" value={estado} />;
    };

    const accionesCuotaTemplate = (rowData) => {
        return (
            <div className="flex justify-content-center align-items-center gap-2">
                {rowData.estado !== 'PAGADO' ? (
                    <Button label="Cobrar" icon="pi pi-wallet" className="p-button-sm btn-primary-custom shadow-2 border-round-xl font-bold" onClick={() => abrirPanelPago(rowData)} />
                ) : (
                    <span className="text-xs font-bold text-green-600 px-3 py-2 bg-green-50 border-round-xl shadow-1"><i className="pi pi-check-circle mr-1"></i>Completado</span>
                )}
            </div>
        );
    };

    const rowExpansionTemplate = (cuota) => {
        const pagosDeCuota = historialPagos.filter(p => p.cuotaId === cuota.id);
        
        return (
            <div className="p-3 bg-indigo-50 border-round-xl border-1 border-indigo-100 shadow-inset-1 ml-4 mr-4 mb-2 mt-2 fade-in">
                <h5 className="mt-0 mb-3 text-indigo-800 flex align-items-center text-lg"><i className="pi pi-list mr-2 text-xl text-primary"></i>Detalle de Pagos - Cuota N° {cuota.numero}</h5>
                {pagosDeCuota.length > 0 ? (
                    <DataTable value={pagosDeCuota} className="p-datatable-sm shadow-1 border-round-xl overflow-hidden custom-table">
                        <Column field="id" header="Recibo" body={(r) => <span className="font-bold text-700">REC-{r.id}</span>}></Column>
                        <Column field="fecha" header="Fecha"></Column>
                        <Column field="metodo" header="Método"></Column>
                        <Column field="numeroOperacion" header="N° Operación" body={(r) => r.numeroOperacion || '-'}></Column>
                        <Column header="Voucher" body={(r) => r.fotoVoucherUrl ? <Button icon="pi pi-image" className="p-button-rounded p-button-text p-button-info" tooltip="Ver Voucher" onClick={() => setVoucherViewer(buildVoucherUrl(r.fotoVoucherUrl))} /> : <span className="text-400">-</span>} style={{ textAlign: 'center' }}></Column>
                        <Column header="Monto" body={(r) => <span className="text-green-700 font-bold">S/ {r.monto.toLocaleString('en-US',{minimumFractionDigits:2})}</span>}></Column>
                        <Column header="Estado" body={(r) => estadoReciboTemplate(r.estado)}></Column>
                        <Column header="Acción" body={(r) => isPendiente(r.estado) ? <Button label="Procesar" icon="pi pi-cog" className="btn-warning-custom p-button-sm border-round-xl shadow-2 font-bold" onClick={() => abrirDialogoProcesar(r)} /> : <Button icon="pi pi-check" className="p-button-rounded p-button-text p-button-success" disabled />} style={{ width: '8rem', textAlign: 'center' }}></Column>
                    </DataTable>
                ) : (
                    <div className="text-500 font-italic text-sm py-3 px-3 bg-white border-round-xl flex align-items-center shadow-1"><i className="pi pi-info-circle mr-2 text-primary text-lg"></i>No hay pagos registrados para esta cuota.</div>
                )}
            </div>
        );
    };

    const buildVoucherUrl = (url) => url ? `http://localhost:8080/${url.replace(/^\//, '')}` : null;
    const isPdf = (url) => url && url.toLowerCase().endsWith('.pdf');

    return (
        <div className="tesoreria-page">
            <Toast ref={toast} />
            <PageHeader title="Caja y Cobranzas" subtitle="Gestión de Pagos y Estados de Cuenta" icon="pi pi-wallet" />

            {/* ===== MODAL VISOR DE VOUCHER ===== */}
            <Dialog
                header={<><i className="pi pi-image text-blue-500 mr-2"></i>Comprobante de Pago</>}
                visible={!!voucherViewer}
                style={{ width: '700px', maxWidth: '95vw' }}
                onHide={() => setVoucherViewer(null)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Descargar" icon="pi pi-download" className="btn-primary-custom border-round-xl" onClick={() => window.open(voucherViewer, '_blank')} />
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

            <Dialog header="Procesar Pago Pendiente" visible={!!pagoPendiente} style={{ width: '400px' }} onHide={() => setPagoPendiente(null)}>
                {pagoPendiente && (
                    <div className="p-fluid">
                        <div className="mb-3">
                            <span className="font-bold block mb-2">Recibo: REC-{pagoPendiente.id}</span>
                            <span className="text-xl font-black text-blue-600 block mb-3">S/ {formatMoney(pagoPendiente.monto)}</span>
                        </div>
                        <div className="field">
                            <label className="font-medium text-700">Método de Pago</label>
                            <Dropdown value={metodoPagoPendiente} options={metodosPago} onChange={(e) => setMetodoPagoPendiente(e.value)} />
                        </div>
                        <div className="field">
                            <label className="font-medium text-700">Número de Operación</label>
                            <InputText value={numOperacionPendiente} onChange={(e) => setNumOperacionPendiente(e.target.value)} placeholder="Ej: 998273" />
                        </div>
                        <div className="field">
                            <label className="font-medium text-700">Comprobante / Voucher (Opcional)</label>
                            <div className="relative flex flex-column align-items-center justify-content-center p-4 border-2 border-dashed border-round-xl surface-border hover:surface-hover transition-colors cursor-pointer bg-blue-50 mt-2">
                                <input 
                                    type="file" 
                                    className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer z-10" 
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setVoucherFile(e.target.files[0])}
                                />
                                {voucherFile ? (
                                    <div className="text-center flex flex-column align-items-center">
                                        <i className="pi pi-file-check text-4xl text-green-500 mb-2"></i>
                                        <span className="font-bold text-700">{voucherFile.name}</span>
                                        <span className="text-sm text-500">{(voucherFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                    </div>
                                ) : (
                                    <div className="text-center flex flex-column align-items-center">
                                        <i className="pi pi-cloud-upload text-4xl text-blue-500 mb-2"></i>
                                        <span className="font-bold text-700">Haz clic o arrastra el archivo aquí</span>
                                        <span className="text-sm text-500 mt-1">Formatos soportados: JPG, PNG, PDF</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-content-end gap-2 mt-4">
                            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setPagoPendiente(null)} />
                            <Button label="Procesar Pago" icon="pi pi-check" className="p-button-success" onClick={procesarPagoPendienteAction} />
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
                                            <Button icon="pi pi-search" className="btn-primary-custom" onClick={buscarContrato} />
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

                                        <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 mb-2 mt-3">
                                            <span className="text-sm font-medium text-600">Precio Total</span>
                                            <span className="font-bold text-800">S/ {contratoActivo.precioTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 mb-2">
                                            <span className="text-sm font-medium text-blue-600">Monto Financiado</span>
                                            <span className="font-bold text-blue-800">S/ {contratoActivo.saldoFinanciar.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 mb-2">
                                            <span className="text-sm font-medium text-green-600">Total Pagado</span>
                                            <span className="font-bold text-green-700">S/ {contratoActivo.totalPagado.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center bg-orange-50 p-2 border-round">
                                            <span className="text-sm font-bold text-orange-600">Saldo Deudor</span>
                                            <span className="font-black text-orange-700 text-xl">S/ {contratoActivo.saldoDeudor.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
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
                                            <Button label="Volver" icon="pi pi-arrow-left" className="p-button-text p-button-secondary font-bold" onClick={() => setCuotaPagar(null)} />
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
                                                <div className="relative flex-grow-1 border-2 border-dashed surface-border border-round flex flex-column align-items-center justify-content-center p-5 surface-50 hover:surface-100 transition-colors cursor-pointer text-center">
                                                    <input 
                                                        type="file" 
                                                        className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer z-10" 
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) => setVoucherFileRegistro(e.target.files[0])}
                                                    />
                                                    {voucherFileRegistro ? (
                                                        <>
                                                            <i className="pi pi-file-check text-5xl text-green-500 mb-3"></i>
                                                            <span className="font-bold text-700">{voucherFileRegistro.name}</span>
                                                            <span className="text-xs text-500 mt-1">{(voucherFileRegistro.size / (1024 * 1024)).toFixed(2)} MB</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="pi pi-cloud-upload text-5xl text-400 mb-3"></i>
                                                            <span className="font-medium text-600">Haga clic o arrastre la imagen aquí</span>
                                                            <span className="text-xs text-400 mt-1">Formatos: JPG, PNG, PDF</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-content-end mt-4 pt-3 border-top-1 surface-border gap-2">
                                            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary font-bold p-button-lg" onClick={() => setCuotaPagar(null)} />
                                            <Button label="Confirmar y Generar Recibo" icon="pi pi-check-circle" className="btn-success-custom border-round-xl shadow-2 font-bold p-button-lg" onClick={registrarPago} />
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

                                        <DataTable dataKey="id" value={contratoActivo.cuotas} expandedRows={expandedRows} onRowToggle={(e) => setExpandedRows(e.data)} rowExpansionTemplate={rowExpansionTemplate} scrollable scrollHeight="500px" className="p-datatable-sm custom-table" rowClassName={(data) => ({ 'bg-red-50': data.estado === 'VENCIDA' })}>
                                            <Column expander style={{ width: '3rem' }} />
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
                                <Button label="Exportar a Excel" icon="pi pi-file-excel" className="btn-success-custom p-button-outlined border-round-xl shadow-2 font-bold p-button-sm" />
                            </div>
                            
                            <DataTable value={historialPagos} paginator rows={10} className="p-datatable-sm custom-table shadow-1">
                                <Column header="ID Recibo" body={(r) => <span className="font-bold text-700">REC-{r.id}</span>} style={{ minWidth: '100px' }}></Column>
                                <Column field="contrato" header="Contrato" style={{ minWidth: '100px', fontWeight: 'bold', color: 'var(--primary-color)' }}></Column>
                                <Column field="cliente" header="Cliente" style={{ minWidth: '150px' }}></Column>
                                <Column field="metodo" header="Método" style={{ minWidth: '150px' }}></Column>
                                <Column header="Voucher" body={(r) => r.fotoVoucherUrl ? <Button icon="pi pi-image" className="p-button-rounded p-button-text p-button-info" tooltip="Ver Voucher" onClick={() => setVoucherViewer(buildVoucherUrl(r.fotoVoucherUrl))} /> : <span className="text-400">-</span>} style={{ textAlign: 'center' }}></Column>
                                <Column header="Monto" body={(r) => <span className="font-bold text-green-700">S/ {r.monto.toLocaleString('en-US',{minimumFractionDigits:2})}</span>} style={{ minWidth: '120px', textAlign: 'right' }}></Column>
                                <Column field="fecha" header="Fecha/Hora" style={{ minWidth: '150px' }}></Column>
                                <Column header="Estado" body={(r) => estadoReciboTemplate(r.estado)} style={{ minWidth: '120px', textAlign: 'center' }}></Column>
                                <Column header="Acción" body={(r) => isPendiente(r.estado) ? <Button label="Procesar" icon="pi pi-cog" className="btn-warning-custom p-button-sm border-round-xl shadow-2 font-bold" onClick={() => abrirDialogoProcesar(r)} /> : <Button icon="pi pi-file-pdf" className="p-button-rounded p-button-text p-button-secondary" tooltip="Descargar PDF" />} style={{ width: '8rem', textAlign: 'center' }}></Column>
                            </DataTable>
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
};

export default GestionCuotasPagos;