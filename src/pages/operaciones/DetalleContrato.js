import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Divider } from 'primereact/divider';
import { useAuth } from '../../context/AuthContext';
import { ContratoService } from '../../service/ContratoService';
import { ClienteService } from '../../service/ClienteService';
import { LoteService } from '../../service/LoteService';
import { CuotaService } from '../../service/CuotaService';
import { PagoService } from '../../service/PagoService';
import { ContratoHistorialService } from '../../service/ContratoHistorialService';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { TipoComprobante, TipoComprobanteOptions } from '../../entity/TipoComprobante';

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
    const [dialogoSubirPdf, setDialogoSubirPdf] = useState(false);
    const [archivoContrato, setArchivoContrato] = useState(null);
    const [motivoDocumento, setMotivoDocumento] = useState('');
    const [subiendoPdf, setSubiendoPdf] = useState(false);
    const [historialPagos, setHistorialPagos] = useState([]);

    // Estados para convertir contrato separado a activo
    const [mostrarConversionModal, setMostrarConversionModal] = useState(false);
    const [conversionCuotas, setConversionCuotas] = useState(36);
    const [conversionFechaInicio, setConversionFechaInicio] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    const [conversionFlexible, setConversionFlexible] = useState(false);
    const [conversionCuotasEspeciales, setConversionCuotasEspeciales] = useState(0);
    const [conversionMontoEspecial, setConversionMontoEspecial] = useState(0);
    const [conversionCronograma, setConversionCronograma] = useState([]);
    const [conversionDescripcion, setConversionDescripcion] = useState('');
    const [simulandoConversion, setSimulandoConversion] = useState(false);
    const [confirmandoConversion, setConfirmandoConversion] = useState(false);
    const [conversionPrompted, setConversionPrompted] = useState(false);
    // Estados para alertas y edición de inicial
    const [alertaSeparacion, setAlertaSeparacion] = useState(null);
    const [dialogoEditarInicial, setDialogoEditarInicial] = useState(false);
    const [nuevoMontoAdicional, setNuevoMontoAdicional] = useState(0);
    const [nuevaFechaLimite, setNuevaFechaLimite] = useState(null);
    const [guardandoInicial, setGuardandoInicial] = useState(false);

    const [conversionDismissed, setConversionDismissed] = useState(false);

    // Datos base para edición
    const [clientes, setClientes] = useState([]);
    const [lotes, setLotes] = useState([]);

    // Estado del Acordeón
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);

    // Estados para Registro de Pago
    const [cuotaPagar, setCuotaPagar] = useState(null);
    const [montoAbonar, setMontoAbonar] = useState(0);
    const [metodoPago, setMetodoPago] = useState('Transferencia BCP');
    const [tipoComprobante, setTipoComprobante] = useState(TipoComprobante.NOTA_ABONO);
    const [numOperacion, setNumOperacion] = useState('');
    const [descripcionPago, setDescripcionPago] = useState('');
    const [voucherFileRegistro, setVoucherFileRegistro] = useState(null);
    const [registrandoPago, setRegistrandoPago] = useState(false);

    // Estados para Procesar Pagos Pendientes
    const [pagoPendiente, setPagoPendiente] = useState(null);
    const [metodoPagoPendiente, setMetodoPagoPendiente] = useState('Transferencia BCP');
    const [numOperacionPendiente, setNumOperacionPendiente] = useState('');
    const [descripcionPagoPendiente, setDescripcionPagoPendiente] = useState('');
    const [voucherFilePendiente, setVoucherFilePendiente] = useState(null);

    const [dialogoSubirReciboIngreso, setDialogoSubirReciboIngreso] = useState(false);
    const [archivoReciboIngreso, setArchivoReciboIngreso] = useState(null);
    const [reciboIngresoNumero, setReciboIngresoNumero] = useState('');
    const [subiendoReciboIngreso, setSubiendoReciboIngreso] = useState(false);

    // Estados para Editar Contrato
    const [dialogoEditarContrato, setDialogoEditarContrato] = useState(false);
    const [clienteEditId, setClienteEditId] = useState(null);
    const [coCompradorEditId, setCoCompradorEditId] = useState(null);
    const [urbanizacionEdit, setUrbanizacionEdit] = useState(null);
    const [etapaEdit, setEtapaEdit] = useState(null);
    const [manzanaEdit, setManzanaEdit] = useState(null);
    const [loteEditId, setLoteEditId] = useState(null);
    const [observacionNota, setObservacionNota] = useState('');
    const [medidasEdit, setMedidasEdit] = useState({
        mlFrente: '',
        mlDerecha: '',
        mlIzquierda: '',
        mlFondo: '',
        colindanciaFrente: '',
        colindanciaDerecha: '',
        colindanciaIzquierda: '',
        colindanciaFondo: ''
    });
    const [expandirCambioLote, setExpandirCambioLote] = useState(false);
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);

    // Estado para mostrar panel de medidas si falta completarlas
    const [mostrarPanelMedidas, setMostrarPanelMedidas] = useState(false);

    const metodosPago = [
        { label: 'Transferencia BCP', value: 'Transferencia BCP' },
        { label: 'Transferencia BBVA', value: 'Transferencia BBVA' },
        { label: 'Yape / Plin', value: 'Yape / Plin' },
        { label: 'Efectivo (Caja)', value: 'EFECTIVO' }
    ];

    const esIngresoCaja = metodoPago === 'EFECTIVO' && (!numOperacion || !numOperacion.trim());

    const tipoComprobanteOptions = useMemo(() => {
        if (esIngresoCaja) {
            return TipoComprobanteOptions.filter((item) => item.value === TipoComprobante.RECIBO_INGRESO);
        }
        return TipoComprobanteOptions.filter((item) => item.value !== TipoComprobante.RECIBO_INGRESO);
    }, [esIngresoCaja]);

    useEffect(() => {
        if (esIngresoCaja && tipoComprobante !== TipoComprobante.RECIBO_INGRESO) {
            setTipoComprobante(TipoComprobante.RECIBO_INGRESO);
        }
        if (!esIngresoCaja && tipoComprobante === TipoComprobante.RECIBO_INGRESO) {
            setTipoComprobante(TipoComprobante.NOTA_ABONO);
        }
    }, [esIngresoCaja, tipoComprobante]);

    useEffect(() => {
        if (metodoPago === 'EFECTIVO') {
            setNumOperacion('');
        }
    }, [metodoPago]);

    useEffect(() => {
        if (metodoPagoPendiente === 'EFECTIVO') {
            setNumOperacionPendiente('');
        }
    }, [metodoPagoPendiente]);

    const buildVoucherUrl = (url) => url ? `http://localhost:8080/${url.replace(/^\//, '')}` : null;
    const isPdf = (url) => url && url.toLowerCase().endsWith('.pdf');

    // Parsear fecha sin que se vea afectada por zona horaria
    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return 'N/A';
        try {
            // Si es formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
            if (fechaStr.includes('-')) {
                const partes = fechaStr.split('T')[0].split('-');
                if (partes.length === 3) {
                    const [anio, mes, dia] = partes;
                    return `${dia}/${mes}/${anio}`;
                }
            }
            // Si es otro formato, intenta parsearlo normalmente
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-PE');
        } catch (e) {
            return fechaStr;
        }
    };

    const formatearFechaLarga = (fechaStr) => {
        if (!fechaStr) return 'N/A';
        try {
            const fechaBase = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
            const partes = fechaBase.split('-');
            if (partes.length === 3) {
                const [anio, mes, dia] = partes;
                const meses = [
                    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
                ];
                const mesIndex = Number(mes) - 1;
                if (mesIndex >= 0 && mesIndex < meses.length) {
                    return `${Number(dia)} DE ${meses[mesIndex]} DEL ${anio}`;
                }
            }

            const fecha = new Date(fechaStr);
            if (Number.isNaN(fecha.getTime())) return fechaStr;
            const meses = [
                'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
            ];
            return `${fecha.getDate()} DE ${meses[fecha.getMonth()]} DEL ${fecha.getFullYear()}`;
        } catch (e) {
            return fechaStr;
        }
    };

    const getLocalYMD = (dateObj) => {
        if (!dateObj) return null;
        const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
        if (Number.isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const parseLocalYMD = (value) => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value === 'string' && value.includes('T')) return new Date(value);
        if (typeof value === 'string' && value.includes('-')) {
            const [y, m, d] = value.split('T')[0].split('-');
            return new Date(y, Number(m) - 1, Number(d));
        }
        return new Date(value);
    };

    useEffect(() => {
        if (id) {
            cargarDetalleContrato(id);
        }
    }, [id]);

    useEffect(() => {
        const cargarDatosBase = async () => {
            try {
                const [resClientes, resLotes] = await Promise.all([
                    ClienteService.listar(axiosInstance),
                    LoteService.listar(axiosInstance)
                ]);

                setClientes(Array.isArray(resClientes) ? resClientes : []);
                setLotes(Array.isArray(resLotes) ? resLotes : []);
            } catch (error) {
                console.error(error);
                toast.current?.show({ severity: 'warn', summary: 'Edición', detail: 'No se pudieron cargar clientes y lotes para editar.' });
            }
        };

        cargarDatosBase();
    }, [axiosInstance]);

    const lotesOpciones = useMemo(() => {
        return (lotes || [])
            .filter((item) => item?.enabled !== false)
            .map((item) => ({
                ...item,
                descripcionCompleta: `${item?.manzana?.etapa?.urbanizacion?.nombre || ''} / ${item?.manzana?.etapa?.nombre || ''} / Mz ${item?.manzana?.nombre || ''} - Lote ${item?.numero || ''}`.trim()
            }));
    }, [lotes]);

    const urbanizacionesOptions = useMemo(() => {
        const map = new Map();
        lotesOpciones.forEach((item) => {
            const urbanizacion = item?.manzana?.etapa?.urbanizacion;
            if (urbanizacion?.id && !map.has(urbanizacion.id)) {
                map.set(urbanizacion.id, { label: urbanizacion.nombre || 'Sin nombre', value: urbanizacion.id, entity: urbanizacion });
            }
        });
        return Array.from(map.values());
    }, [lotesOpciones]);

    const etapasOptions = useMemo(() => {
        if (!urbanizacionEdit) return [];
        const map = new Map();
        lotesOpciones.forEach((item) => {
            const etapa = item?.manzana?.etapa;
            const urbanizacion = etapa?.urbanizacion;
            if (urbanizacion?.id === urbanizacionEdit && etapa?.id && !map.has(etapa.id)) {
                map.set(etapa.id, { label: etapa.nombre || 'Sin nombre', value: etapa.id, entity: etapa });
            }
        });
        return Array.from(map.values());
    }, [lotesOpciones, urbanizacionEdit]);

    const manzanasOptions = useMemo(() => {
        if (!etapaEdit) return [];
        const map = new Map();
        lotesOpciones.forEach((item) => {
            const manzana = item?.manzana;
            const etapa = manzana?.etapa;
            if (etapa?.id === etapaEdit && manzana?.id && !map.has(manzana.id)) {
                map.set(manzana.id, { label: manzana.nombre || 'Sin nombre', value: manzana.id, entity: manzana });
            }
        });
        return Array.from(map.values());
    }, [lotesOpciones, etapaEdit]);

    const lotesFiltradosOptions = useMemo(() => {
        if (!manzanaEdit) return [];
        return lotesOpciones.filter((item) => item?.manzana?.id === manzanaEdit);
    }, [lotesOpciones, manzanaEdit]);

    const clientesOptions = useMemo(() => {
        return (clientes || []).map((item) => ({
            ...item,
            nombreCompleto: `${item.nombres || ''} ${item.apellidos || ''}`.trim(),
            detalleDocumento: `${item.tipoDocumento || 'DNI'}: ${item.numeroDocumento || 'N/A'}`
        }));
    }, [clientes]);

    const coCompradoresOptions = useMemo(() => {
        return clientesOptions.filter((item) => item.id !== clienteEditId);
    }, [clientesOptions, clienteEditId]);

    const loteEditSeleccionado = useMemo(() => {
        return lotesFiltradosOptions.find((item) => item.id === loteEditId) || lotesOpciones.find((item) => item.id === loteEditId) || null;
    }, [lotesFiltradosOptions, lotesOpciones, loteEditId]);

    const cargarDetalleContrato = async (contratoId) => {
        setLoading(true);
        try {
            const data = await ContratoService.obtener(contratoId, axiosInstance);
            const cuotasRaw = await CuotaService.listarPorContrato(contratoId, axiosInstance);
            const histRaw = await ContratoHistorialService.listarPorContrato(contratoId, axiosInstance);

            setHistoriales(Array.isArray(histRaw) ? histRaw : []);
            const cuotasList = Array.isArray(cuotasRaw) ? cuotasRaw : [];

            // Cargar historial global de pagos para poder ver los días de retraso en la tabla principal
            try {
                const pagosPorCuota = await Promise.all(
                    cuotasList.map(async (cuota) => {
                        try {
                            const pagos = await PagoService.listarPorCuota(cuota.id, axiosInstance);
                            return (pagos || []).map(p => ({ ...p, cuotaId: cuota.id }));
                        } catch (e) {
                            return [];
                        }
                    })
                );
                setHistorialPagos(pagosPorCuota.flat());
            } catch (e) {
                setHistorialPagos([]);
            }

            let totalPagadoReal = 0;
            let cuotasAtrasadas = 0;
            let cuotasPagadas = 0;

            const cuotasFormateadas = cuotasList.map(cuota => {
                const pagadoEnCuota = cuota.montoPagado || 0;
                totalPagadoReal += pagadoEnCuota;

                if (cuota.estado === 'VENCIDA' || cuota.estado === 'ATRASADA') cuotasAtrasadas++;
                if (cuota.estado === 'PAGADO') cuotasPagadas++;

                return {
                    ...cuota,
                    numero: cuota.numeroCuota !== undefined ? cuota.numeroCuota : cuota.numero,
                    vencimiento: formatearFechaLarga(cuota.fechaVencimiento),
                    vencimientoRaw: cuota.fechaVencimiento,
                    montoTotal: cuota.montoTotal || cuota.monto || 0,
                    montoPagado: pagadoEnCuota,
                    estado: cuota.estado || 'PENDIENTE',
                    pagos: []
                };
            });

            const abonoInicial = data.abonoInicialReal || data.montoInicial || 0;
            if (totalPagadoReal === 0 && abonoInicial > 0 && cuotasList.length === 0) {
                totalPagadoReal = abonoInicial;
            }

            const precioTotal = data.precioTotal || 1;
            const cuota0 = cuotasFormateadas.find(c => c.numero === 0 || c.tipo === 'INICIAL');
            const faltaPagarInicial = cuota0 ? Math.max(0, cuota0.montoTotal - cuota0.montoPagado) : 0;
            const montoInicialAcordado = cuota0 ? cuota0.montoTotal : (data.montoInicialAcordado || 0);
            const montoInicialPagado = cuota0 ? cuota0.montoPagado : Math.max(0, montoInicialAcordado - faltaPagarInicial);

            setContrato({
                id: Number(contratoId),
                codigo: `C-${contratoId.toString().padStart(4, '0')}`,
                fechaEmision: formatearFecha(data.fechaRegistro),
                cotizacionOrigen: data.cotizacionOrigen || null,
                urlDocumentoFirmado: data.urlDocumentoFirmado || null,
                vendedor: data.vendedor ? `${data.vendedor.nombres} ${data.vendedor.apellidos}` : 'No asignado',
                vendedorDetalle: data.vendedor ? {
                    id: data.vendedor.id,
                    nombres: data.vendedor.nombres || 'Desconocido',
                    apellidos: data.vendedor.apellidos || '',
                    numeroDocumento: data.vendedor.numeroDocumento || 'N/A',
                    telefono: data.vendedor.telefono || 'N/A',
                    email: data.vendedor.email || 'N/A'
                } : null,
                cliente: {
                    id: data.cliente?.id || null,
                    nombres: data.cliente?.nombres || 'Desconocido',
                    apellidos: data.cliente?.apellidos || '',
                    numeroDocumento: data.cliente?.numeroDocumento || 'N/A',
                    telefono: data.cliente?.telefono || 'N/A',
                    email: data.cliente?.email || 'N/A'
                },
                coComprador: data.coComprador ? {
                    id: data.coComprador.id || null,
                    nombres: data.coComprador.nombres || 'Desconocido',
                    apellidos: data.coComprador.apellidos || '',
                    numeroDocumento: data.coComprador.numeroDocumento || 'N/A',
                    telefono: data.coComprador.telefono || 'N/A',
                    email: data.coComprador.email || 'N/A'
                } : null,
                lote: {
                    id: data.lote?.id || null,
                    descripcion: data.lote?.descripcion || (data.lote?.numero ? `Mza ${data.lote?.manzana?.nombre || ''} - Lote ${data.lote?.numero}` : 'No asignado'),
                    area: data.lote?.area ? `${data.lote.area} m2` : 'N/A',
                    proyecto: data.lote?.manzana?.etapa?.urbanizacion?.nombre || 'N/A',
                    estado: data.lote?.estadoVenta || 'SEPARADO',
                    numero: data.lote?.numero || null,
                    manzana: data.lote?.manzana || null
                },
                medidas: data.medidas || null,
                finanzas: {
                    precioTotal: data.precioTotal || 0,
                    montoInicial: montoInicialAcordado,
                    montoInicialPagado: montoInicialPagado,
                    saldoFinanciar: data.saldoFinanciar || Math.max(0, (data.precioTotal || 0) - montoInicialAcordado),
                    totalPagado: totalPagadoReal,
                    saldoDeudor: (data.precioTotal || 0) - totalPagadoReal,
                    cuotasTotales: data.cantidadCuotas || 0,
                    cuotasPagadas: cuotasPagadas,
                    cuotasAtrasadas: cuotasAtrasadas,
                    progresoPago: Math.min(100, Math.round((totalPagadoReal / precioTotal) * 100)),
                    faltaPagarInicial: faltaPagarInicial
                },
                estadoContrato: data.estadoContrato || data.estado || 'ACTIVO',
                cuotas: cuotasFormateadas
            });

            // Llamar a alerta de separación
            if ((data.estadoContrato || data.estado || 'ACTIVO') === 'SEPARADO') {
                try {
                    const alertaRes = await ContratoService.obtenerAlertaSeparacion(contratoId, axiosInstance);
                    if (alertaRes && alertaRes.mensaje) {
                        setAlertaSeparacion(alertaRes.mensaje);
                    } else {
                        setAlertaSeparacion(null);
                    }
                } catch (e) {
                    console.error("Error obteniendo alerta", e);
                }
            } else {
                setAlertaSeparacion(null);
            }

        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el contrato o sus cuotas.' });
        } finally {
            setLoading(false);
        }
    };

    const seleccionarCuota = async (cuota) => {
        if (!cuota) {
            setCuotaSeleccionada(null);
            return;
        }

        // Si el contrato ha sido recargado, buscar la cuota actualizada
        let cuotaActualizada = cuota;
        if (contrato && contrato.cuotas) {
            const cuotaEncontrada = contrato.cuotas.find(c => c.id === cuota.id);
            if (cuotaEncontrada) {
                cuotaActualizada = cuotaEncontrada;
            }
        }

        setCuotaSeleccionada(cuotaActualizada);

        try {
            const pagosRaw = await PagoService.listarPorCuota(cuotaActualizada.id, axiosInstance);
            const pagosFormateados = (pagosRaw || []).map(p => ({
                ...p,
                id: `REC-${p.id}`,
                idOriginal: p.id,
                fechaPago: p.fechaPago ? (() => {
                    const fecha = new Date(p.fechaPago);
                    return fecha.toLocaleDateString('es-PE');
                })() : 'N/A',
                fechaPagoRaw: p.fechaPago || null,
                numeroOperacion: p.numeroOperacion || p.numeroOperacionReferencia || p.numeroOperacion || '',
                montoAbonado: p.montoAbonado || p.monto || 0,
                metodoPago: p.metodoPago || p.metodo || 'No especificado',
                fotoVoucherUrl: p.fotoVoucherUrl || null,
                numeroComprobante: p.numeroComprobante || null,
                tipoComprobante: p.tipoComprobante || null
            }));

            // Detectar si hay pagos pendientes
            const pagoPendienteEnCuota = (pagosRaw || []).find((p) => {
                const estado = (p?.estado || '').toUpperCase();
                const metodo = (p?.metodoPago || p?.metodo || '').toUpperCase();
                const tipo = (p?.tipoComprobante || '').toUpperCase();
                const esCajaEfectivo = metodo === 'EFECTIVO' || tipo === 'RECIBO_INGRESO';
                return estado === 'POR_VALIDAR' && !esCajaEfectivo;
            });

            setCuotaSeleccionada(prev => ({ ...prev, pagos: pagosFormateados, pagoPendiente: pagoPendienteEnCuota }));
        } catch (error) {
            toast.current?.show({ severity: 'warn', summary: 'Pagos', detail: 'No se pudieron cargar los recibos de esta cuota.' });
        }
    };

    const viewVoucher = (url) => {
        if (!url) return;
        const full = buildVoucherUrl(url);
        if (isPdf(full)) {
            // Try to find matching historial entry and use descargarPdf; otherwise try to fetch the blob directly
            const fileName = url.split('/').pop();
            const match = historiales.find(h => (h.rutaDocumentoPdf || '').endsWith(fileName));
            if (match) {
                verHistorialPdf(match);
                return;
            }

            // Fallback: try to GET the file as blob via axiosInstance, then open in new tab
            (async () => {
                try {
                    const client = axiosInstance || null;
                    if (client) {
                        const resp = await client.get(full, { responseType: 'blob' });
                        const blobUrl = URL.createObjectURL(resp.data);
                        window.open(blobUrl, '_blank');
                        return;
                    }
                } catch (e) {
                    // final fallback: open constructed URL in new tab
                    window.open(full, '_blank');
                }
            })();
        } else {
            setVoucherViewer(full);
        }
    };

    const abrirEditorContrato = () => {
        if (!contrato) return;

        setClienteEditId(contrato.cliente?.id || null);
        setCoCompradorEditId(contrato.coComprador?.id || null);
        setUrbanizacionEdit(contrato.lote?.manzana?.etapa?.urbanizacion?.id || null);
        setEtapaEdit(contrato.lote?.manzana?.etapa?.id || null);
        setManzanaEdit(contrato.lote?.manzana?.id || null);
        setLoteEditId(contrato.lote?.id || null);
        setObservacionNota('');
        setMedidasEdit({
            mlFrente: contrato.medidas?.mlFrente ?? '',
            mlDerecha: contrato.medidas?.mlDerecha ?? '',
            mlIzquierda: contrato.medidas?.mlIzquierda ?? '',
            mlFondo: contrato.medidas?.mlFondo ?? '',
            colindanciaFrente: contrato.medidas?.colindanciaFrente ?? '',
            colindanciaDerecha: contrato.medidas?.colindanciaDerecha ?? '',
            colindanciaIzquierda: contrato.medidas?.colindanciaIzquierda ?? '',
            colindanciaFondo: contrato.medidas?.colindanciaFondo ?? ''
        });
        setDialogoEditarContrato(true);
    };

    const cerrarEditorContrato = () => {
        setDialogoEditarContrato(false);
        setClienteEditId(null);
        setCoCompradorEditId(null);
        setUrbanizacionEdit(null);
        setEtapaEdit(null);
        setManzanaEdit(null);
        setLoteEditId(null);
        setExpandirCambioLote(false);
        setObservacionNota('');
        setMedidasEdit({
            mlFrente: '',
            mlDerecha: '',
            mlIzquierda: '',
            mlFondo: '',
            colindanciaFrente: '',
            colindanciaDerecha: '',
            colindanciaIzquierda: '',
            colindanciaFondo: ''
        });
    };

    const guardarEdiciones = async () => {
        // 🔥 REGLA: Titular principal es obligatorio (validación del backend)
        if (!clienteEditId) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar un titular principal.' });
            return;
        }

        setGuardandoEdicion(true);
        try {
            const payload = {
                clienteId: clienteEditId,
                coCompradorId: coCompradorEditId || null,
                loteId: loteEditId || null,
                observacion: observacionNota.trim() || null
            };

            await ContratoService.actualizar(contrato.id, payload, axiosInstance);
            await cargarDetalleContrato(contrato.id);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Contrato actualizado correctamente.' });
            cerrarEditorContrato();
        } catch (error) {
            console.error('Error al guardar:', error);
            const detalle = error?.response?.data?.message || 'No se pudieron guardar los cambios.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: detalle });
        } finally {
            setGuardandoEdicion(false);
        }
    };

    const abrirConversionModal = () => {
        setConversionCronograma([]);
        setConversionDescripcion('');
        setConversionDismissed(false);
        if (contrato?.cotizacionOrigen) {
            const origen = contrato.cotizacionOrigen;
            const cuotasOrigen = origen.cantidadCuotas || 36;
            const fechaOrigen = parseLocalYMD(origen.fechaInicioPago) || conversionFechaInicio;
            const flex = !!(origen.cuotasFlexibles || origen.cuotasEspeciales || origen.montoCuotaEspecial);
            const cuotasEsp = origen.cuotasEspeciales || 0;
            const montoEsp = origen.montoCuotaEspecial || 0;

            setConversionCuotas(cuotasOrigen);
            if (fechaOrigen) {
                setConversionFechaInicio(fechaOrigen);
            }
            setConversionFlexible(flex);
            setConversionCuotasEspeciales(cuotasEsp);
            setConversionMontoEspecial(montoEsp);
            simularConversionConDatos({
                cuotas: cuotasOrigen,
                fechaInicio: fechaOrigen,
                flexible: flex,
                cuotasEspeciales: cuotasEsp,
                montoEspecial: montoEsp
            });
        }
        setMostrarConversionModal(true);
    };

    const simularConversionConDatos = async ({ cuotas, fechaInicio, flexible, cuotasEspeciales, montoEspecial }) => {
        if (!cuotas || cuotas <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Ingrese un número de cuotas válido.' });
            return;
        }
        if (!fechaInicio) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Seleccione la fecha de inicio de pago.' });
            return;
        }

        setSimulandoConversion(true);
        try {
            const payload = {
                precioTotal: contrato?.finanzas?.precioTotal || 0,
                montoInicial: contrato?.finanzas?.montoInicial || 0,
                cantidadCuotas: cuotas,
                fechaInicioPago: getLocalYMD(fechaInicio),
                cuotasEspeciales: flexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: flexible ? montoEspecial : 0
            };

            const respuesta = await ContratoService.simular(payload, axiosInstance);
            if (Array.isArray(respuesta)) {
                const cronogramaSimulado = respuesta.map((item) => {
                    const fecha = item?.fechaVencimiento || item?.fecha || item?.vencimiento || null;
                    return {
                        numero: item?.numeroCuota ?? item?.numero,
                        tipoCuota: item?.tipoCuota || 'MENSUAL',
                        montoTotal: Number(item?.montoTotal ?? item?.monto ?? 0),
                        fecha,
                        estado: item?.estado || 'PENDIENTE'
                    };
                });
                setConversionCronograma(cronogramaSimulado);
                setConversionDescripcion('Simulación completada');
                return;
            }
            if (respuesta && respuesta.cuotas) {
                setConversionCronograma(respuesta.cuotas || []);
                setConversionDescripcion(respuesta.descripcion || 'Simulación completada');
                return;
            }

            toast.current?.show({ severity: 'warn', summary: 'Respuesta inesperada', detail: 'El servidor no devolvió los datos esperados.' });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error en simulación', detail: error.response?.data?.message || 'No se pudo simular el cronograma.' });
        } finally {
            setSimulandoConversion(false);
        }
    };

    const simularConversion = async () => {
        await simularConversionConDatos({
            cuotas: conversionCuotas,
            fechaInicio: conversionFechaInicio,
            flexible: conversionFlexible,
            cuotasEspeciales: conversionCuotasEspeciales,
            montoEspecial: conversionMontoEspecial
        });
    };

    const abrirDialogoEditarInicial = () => {
        setNuevoMontoAdicional(0);
        const cuotaInicial = contrato?.cuotas?.find((c) => c.numero === 0 || c.tipoCuota === 'INICIAL' || c.tipo === 'INICIAL');
        setNuevaFechaLimite(parseLocalYMD(cuotaInicial?.vencimientoRaw) || new Date());
        setDialogoEditarInicial(true);
    };

    const guardarEdicionInicial = async () => {
        if (!nuevaFechaLimite) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar una fecha límite.' });
            return;
        }

        setGuardandoInicial(true);
        try {
            const payload = {
                fechaLimiteInicial: getLocalYMD(nuevaFechaLimite),
                montoInicialAcordado: nuevoMontoAdicional > 0 ? nuevoMontoAdicional : null
            };

            await ContratoService.actualizar(contrato.id, payload, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Condiciones de inicial actualizadas.' });
            setDialogoEditarInicial(false);
            await cargarDetalleContrato(contrato.id);
        } catch (error) {
            console.error(error);
            const detalle = error?.response?.data?.message || 'No se pudieron actualizar las condiciones.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: detalle });
        } finally {
            setGuardandoInicial(false);
        }
    };

    const confirmarConversion = async () => {
        if (!conversionCuotas || conversionCuotas <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Ingrese un número de cuotas válido.' });
            return;
        }
        if (!conversionFechaInicio) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Seleccione la fecha de inicio de pago.' });
            return;
        }
        if (!contrato?.cliente?.id) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'No se encontró el titular del contrato.' });
            return;
        }

        setConfirmandoConversion(true);
        try {
            const payload = {
                clienteId: contrato?.cliente?.id || null,
                coCompradorId: contrato?.coComprador?.id || null,
                loteId: contrato?.lote?.id || null,
                cantidadCuotas: conversionCuotas,
                fechaInicioPago: getLocalYMD(conversionFechaInicio),
                cuotasEspeciales: conversionFlexible ? conversionCuotasEspeciales : 0,
                montoCuotaEspecial: conversionFlexible ? conversionMontoEspecial : 0
            };

            await ContratoService.actualizar(contrato.id, payload, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Contrato actualizado y cronograma generado.' });
            setMostrarConversionModal(false);
            await cargarDetalleContrato(contrato.id);
        } catch (error) {
            console.error(error);
            const detalle = error?.response?.data?.message || 'No se pudo convertir el contrato.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: detalle });
        } finally {
            setConfirmandoConversion(false);
        }
    };

    const verHistorialPdf = async (historialRef) => {
        try {
            const historial = typeof historialRef === 'object'
                ? historialRef
                : historiales.find(h => h.id === historialRef) || { id: historialRef };

            const rutaDocumentoPdf = historial?.rutaDocumentoPdf || '';
            const esEndpointComprobante = rutaDocumentoPdf.startsWith('/api/pagos/comprobante/');
            const esEndpointRecibo = rutaDocumentoPdf.startsWith('/api/pagos/recibo/');
            const esEndpointNotaVenta = rutaDocumentoPdf.startsWith('/api/pagos/') && rutaDocumentoPdf.includes('/nota-venta');

            let blob = null;
            if (rutaDocumentoPdf && (esEndpointComprobante || esEndpointRecibo || esEndpointNotaVenta)) {
                const client = axiosInstance || null;
                if (!client) {
                    window.open(rutaDocumentoPdf, '_blank');
                    return;
                }

                const normalizedPath = rutaDocumentoPdf.startsWith('/api/')
                    ? rutaDocumentoPdf.replace(/^\/api\//, '')
                    : rutaDocumentoPdf;

                const response = await client.get(normalizedPath, { responseType: 'blob' });
                blob = response.data;
            } else if (historial?.id) {
                blob = await ContratoHistorialService.descargarPdf(historial.id, axiosInstance);
            }

            if (!blob) {
                throw new Error('No se pudo resolver el PDF historico.');
            }

            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Optionally revoke URL after some time
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el PDF histórico.' });
        }
    };

    const medidasCompletas = (() => {
        const medidas = contrato?.medidas;
        if (!medidas) return false;
        const campos = [
            medidas.mlFrente,
            medidas.mlDerecha,
            medidas.mlIzquierda,
            medidas.mlFondo,
            medidas.colindanciaFrente,
            medidas.colindanciaDerecha,
            medidas.colindanciaIzquierda,
            medidas.colindanciaFondo,
            medidas.perimetro
        ];
        return campos.every((valor) => valor !== null && valor !== undefined && `${valor}`.trim() !== '');
    })();

    const handleVistaPrevia = async () => {
        if (!contrato?.id) return;

        if (contrato?.estadoContrato === 'ACTIVO' && !medidasCompletas) {
            setMedidasEdit({
                mlFrente: contrato.medidas?.mlFrente ?? '',
                mlDerecha: contrato.medidas?.mlDerecha ?? '',
                mlIzquierda: contrato.medidas?.mlIzquierda ?? '',
                mlFondo: contrato.medidas?.mlFondo ?? '',
                colindanciaFrente: contrato.medidas?.colindanciaFrente ?? '',
                colindanciaDerecha: contrato.medidas?.colindanciaDerecha ?? '',
                colindanciaIzquierda: contrato.medidas?.colindanciaIzquierda ?? '',
                colindanciaFondo: contrato.medidas?.colindanciaFondo ?? ''
            });
            setMostrarPanelMedidas(true);
            return;
        }

        try {
            toast.current?.show({ severity: 'info', summary: 'Generando...', detail: 'Cargando vista previa del contrato.' });
            const blob = await ContratoService.generarVistaPreviaPdf(contrato.id, axiosInstance);
            const url = URL.createObjectURL(blob);
            setPdfViewer(url);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo generar la vista previa.' });
        }
    };

    const guardarYGenerarPreviaMedidas = async () => {
        if (!contrato?.id) return;
        try {
            await ContratoService.completarMedidas(contrato.id, {
                mlFrente: medidasEdit.mlFrente === '' ? null : Number(medidasEdit.mlFrente),
                mlDerecha: medidasEdit.mlDerecha === '' ? null : Number(medidasEdit.mlDerecha),
                mlIzquierda: medidasEdit.mlIzquierda === '' ? null : Number(medidasEdit.mlIzquierda),
                mlFondo: medidasEdit.mlFondo === '' ? null : Number(medidasEdit.mlFondo),
                colindanciaFrente: medidasEdit.colindanciaFrente || null,
                colindanciaDerecha: medidasEdit.colindanciaDerecha || null,
                colindanciaIzquierda: medidasEdit.colindanciaIzquierda || null,
                colindanciaFondo: medidasEdit.colindanciaFondo || null
            }, axiosInstance);
            await cargarDetalleContrato(contrato.id);
            setMostrarPanelMedidas(false);
            // Después de guardar, generar la vista previa
            handleVistaPrevia();
        } catch (error) {
            console.error('Error al guardar medidas:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar las medidas.' });
        }
    };

    const handleSubirPdf = async () => {
        const esReemplazo = Boolean(contrato?.urlDocumentoFirmado);
        if (!archivoContrato) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un archivo PDF.' });
            return;
        }
        if (esReemplazo && !motivoDocumento.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese el motivo del reemplazo.' });
            return;
        }
        setSubiendoPdf(true);
        try {
            const motivoFinal = motivoDocumento.trim() || 'Subida inicial del documento firmado.';
            await ContratoService.subirDocumentoFirmado(contrato.id, archivoContrato, motivoFinal, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: esReemplazo ? 'Documento reemplazado correctamente.' : 'Documento subido correctamente.' });
            setDialogoSubirPdf(false);
            setArchivoContrato(null);
            setMotivoDocumento('');
            cargarDetalleContrato(contrato.id);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el archivo.' });
        } finally {
            setSubiendoPdf(false);
        }
    };

    const abrirPanelPago = (cuota) => {
        setCuotaPagar(cuota);
        setMontoAbonar(cuota.montoTotal - cuota.montoPagado);
        setVoucherFileRegistro(null);
    };

    const registrarPago = async () => {
        if (!cuotaPagar?.id) {
            toast.current?.show({ severity: 'warn', summary: 'Pago inválido', detail: 'Seleccione una cuota válida.' });
            return;
        }
        if (montoAbonar <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Monto inválido', detail: 'El monto debe ser mayor a cero.' });
            return;
        }

        setRegistrandoPago(true);
        try {
            const formData = new FormData();
            formData.append('cuotaId', cuotaPagar.id);
            formData.append('montoAbonado', montoAbonar);
            formData.append('metodoPago', metodoPago);
            formData.append('tipoComprobante', tipoComprobante);
            if (numOperacion) formData.append('numeroOperacion', numOperacion);
            if (descripcionPago) formData.append('descripcion', descripcionPago);
            if (voucherFileRegistro) {
                formData.append('voucher', voucherFileRegistro);
            }

            await PagoService.registrar(formData, axiosInstance);

            // Recargar el contrato para actualizar los datos
            await cargarDetalleContrato(contrato.id);

            toast.current?.show({ severity: 'success', summary: 'Pago Registrado', detail: `Se generó el comprobante por S/ ${montoAbonar.toLocaleString('en-US', { minimumFractionDigits: 2 })}` });

            // Limpiar formulario y volver a seleccionar la cuota actualizada
            setCuotaPagar(null);
            setMontoAbonar(0);
            setNumOperacion('');
            setDescripcionPago('');
            setMetodoPago('Transferencia BCP');
            setTipoComprobante(TipoComprobante.NOTA_ABONO);
            // Nota: La cuota se actualizará automáticamente al recargar el contrato
            setCuotaSeleccionada(null);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pago.' });
        } finally {
            setRegistrandoPago(false);
        }
    };

    const calcularDiasVencidos = (fechaVencimientoStr) => {
        if (!fechaVencimientoStr) return 0;
        let fecha;

        // Parsear fecha sin afectar por zona horaria
        if (fechaVencimientoStr.includes('/')) {
            // Formato DD/MM/YYYY
            const [dia, mes, anio] = fechaVencimientoStr.split('/');
            fecha = new Date(anio, mes - 1, dia);
        } else if (fechaVencimientoStr.includes('-')) {
            // Formato ISO YYYY-MM-DD (sin parsear como UTC)
            const [anio, mes, dia] = fechaVencimientoStr.split('T')[0].split('-');
            fecha = new Date(anio, mes - 1, dia);
        } else {
            fecha = new Date(fechaVencimientoStr);
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fecha.setHours(0, 0, 0, 0);

        const diffTime = hoy.getTime() - fecha.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const extraerNumeroRecibo = (rutaDocumentoPdf, descripcion) => {
        if (rutaDocumentoPdf) {
            const match = rutaDocumentoPdf.match(/recibo\/([^/]+)\/pdf/i);
            if (match?.[1]) return match[1];
        }

        if (descripcion) {
            const match = descripcion.match(/recibo\s+([A-Z0-9-]+)/i);
            if (match?.[1]) return match[1];
        }

        return '';
    };

    const extraerNumeroComprobante = (rutaDocumentoPdf, descripcion) => {
        if (rutaDocumentoPdf) {
            const match = rutaDocumentoPdf.match(/comprobante\/([^/]+)\/pdf/i);
            if (match?.[1]) return match[1];
        }

        if (descripcion) {
            const match = descripcion.match(/comprobante\s+([A-Z0-9-]+)/i);
            if (match?.[1]) return match[1];
        }

        return '';
    };

    const getNumeroHistorial = (registro) => {
        const numeroRecibo = extraerNumeroRecibo(registro?.rutaDocumentoPdf, registro?.descripcion);
        if (numeroRecibo) return numeroRecibo;

        const numeroComprobante = extraerNumeroComprobante(registro?.rutaDocumentoPdf, registro?.descripcion);
        if (numeroComprobante) return numeroComprobante;

        return '-';
    };

    const historialesOrdenados = useMemo(() => {
        return [...(historiales || [])].sort((a, b) => {
            const fechaA = a?.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
            const fechaB = b?.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
            return fechaB - fechaA;
        });
    }, [historiales]);

    const abrirDialogoReciboIngreso = (historial) => {
        const numero = extraerNumeroRecibo(historial?.rutaDocumentoPdf, historial?.descripcion);
        if (!numero) {
            toast.current?.show({ severity: 'warn', summary: 'Recibo', detail: 'No se pudo identificar el numero de recibo.' });
            return;
        }
        setReciboIngresoNumero(numero);
        setArchivoReciboIngreso(null);
        setDialogoSubirReciboIngreso(true);
    };

    const subirReciboIngreso = async () => {
        if (!reciboIngresoNumero || !archivoReciboIngreso) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'Seleccione un archivo valido.' });
            return;
        }

        setSubiendoReciboIngreso(true);
        try {
            await PagoService.subirReciboFirmado(reciboIngresoNumero, archivoReciboIngreso, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Listo', detail: 'Recibo firmado subido correctamente.' });
            setDialogoSubirReciboIngreso(false);
            await cargarDetalleContrato(contrato.id);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el recibo firmado.' });
        } finally {
            setSubiendoReciboIngreso(false);
        }
    };

    const isPendiente = (estado) => {
        if (!estado) return false;
        return estado.toUpperCase() === 'POR_VALIDAR';
    };

    const abrirDialogoProcesar = (pago) => {
        setPagoPendiente(pago);
        setMetodoPagoPendiente(pago.metodoPago || 'Transferencia BCP');
        setNumOperacionPendiente(pago.numeroOperacion || '');
        setDescripcionPagoPendiente(pago.descripcion || '');
        setVoucherFilePendiente(null);
    };

    const procesarPagoPendiente = async () => {
        try {
            const formData = new FormData();
            formData.append('metodoPago', metodoPagoPendiente);
            if (numOperacionPendiente) formData.append('numeroOperacion', numOperacionPendiente);
            if (descripcionPagoPendiente) formData.append('descripcion', descripcionPagoPendiente);
            if (voucherFilePendiente) {
                formData.append('voucher', voucherFilePendiente);
            }

            await PagoService.procesarPendiente(pagoPendiente.id, formData, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Pago Procesado', detail: 'El pago fue aplicado correctamente.' });

            // Recargar el contrato y limpiar estados
            await cargarDetalleContrato(contrato.id);
            setPagoPendiente(null);
            setCuotaSeleccionada(null);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el pago.' });
        }
    };

    const getEtiquetaComprobante = (tipo) => {
        switch ((tipo || '').toUpperCase()) {
            case 'RECIBO_INGRESO':
                return 'Recibo de Ingreso';
            case 'NOTA_ABONO':
                return 'Nota de Abono';
            case 'BOLETA':
                return 'Boleta';
            case 'FACTURA':
                return 'Factura';
            case 'NOTA_CREDITO':
                return 'Nota de Credito';
            case 'NOTA_DEBITO':
                return 'Nota de Debito';
            default:
                return 'Comprobante';
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
            } else if (pago?.idOriginal || pago?.id) {
                const pagoId = pago.idOriginal || String(pago.id).replace('REC-', '');
                blob = await PagoService.descargarNotaVenta(pagoId, axiosInstance);
            }

            if (!blob) {
                throw new Error('No se pudo resolver el comprobante.');
            }

            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el comprobante.' });
        }
    };

    const getStatusSeverity = (estado) => {
        const estadoUpper = (estado || '').toUpperCase();

        // Estados de contrato activo/exitoso
        if (estadoUpper === 'ACTIVO' || estadoUpper === 'PAGADO' || estadoUpper === 'PAGADO_TOTAL' || estadoUpper === 'PAGADO_DESTIEMPO' || estadoUpper === 'VENDIDO') {
            return 'success';
        }


        // Estados de advertencia
        if (estadoUpper === 'PAGADO_PARCIAL' || estadoUpper === 'DESTIEMPO' || estadoUpper === 'RESERVADO' || estadoUpper === 'SEPARADO') {
            return 'warning';
        }

        // Estados de pago atrasado
        if (estadoUpper === 'VENCIDA' || estadoUpper === 'VENCIDO' || estadoUpper === 'ATRASADA' || estadoUpper === 'ATRASADO') {
            return 'danger';
        }

        // Estados por defecto (pendiente, info)
        if (estadoUpper === 'PENDIENTE' || estadoUpper === 'POR_VALIDAR') {
            return 'info';
        }

        return 'info';
    };

    const estadoCuotaTemplate = (rowData) => {
        const estadoOriginal = (rowData?.estado || '').toUpperCase();
        const estadoFormateado = estadoOriginal.replace(/_/g, ' ');

        const fechaVencimientoString = rowData?.vencimientoRaw || rowData?.vencimiento;
        if (!fechaVencimientoString) return <Tag value={estadoFormateado} />;
        
        let fecha;
        if (fechaVencimientoString.includes('/')) {
            const [dia, mes, anio] = fechaVencimientoString.split('/');
            fecha = new Date(anio, mes - 1, dia);
        } else {
            fecha = new Date(fechaVencimientoString + 'T00:00:00');
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fecha.setHours(0, 0, 0, 0);

        const unDiaEnMilisegundos = 1000 * 60 * 60 * 24;
        const diferenciaMilisegundos = fecha.getTime() - hoy.getTime();
        const diasDiferencia = Math.floor(diferenciaMilisegundos / unDiaEnMilisegundos);

        const estaVencidaPorEstado = estadoOriginal === 'VENCIDA' || estadoOriginal === 'VENCIDO' || estadoOriginal === 'ATRASADA' || estadoOriginal === 'ATRASADO';
        const estaVencidaPorFecha = (estadoOriginal === 'PENDIENTE' || estadoOriginal === 'PAGADO_PARCIAL') && diasDiferencia < 0;

        if (estaVencidaPorEstado || estaVencidaPorFecha) {
            return <Tag severity="danger" value="VENCIDO" icon="pi pi-exclamation-triangle" />;
        }

        const esPendienteOParcial = estadoOriginal === 'PENDIENTE' || estadoOriginal === 'PAGADO_PARCIAL';
        const estaPorVencer = esPendienteOParcial && diasDiferencia >= 0 && diasDiferencia <= 3;

        if (estaPorVencer) {
            return (
                <div className="flex flex-column gap-1 align-items-center">
                    <Tag severity="warning" value="POR VENCER" />
                    <span className="text-xs text-orange-600 font-bold flex align-items-center">
                        <i className="pi pi-exclamation-triangle mr-1"></i>
                        {diasDiferencia === 0 ? 'Vence hoy' : `En ${diasDiferencia} días`}
                    </span>
                </div>
            );
        }

        if (estadoOriginal === 'PAGADO_DESTIEMPO') {
            return <Tag severity="warning" value="PAG. DESTIEMPO" icon="pi pi-exclamation-triangle" />;
        }

        let severity = 'info';
        if (estadoOriginal === 'PAGADO_TOTAL' || estadoOriginal === 'PAGADO') severity = 'success';
        else if (estadoOriginal === 'PAGADO_PARCIAL' || estadoOriginal === 'POR_VALIDAR') severity = 'warning';

        return <Tag severity={severity} value={estadoFormateado} />;
    };

    const retrasoTemplate = (rowData) => {
        const estadoOriginal = (rowData?.estado || '').toUpperCase();
        
        if (estadoOriginal === 'PAGADO_DESTIEMPO') {
            const pagoAtrasado = historialPagos.find(p => p.cuotaId === rowData?.id && p.pagoADestiempo);
            const diasRetraso = pagoAtrasado ? pagoAtrasado.diasRetraso : (rowData?.diasRetraso || 0);
            return diasRetraso > 0 ? <span className="text-red-600 font-bold text-sm">{diasRetraso}d</span> : <span className="text-400 text-sm">-</span>;
        }

        const fechaVencimientoString = rowData?.vencimientoRaw || rowData?.vencimiento;
        if (!fechaVencimientoString) return <span className="text-400 text-sm">-</span>;
        
        let fecha;
        if (fechaVencimientoString.includes('/')) {
            const [dia, mes, anio] = fechaVencimientoString.split('/');
            fecha = new Date(anio, mes - 1, dia);
        } else {
            fecha = new Date(fechaVencimientoString + 'T00:00:00');
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fecha.setHours(0, 0, 0, 0);

        const unDiaEnMilisegundos = 1000 * 60 * 60 * 24;
        const diasDiferencia = Math.floor((fecha.getTime() - hoy.getTime()) / unDiaEnMilisegundos);

        const estaVencidaPorEstado = estadoOriginal === 'VENCIDA' || estadoOriginal === 'VENCIDO' || estadoOriginal === 'ATRASADA' || estadoOriginal === 'ATRASADO';
        const estaVencidaPorFecha = (estadoOriginal === 'PENDIENTE' || estadoOriginal === 'PAGADO_PARCIAL') && diasDiferencia < 0;

        if (estaVencidaPorEstado || estaVencidaPorFecha) {
            return <span className="text-red-600 font-bold text-sm">{Math.abs(diasDiferencia)}d</span>;
        }

        return <span className="text-400 text-sm">-</span>;
    };

    const estadoContratoActual = (contrato?.estadoContrato || '').toUpperCase();
    const esSeparacion = estadoContratoActual === 'SEPARADO';
    const cuotaInicial = contrato?.cuotas?.find((c) => c.numero === 0 || c.tipoCuota === 'INICIAL' || c.tipo === 'INICIAL');
    const inicialCompleta = cuotaInicial
        ? (Number(cuotaInicial.montoTotal || 0) - Number(cuotaInicial.montoPagado || 0) <= 0)
        : (contrato?.finanzas?.faltaPagarInicial || 0) <= 0;
    const progresoInicial = cuotaInicial && Number(cuotaInicial.montoTotal || 0) > 0
        ? Math.min(100, Math.round((Number(cuotaInicial.montoPagado || 0) / Number(cuotaInicial.montoTotal || 0)) * 100))
        : 0;
    const tieneCronograma = (contrato?.cuotas || []).some((c) => (c?.numero ?? 0) > 0);
    const conversionDisponible = inicialCompleta && !tieneCronograma;
    const cuotasVisibles = tieneCronograma || !cuotaInicial
        ? (contrato?.cuotas || [])
        : [cuotaInicial];

    useEffect(() => {
        if (!conversionDisponible || conversionPrompted) return;
        setConversionPrompted(true);
        confirmDialog({
            message: 'Inicial pagada totalmente. Deseas hacer la Proyeccion Financiera?',
            header: 'Proyeccion financiera',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Si',
            rejectLabel: 'No',
            accept: () => {
                setConversionDismissed(false);
                setMostrarConversionModal(true);
            },
            reject: () => {
                setConversionDismissed(true);
            }
        });
    }, [conversionDisponible, conversionPrompted]);



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
        <div className="detallecontrato-page surface-ground p-3 md:p-5">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* MODALES */}
            <Dialog header={<><i className="pi pi-image text-blue-500 mr-2"></i>Comprobante</>} visible={!!voucherViewer} style={{ width: '700px', maxWidth: '95vw' }} onHide={() => setVoucherViewer(null)}>
                {voucherViewer && (
                    <div className="flex justify-content-center align-items-center surface-100 border-round p-2" style={{ minHeight: '400px' }}>
                        {isPdf(voucherViewer) ? <iframe src={voucherViewer} title="Voucher" className="w-full border-none border-round" style={{ height: '500px' }} /> : <img src={voucherViewer} alt="Voucher" style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain' }} className="border-round shadow-2" />}
                    </div>
                )}
            </Dialog>

            <Dialog header={<><i className="pi pi-file-pdf text-red-500 mr-2"></i>Documento Histórico / Vista Previa</>} visible={!!pdfViewer} style={{ width: 'min(1200px, 98vw)', height: '90vh' }} modal onHide={() => { if (pdfViewer) URL.revokeObjectURL(pdfViewer); setPdfViewer(null); }}>
                {pdfViewer && (
                    <div className="flex justify-content-center align-items-center surface-100 border-round p-2" style={{ minHeight: '70vh' }}>
                        <iframe src={pdfViewer} title="Historial" className="w-full border-none border-round" style={{ height: '80vh' }} />
                    </div>
                )}
            </Dialog>

            <Dialog header={<><i className="pi pi-check-circle text-green-500 mr-2"></i>Proyeccion financiera</>} visible={mostrarConversionModal} style={{ width: 'min(1400px, 95vw)' }} modal onHide={() => { setMostrarConversionModal(false); setConversionDismissed(true); }}>
                <div className="grid p-fluid">
                    <div className="col-12 lg:col-5">
                        <div className="surface-0 border-1 surface-border border-round-xl p-4 h-full">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-wallet text-green-600"></i>
                                <span className="font-bold text-lg">Configuracion del Cronograma</span>
                            </div>

                            <div className="field mb-3">
                                <label className="font-medium text-700 block mb-2">Numero de cuotas</label>
                                <InputNumber value={conversionCuotas} onValueChange={(e) => setConversionCuotas(e.value)} min={1} max={240} showButtons className="w-full" />
                            </div>

                            <div className="field mb-3">
                                <label className="font-medium text-700 block mb-2">Fecha inicio de pago</label>
                                <Calendar value={conversionFechaInicio} onChange={(e) => setConversionFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon className="w-full" />
                            </div>

                            <div className="field mb-3">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="flexible-conversion" checked={conversionFlexible} onChange={(e) => setConversionFlexible(e.checked)} />
                                    <label htmlFor="flexible-conversion" className="ml-2 font-medium text-700">Simulacion especial (cuotas mixtas)</label>
                                </div>
                            </div>

                            {conversionFlexible && (
                                <div className="grid">
                                    <div className="field col-12 md:col-6">
                                        <label className="text-xs font-bold text-orange-800 uppercase">Cuotas especiales</label>
                                        <InputNumber value={conversionCuotasEspeciales} onValueChange={(e) => setConversionCuotasEspeciales(e.value)} min={0} className="w-full" />
                                    </div>
                                    <div className="field col-12 md:col-6">
                                        <label className="text-xs font-bold text-orange-800 uppercase">Monto especial (S/)</label>
                                        <InputNumber value={conversionMontoEspecial} onValueChange={(e) => setConversionMontoEspecial(e.value)} mode="currency" currency="PEN" className="w-full" />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 mt-4">
                                <Button label="Simular" icon="pi pi-calculator" className="btn-primary-custom shadow-2 border-round-xl font-bold" style={{ color: '#fff' }} onClick={simularConversion} loading={simulandoConversion} />
                                <Button label="Guardar cronograma" icon="pi pi-check" className="p-button-success" style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }} onClick={confirmarConversion} loading={confirmandoConversion} disabled={conversionCronograma.length === 0} />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 lg:col-7">
                        <div className="surface-0 border-1 surface-border border-round-xl p-4 h-full">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-calendar text-blue-600"></i>
                                <span className="font-bold text-lg">Proyeccion financiera</span>
                            </div>

                            {conversionDescripcion && (
                                <div className={`bg-${esSeparacion ? 'orange' : 'blue'}-50 border-1 border-${esSeparacion ? 'orange' : 'blue'}-100 border-round p-3 mb-3 text-sm text-700`}>
                                    {conversionDescripcion}
                                </div>
                            )}

                            {conversionCronograma.length === 0 ? (
                                <div className="p-4 border-1 border-dashed surface-border border-round text-500 text-center">
                                    Sin simulacion. Ajuste los parametros y simule.
                                </div>
                            ) : (
                                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                    <div className="grid mb-3">
                                        <div className="col-12 md:col-4">
                                            <div className="summary-box bg-white h-full p-3">
                                                <span className="summary-title">Total a Financiar</span>
                                                <span className="summary-value">S/ {contrato.finanzas.saldoFinanciar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                        <div className="col-12 md:col-4">
                                            <div className="summary-box bg-white h-full p-3">
                                                <span className="summary-title">Cuotas</span>
                                                <span className="summary-value">{conversionCuotas} + Inicial</span>
                                            </div>
                                        </div>
                                        <div className="col-12 md:col-4">
                                            <div className="summary-box bg-white h-full p-3">
                                                <span className="summary-title">Cuotas Especiales</span>
                                                <span className="summary-value">{conversionFlexible ? `${conversionCuotasEspeciales} x S/ ${conversionMontoEspecial}` : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <DataTable value={conversionCronograma} className="p-datatable-sm custom-table" scrollable scrollHeight="250px">
                                        <Column field="numero" header="N°" style={{ width: '10%' }}></Column>
                                        <Column field="tipoCuota" header="Tipo" style={{ width: '20%' }}></Column>
                                        <Column field="fecha" header="Vencimiento" style={{ width: '30%' }} body={(row) => formatearFechaLarga(row.fecha)}></Column>
                                        <Column header="Monto (S/)" style={{ width: '20%', textAlign: 'right' }} body={(row) => `S/ ${Number(row.montoTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                                        </Column>
                                        <Column field="estado" header="Estado" style={{ width: '20%', textAlign: 'center' }}></Column>
                                    </DataTable>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog header={<><i className="pi pi-upload text-primary mr-2"></i>{contrato?.urlDocumentoFirmado ? 'Reemplazar Documento Firmado' : 'Subir Documento Firmado'}</>} visible={dialogoSubirPdf} style={{ width: '520px' }} modal onHide={() => setDialogoSubirPdf(false)}>
                <div className="flex flex-column gap-3 mt-3">
                    <div className="flex flex-column gap-2">
                        <label className="font-bold">Archivo PDF Firmado</label>
                        <div className="relative flex flex-column align-items-center justify-content-center p-4 border-2 border-dashed border-round-xl surface-border hover:surface-hover transition-colors cursor-pointer bg-blue-50">
                            <input
                                type="file"
                                className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer z-10"
                                accept="application/pdf"
                                onChange={(e) => setArchivoContrato(e.target.files[0])}
                            />
                            {archivoContrato ? (
                                <div className="text-center flex flex-column align-items-center">
                                    <i className="pi pi-file-check text-3xl text-green-500 mb-2"></i>
                                    <span className="font-bold text-700 text-sm">{archivoContrato.name}</span>
                                    <span className="text-xs text-500">{(archivoContrato.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                            ) : (
                                <div className="text-center flex flex-column align-items-center">
                                    <i className="pi pi-cloud-upload text-2xl text-blue-500 mb-2"></i>
                                    <span className="font-bold text-700 text-sm">Haz clic o arrastra</span>
                                    <span className="text-xs text-500 mt-1">PDF firmado</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-column gap-2">
                        <label className="font-bold">Motivo {contrato?.urlDocumentoFirmado ? '(Requerido)' : '(Opcional)'}</label>
                        <input type="text" value={motivoDocumento} onChange={(e) => setMotivoDocumento(e.target.value)} className="p-inputtext p-component" />
                    </div>
                </div>
                <div className="flex justify-content-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" onClick={() => setDialogoSubirPdf(false)} className="p-button-text" />
                    <Button label={contrato?.urlDocumentoFirmado ? 'Reemplazar' : 'Subir Archivo'} icon="pi pi-check" onClick={handleSubirPdf} loading={subiendoPdf} className="btn-primary-custom shadow-2 border-round-xl font-bold" />
                </div>
            </Dialog>

            <Dialog
                header={`Subir Recibo de Ingreso: ${reciboIngresoNumero || ''}`}
                visible={dialogoSubirReciboIngreso}
                style={{ width: '420px' }}
                modal
                onHide={() => setDialogoSubirReciboIngreso(false)}
            >
                <div className="flex flex-column gap-3">
                    <p className="text-sm text-600 m-0">Adjunta la foto o PDF firmado por el cliente.</p>
                    <div className="relative flex flex-column align-items-center justify-content-center p-4 border-2 border-dashed border-round-xl surface-border hover:surface-hover transition-colors cursor-pointer bg-blue-50">
                        <input
                            type="file"
                            className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer z-10"
                            accept="image/*,application/pdf"
                            onChange={(e) => setArchivoReciboIngreso(e.target.files[0])}
                        />
                        {archivoReciboIngreso ? (
                            <div className="text-center flex flex-column align-items-center">
                                <i className="pi pi-file-check text-3xl text-green-500 mb-2"></i>
                                <span className="font-bold text-700 text-sm">{archivoReciboIngreso.name}</span>
                                <span className="text-xs text-500">{(archivoReciboIngreso.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className="text-center flex flex-column align-items-center">
                                <i className="pi pi-cloud-upload text-2xl text-blue-500 mb-2"></i>
                                <span className="font-bold text-700 text-sm">Haz clic o arrastra</span>
                                <span className="text-xs text-500 mt-1">JPG, PNG, PDF</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" className="p-button-text" onClick={() => setDialogoSubirReciboIngreso(false)} />
                        <Button label="Subir" icon="pi pi-upload" className='btn-primary-custom shadow-2 border-round-xl font-bold text-white' loading={subiendoReciboIngreso} onClick={subirReciboIngreso} />
                    </div>
                </div>
            </Dialog>

            {/* MODAL: PROCESAR PAGO PENDIENTE */}
            <Dialog header="Procesar Pago Pendiente" visible={!!pagoPendiente} style={{ width: '400px' }} onHide={() => setPagoPendiente(null)}>
                {pagoPendiente && (
                    <div className="p-fluid">
                        <div className="mb-3">
                            <span className="font-bold block mb-2">Recibo: {pagoPendiente.id}</span>
                            <span className="text-lg font-bold text-blue-600 block mb-3">S/ {(pagoPendiente.montoAbonado || pagoPendiente.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="field mb-3">
                            <label className="font-medium text-700 block mb-2">Método de Pago</label>
                            <Dropdown value={metodoPagoPendiente} options={metodosPago} onChange={(e) => setMetodoPagoPendiente(e.value)} placeholder='Selecione metodo de pago' />
                        </div>
                        {metodoPagoPendiente === 'EFECTIVO' ? (
                            <Tag
                                severity="warning"
                                value="Pago en efectivo: se genera Recibo de Ingreso"
                                className="w-full justify-content-center"
                            />
                        ) : (
                            <div className="field mb-3">
                                <label className="font-medium text-700 block mb-2">Número de Operación</label>
                                <InputText value={numOperacionPendiente} onChange={(e) => setNumOperacionPendiente(e.target.value)} placeholder="Ej: 998273" />
                            </div>
                        )}
                        <div className="field mb-3">
                            <label className="font-medium text-700 block mb-2">Descripción / Observación (Opcional)</label>
                            <InputTextarea value={descripcionPagoPendiente} onChange={(e) => setDescripcionPagoPendiente(e.target.value)} rows={2} autoResize className="w-full" placeholder="Ej: Validado con finanzas..." />
                        </div>
                        <div className="field mb-4">
                            <label className="font-medium text-700 block mb-2">Comprobante / Voucher (Opcional)</label>
                            <div className="relative flex flex-column align-items-center justify-content-center p-4 border-2 border-dashed border-round-xl surface-border hover:surface-hover transition-colors cursor-pointer bg-blue-50">
                                <input
                                    type="file"
                                    className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer z-10"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setVoucherFilePendiente(e.target.files[0])}
                                />
                                {voucherFilePendiente ? (
                                    <div className="text-center flex flex-column align-items-center">
                                        <i className="pi pi-file-check text-3xl text-green-500 mb-2"></i>
                                        <span className="font-bold text-700 text-sm">{voucherFilePendiente.name}</span>
                                        <span className="text-xs text-500">{(voucherFilePendiente.size / (1024 * 1024)).toFixed(2)} MB</span>
                                    </div>
                                ) : (
                                    <div className="text-center flex flex-column align-items-center">
                                        <i className="pi pi-cloud-upload text-2xl text-blue-500 mb-2"></i>
                                        <span className="font-bold text-700 text-sm">Haz clic o arrastra</span>
                                        <span className="text-xs text-500 mt-1">JPG, PNG, PDF</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-content-end gap-2">
                            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setPagoPendiente(null)} />
                            <Button label="Procesar Pago" icon="pi pi-check" className="p-button-success border-round-xl font-bold shadow-2 p-button-success text-white" onClick={procesarPagoPendiente} />
                        </div>
                    </div>
                )}
            </Dialog>

            {/* MODAL: EDITAR INICIAL */}
            <Dialog header={<><i className="pi pi-pencil text-warning mr-2"></i>Editar Condiciones de Inicial</>} visible={dialogoEditarInicial} style={{ width: '500px' }} modal onHide={() => setDialogoEditarInicial(false)}>
                <div className="flex flex-column gap-3 mt-3">
                    <div className="field">
                        <label className="font-bold">Nueva Fecha Límite de Separación</label>
                        <Calendar value={nuevaFechaLimite} onChange={(e) => setNuevaFechaLimite(e.value)} dateFormat="dd/mm/yy" showIcon className="w-full" />
                    </div>
                    <div className="field">
                        <label className="font-bold">Abono Adicional (S/)</label>
                        <InputNumber value={nuevoMontoAdicional} onValueChange={(e) => setNuevoMontoAdicional(e.value)} mode="currency" currency="PEN" className="w-full" />
                        <small className="text-500">Monto nuevo que traerá el cliente para sumar a lo ya pagado (Deje en 0 si solo cambia la fecha).</small>
                    </div>
                </div>
                <div className="flex justify-content-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setDialogoEditarInicial(false)} disabled={guardandoInicial} />
                    <Button label="Guardar" icon="pi pi-check" className="p-button-success shadow-2 border-round-xl font-bold text-white" onClick={guardarEdicionInicial} loading={guardandoInicial} />
                </div>
            </Dialog>

            {/* MODAL: EDITAR CONTRATO */}
            <Dialog header="Editar Contrato" visible={dialogoEditarContrato} style={{ width: 'min(1100px, 95vw)' }} maximizable onHide={cerrarEditorContrato}>
                <div className="grid p-fluid">
                    <div className="col-12 lg:col-5">
                        <div className="surface-0 border-1 surface-border border-round-xl p-4 h-full">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-user text-blue-600"></i>
                                <span className="font-bold text-lg">Cliente y Co-comprador</span>
                            </div>

                            <div className="field mb-3">
                                <label className="font-medium text-700 block mb-2">Titular del contrato</label>
                                <Dropdown
                                    value={clienteEditId}
                                    options={clientesOptions}
                                    onChange={(e) => setClienteEditId(e.value)}
                                    optionLabel="nombreCompleto"
                                    optionValue="id"
                                    placeholder="Seleccione un cliente"
                                    filter
                                    showClear={false}
                                    className="w-full"
                                    itemTemplate={(option) => (
                                        <div className="flex flex-column">
                                            <span className="font-medium">{option.nombreCompleto || 'Sin nombre'}</span>
                                            <small className="text-500">{option.detalleDocumento}</small>
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="field mb-0">
                                <label className="font-medium text-700 block mb-2">Co-comprador opcional</label>
                                <Dropdown
                                    value={coCompradorEditId}
                                    options={coCompradoresOptions}
                                    onChange={(e) => setCoCompradorEditId(e.value)}
                                    optionLabel="nombreCompleto"
                                    optionValue="id"
                                    placeholder="Sin co-comprador"
                                    filter
                                    showClear
                                    className="w-full"
                                    itemTemplate={(option) => (
                                        <div className="flex flex-column">
                                            <span className="font-medium">{option.nombreCompleto || 'Sin nombre'}</span>
                                            <small className="text-500">{option.detalleDocumento}</small>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 lg:col-7">
                        <div className="surface-0 border-1 surface-border border-round-xl p-4 h-full">
                            <div className="flex align-items-center gap-2 mb-4">
                                <i className="pi pi-map-marker text-teal-600"></i>
                                <span className="font-bold text-lg">Datos del Lote</span>
                            </div>

                            {/* Lote Actual Seleccionado */}
                            <div className="mb-4 p-3 border-round-xl bg-blue-50 border-1 border-blue-200">
                                <div className="flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <span className="text-blue-800 font-bold block text-sm">Lote Actual</span>
                                        <span className="text-blue-700 font-bold text-lg">{loteEditSeleccionado?.numero ? `Lote ${loteEditSeleccionado.numero}` : 'No seleccionado'}</span>
                                        {loteEditSeleccionado && (
                                            <span className="text-blue-600 text-sm block mt-1">{loteEditSeleccionado.descripcionCompleta}</span>
                                        )}
                                    </div>
                                    {loteEditSeleccionado && (
                                        <div className="text-right">
                                            <span className="text-blue-700 font-bold block">S/ {(loteEditSeleccionado.precioVenta || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-blue-600 text-xs">{loteEditSeleccionado.area || 0} m²</span>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    label={expandirCambioLote ? 'Cancelar Cambio' : 'Cambiar Lote'}
                                    icon={expandirCambioLote ? 'pi pi-times' : 'pi pi-pencil'}
                                    onClick={() => setExpandirCambioLote(!expandirCambioLote)}
                                    className={`btn-primary-custom w-full shadow-2 border-round-xl font-bold mt-2 ${expandirCambioLote ? 'p-button-secondary text-white' : 'p-button-info text-white'}`}
                                    size="small"
                                />
                            </div>

                            {/* Filtros y Lista - Solo si expandir es true */}
                            {expandirCambioLote && (
                                <div className="p-3 bg-amber-50 border-round-xl border-1 border-amber-200">
                                    <div className="grid mb-3">
                                        <div className="col-12 md:col-4">
                                            <label className="font-medium text-700 block mb-2">Urbanización</label>
                                            <Dropdown
                                                value={urbanizacionEdit}
                                                options={urbanizacionesOptions}
                                                onChange={(e) => {
                                                    setUrbanizacionEdit(e.value || null);
                                                    setEtapaEdit(null);
                                                    setManzanaEdit(null);
                                                    setLoteEditId(contrato.lote?.id || null);
                                                }}
                                                optionValue="value"
                                                placeholder="Seleccione Urbanización"
                                                showClear
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="col-12 md:col-4">
                                            <label className="font-medium text-700 block mb-2">Etapa</label>
                                            <Dropdown
                                                value={etapaEdit}
                                                options={etapasOptions}
                                                onChange={(e) => {
                                                    setEtapaEdit(e.value || null);
                                                    setManzanaEdit(null);
                                                    setLoteEditId(contrato.lote?.id || null);
                                                }}
                                                optionValue="value"
                                                placeholder="Seleccione Etapa"
                                                showClear
                                                disabled={!urbanizacionEdit}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="col-12 md:col-4">
                                            <label className="font-medium text-700 block mb-2">Manzana</label>
                                            <Dropdown
                                                value={manzanaEdit}
                                                options={manzanasOptions}
                                                onChange={(e) => {
                                                    setManzanaEdit(e.value || null);
                                                    setLoteEditId(contrato.lote?.id || null);
                                                }}
                                                optionValue="value"
                                                placeholder="Seleccione Manzana"
                                                showClear
                                                disabled={!etapaEdit}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Lista de Lotes */}
                                    <div>
                                        <label className="font-bold text-700 block mb-2">
                                            <i className="pi pi-list mr-2"></i>Lotes disponibles
                                        </label>
                                        {manzanaEdit ? (
                                            lotesFiltradosOptions.length === 0 ? (
                                                <div className="p-3 border-round border-1 border-dashed surface-border text-center text-500">
                                                    No hay lotes para esta manzana.
                                                </div>
                                            ) : (
                                                <div className="lotes-list-container custom-scrollbar">
                                                    {lotesFiltradosOptions.map((loteOpt) => (
                                                        <div
                                                            key={loteOpt.id}
                                                            className={`lote-item-card ${loteEditId === loteOpt.id ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setLoteEditId(loteOpt.id);
                                                                setExpandirCambioLote(false);
                                                            }}
                                                        >
                                                            <div className="lote-item-info">
                                                                <span className="lote-item-title">Lote {loteOpt.numero}</span>
                                                                <span className="lote-item-area"><i className="pi pi-expand mr-1"></i>{loteOpt.area || 0} m²</span>
                                                            </div>
                                                            <div className="lote-item-price">
                                                                <span className="price-tag">S/ {(loteOpt.precioVenta || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                                <i className={`pi ${loteEditId === loteOpt.id ? 'pi-check-circle text-blue-600' : 'pi-circle text-400'} ml-3 text-xl`}></i>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        ) : (
                                            <div className="p-3 border-round border-1 border-dashed surface-border text-center text-500">
                                                Seleccione urbanización, etapa y manzana para ver los lotes.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Nota Adicional */}
                            <div className="mt-4 p-3 bg-amber-50 border-round-xl border-1 border-amber-100">
                                <label className="font-medium text-700 block mb-2">
                                    <i className="pi pi-note mr-2"></i>Nota Adicional (Opcional)
                                </label>
                                <InputTextarea
                                    value={observacionNota}
                                    onChange={(e) => setObservacionNota(e.target.value)}
                                    rows={2}
                                    autoResize
                                    placeholder="Ej: Cambio solicitado por el cliente. Agregar cualquier nota sobre esta modificación..."
                                    className="w-full"
                                />
                            </div>


                        </div>
                    </div>
                </div>

                <div className="flex justify-content-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-danger border-round-xl font-bold" onClick={cerrarEditorContrato} disabled={guardandoEdicion} />
                    <Button label="Guardar Cambios" icon="pi pi-save" className={`btn-primary-custom border-round-xl font-bold shadow-2 p-button-success text-white`} onClick={guardarEdiciones} loading={guardandoEdicion} />
                </div>
            </Dialog>

            {/* PANEL: COMPLETAR MEDIDAS PARA VISTA PREVIA */}
            <Dialog header="Completar Medidas y Colindancias" visible={mostrarPanelMedidas} style={{ width: 'min(800px, 95vw)' }} onHide={() => setMostrarPanelMedidas(false)}>
                <div className="formgrid grid dialog-content-specific">


                    {/* Por el frente */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-arrow-up text-blue-600 mr-2"></i>Por el frente:
                        </label>
                        <InputText
                            value={medidasEdit.colindanciaFrente}
                            onChange={(e) => setMedidasEdit((prev) => ({ ...prev, colindanciaFrente: e.target.value }))}
                            rows={2}
                            autoResize
                            placeholder="Ej: Calle principal, cancha, propiedad de..."
                            className="w-full"
                        />
                    </div>
                    {/* Metros lineales del frente */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-ruler-horizontal text-blue-600 mr-2"></i>Con
                        </label>
                        <InputNumber
                            value={medidasEdit.mlFrente === '' ? null : medidasEdit.mlFrente}
                            onValueChange={(e) => setMedidasEdit((prev) => ({ ...prev, mlFrente: e.value ?? '' }))}
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            suffix=" ML"
                            className="w-full"
                        />
                    </div>

                    {/* Por el lado derecho */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-arrow-right text-green-600 mr-2"></i>Por el lado derecho:
                        </label>

                        <InputText
                            value={medidasEdit.colindanciaDerecha}
                            onChange={(e) => setMedidasEdit((prev) => ({ ...prev, colindanciaDerecha: e.target.value }))}
                            rows={2}
                            autoResize
                            placeholder="Ej: Propiedad de..., lote..."
                            className="w-full"
                        />
                    </div>

                    {/* Medida lineal del derecho */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-ruler-horizontal text-blue-600 mr-2"></i>Con
                        </label>
                        <InputNumber
                            value={medidasEdit.mlDerecha === '' ? null : medidasEdit.mlDerecha}
                            onValueChange={(e) => setMedidasEdit((prev) => ({ ...prev, mlDerecha: e.value ?? '' }))}
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            suffix=" ML"
                            className="w-full"
                        />
                    </div>

                    {/* Por el lado izquierdo */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-arrow-left text-orange-600 mr-2"></i>Por el lado izquierdo:
                        </label>

                        <InputText
                            value={medidasEdit.colindanciaIzquierda}
                            onChange={(e) => setMedidasEdit((prev) => ({ ...prev, colindanciaIzquierda: e.target.value }))}
                            rows={2}
                            autoResize
                            placeholder="Ej: Propiedad de..., lote..."
                            className="w-full"
                        />
                    </div>

                    {/* Medida lineal lado izquierdo*/}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-ruler-horizontal text-blue-600 mr-2"></i>Con
                        </label>
                        <InputNumber
                            value={medidasEdit.mlIzquierda === '' ? null : medidasEdit.mlIzquierda}
                            onValueChange={(e) => setMedidasEdit((prev) => ({ ...prev, mlIzquierda: e.value ?? '' }))}
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            suffix=" ML"
                            className="w-full"
                        />
                    </div>


                    {/* Por el fondo */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-arrow-down text-purple-600 mr-2"></i>Por el fondo:
                        </label>

                        <InputText
                            value={medidasEdit.colindanciaFondo}
                            onChange={(e) => setMedidasEdit((prev) => ({ ...prev, colindanciaFondo: e.target.value }))}
                            rows={2}
                            autoResize
                            placeholder="Ej: Propiedad de..., lote..."
                            className="w-full"
                        />
                    </div>

                    {/* Medida Lineal por el fondo*/}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold text-700 block mb-3">
                            <i className="pi pi-ruler-horizontal text-blue-600 mr-2"></i>Con
                        </label>
                        <InputNumber
                            value={medidasEdit.mlFondo === '' ? null : medidasEdit.mlFondo}
                            onValueChange={(e) => setMedidasEdit((prev) => ({ ...prev, mlFondo: e.value ?? '' }))}
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            suffix=" ML"
                            className="w-full"
                        />
                    </div>


                    {/* Perímetro calculado */}
                    <div className="col-12 mt-4">
                        <div className="surface-0 border-1 surface-border border-round-xl p-4 bg-blue-50 border-blue-100">
                            <div className="flex justify-content-between align-items-center">
                                <div>
                                    <span className="font-medium text-700 block">Perímetro calculado</span>
                                    <small className="text-500">Suma de todos los lados</small>
                                </div>
                                <span className="font-bold text-blue-900 text-3xl">
                                    {(Number(medidasEdit.mlFrente || 0) + Number(medidasEdit.mlDerecha || 0) + Number(medidasEdit.mlIzquierda || 0) + Number(medidasEdit.mlFondo || 0)).toFixed(2)} ML
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-content-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-danger border-round-xl font-bold" onClick={() => setMostrarPanelMedidas(false)} />
                    <Button label="Guardar y Ver Vista Previa" icon="pi pi-check" className={`btn-primary-custom border-round-xl font-bold shadow-2 p-button-success text-white`} onClick={guardarYGenerarPreviaMedidas} />
                </div>
            </Dialog>

            {/* HEADER */}
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-4">
                <div className="flex align-items-center gap-3">
                    <Button icon="pi pi-arrow-left" rounded text severity="secondary" aria-label="Volver" onClick={() => navigate('/historial-comercial')} className="surface-200 hover:surface-300" />
                    <div>
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-file text-blue-600 text-3xl"></i>
                            <h1 className="text-2xl md:text-3xl font-bold text-800 m-0">Detalle del Contrato {contrato.codigo}</h1>
                            <Tag value={contrato.estadoContrato} severity={getStatusSeverity(contrato.estadoContrato)} className="text-sm font-bold px-4 py-2" />
                        </div>
                    </div>
                </div>
                <div className="flex align-items-center gap-2">
                    {conversionDisponible && (
                        <Button label="Proyeccion financiera" icon="pi pi-check" className="p-button-success border-round-xl font-bold shadow-2 text-white" style={{ background: '#10b981', borderColor: '#10b981' }} onClick={abrirConversionModal} />
                    )}
                    {contrato?.urlDocumentoFirmado ? (
                        <>
                            <Button label="Ver Documento" icon="pi pi-file-pdf" className="p-button-success border-round-xl font-bold shadow-2 text-white" onClick={() => {
                                const h = historiales.find(hh => hh.rutaDocumentoPdf && contrato.urlDocumentoFirmado && hh.rutaDocumentoPdf.endsWith(contrato.urlDocumentoFirmado.split('/').pop()));
                                if (h) verHistorialPdf(h);
                                else window.open(buildVoucherUrl(contrato.urlDocumentoFirmado), '_blank');
                            }} />
                            <Button label="Reemplazar" icon="pi pi-upload" className="p-button-warning border-round-xl font-bold shadow-2 text-white" style={{ background: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => setDialogoSubirPdf(true)} />
                        </>
                    ) : (
                        <Button label={`Subir ${contrato?.estadoContrato || 'Contrato'}`} icon="pi pi-upload" className="p-button-danger border-round-xl font-bold shadow-2 text-white" onClick={() => setDialogoSubirPdf(true)} />
                    )}
                    <Button label="Editar Contrato" icon="pi pi-pencil" className="text-white p-button-warning border-round-xl font-bold shadow-2 text-white" onClick={abrirEditorContrato} />
                    {/* <Button label="Ir a Cobranza" icon="pi pi-wallet" className="p-button-primary border-round-xl font-bold shadow-2" onClick={() => navigate('/cuotas-pagos', { state: { buscarContrato: contrato.cliente.numeroDocumento } })} /> */}
                </div>
            </div>

            {/* 1. ACORDEON DE TITULAR Y LOTE */}
            <div className="surface-0 shadow-1 border-round-2xl border-1 surface-border mb-5 overflow-hidden transition-all transition-duration-300">
                <div onClick={() => setIsAccordionOpen(!isAccordionOpen)} className="p-3 px-4 flex justify-content-between align-items-center cursor-pointer hover:surface-50 transition-colors">
                    <div className="flex align-items-center gap-3 text-700">
                        <div className="bg-blue-50 p-2 border-round-lg text-blue-600">
                            <i className="pi pi-id-card text-xl"></i>
                        </div>
                        <span className="font-bold text-lg">Información del Titular e Inmueble</span>
                    </div>
                    <div className="flex align-items-center gap-3 text-500">
                        <span className="text-sm font-medium hidden md:block">Click para {isAccordionOpen ? 'ocultar' : 'mostrar'}</span>
                        <i className={`pi pi-chevron-down text-xl transition-transform transition-duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`}></i>
                    </div>
                </div>

                <div className={`grid grid-nogutter border-top-1 surface-border surface-50 transition-all transition-duration-500 overflow-hidden ${isAccordionOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`} style={{ maxHeight: isAccordionOpen ? '1000px' : '0' }}>
                    {/* Tarjeta Cliente */}
                    <div className="col-12 lg:col-6 p-4 lg:border-right-1 surface-border detalle-titular-card">
                        <div className="flex align-items-start gap-4">
                            <div className="bg-blue-100 text-blue-600 p-3 border-round-2xl">
                                <i className="pi pi-user text-3xl"></i>
                            </div>
                            <div className="w-full">
                                <span className="text-xs font-bold text-500 uppercase tracking-widest block mb-1">Titular del Contrato</span>
                                <span className="font-bold text-xl text-800 block mb-3">{contrato.cliente.nombres} {contrato.cliente.apellidos}</span>
                                <div className="flex flex-column gap-2 text-sm text-600">
                                    <div className="flex align-items-center gap-2"><i className="pi pi-id-card text-400"></i> DNI: {contrato.cliente.numeroDocumento}</div>
                                    <div className="flex align-items-center gap-2"><i className="pi pi-phone text-400"></i> {contrato.cliente.telefono}</div>
                                    <div className="flex align-items-center gap-2"><i className="pi pi-envelope text-400"></i> {contrato.cliente.email}</div>
                                </div>
                            </div>
                        </div>
                        {contrato.coComprador && (
                            <div className="mt-4 pt-4 border-top-1 surface-border flex align-items-start gap-4">
                                <div className="bg-indigo-100 text-indigo-600 p-2 border-round-xl">
                                    <i className="pi pi-users text-xl"></i>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Co-comprador</span>
                                    <span className="font-bold text-lg text-800 block mb-2">{contrato.coComprador.nombres} {contrato.coComprador.apellidos}</span>
                                    <div className="text-sm text-600">
                                        <div className="flex align-items-center gap-2"><i className="pi pi-id-card text-400"></i> DNI: {contrato.coComprador.numeroDocumento}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tarjeta Lote */}
                    <div className="col-12 lg:col-6 p-4 lg:border-right-1 surface-border detalle-titular-card">
                        <div className="flex align-items-start gap-4">
                            <div className={`p-3 border-round-2xl ${esSeparacion ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-600'}`}>
                                <i className="pi pi-map-marker text-3xl"></i>
                            </div>
                            <div className="w-full">
                                <div className="flex justify-content-between align-items-start mb-1">
                                    <span className="text-xs font-bold text-500 uppercase tracking-widest">Inmueble Adquirido</span>
                                    <Tag value={contrato.lote.estado} severity={getStatusSeverity(contrato.lote.estado)} className="text-sm font-bold px-3 py-1" />
                                </div>
                                <span className="font-bold text-2xl text-800 block mb-3">{contrato.lote.descripcion}</span>
                                <div className="flex flex-column gap-2 text-sm text-600 font-medium">
                                    <div className="flex align-items-center gap-2"><i className="pi pi-building text-400"></i> Proyecto: {contrato.lote.proyecto}</div>
                                    <div className="flex align-items-center gap-2"><i className="pi pi-clone text-400"></i> Área: {contrato.lote.area}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta Vendedor */}
                    <div className="col-12 lg:col-6 p-4 mt-3 lg:mt-0">
                        <div className="flex align-items-start gap-4">
                            <div className="bg-purple-100 text-purple-600 p-3 border-round-2xl">
                                <i className="pi pi-user-edit text-3xl"></i>
                            </div>
                            <div className="w-full">
                                <span className="text-xs font-bold text-500 uppercase tracking-widest block mb-1">Asesor de Ventas</span>
                                <span className="font-bold text-xl text-800 block mb-3">{contrato.vendedor}</span>
                                {contrato.vendedorDetalle && (
                                    <div className="flex flex-column gap-2 text-sm text-600">
                                        <div className="flex align-items-center gap-2"><i className="pi pi-id-card text-400"></i> DNI: {contrato.vendedorDetalle.numeroDocumento}</div>
                                        <div className="flex align-items-center gap-2"><i className="pi pi-phone text-400"></i> {contrato.vendedorDetalle.telefono}</div>
                                        <div className="flex align-items-center gap-2"><i className="pi pi-envelope text-400"></i> {contrato.vendedorDetalle.email}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. SECCIÓN FINANCIERA */}
            {esSeparacion ? (
                <div className="border-round-3xl p-4 lg:p-5 mb-5 shadow-4 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #9a3412 100%)' }}>
                    <i className="pi pi-wallet absolute text-white opacity-10" style={{ right: '-40px', top: '-50px', fontSize: '22rem', transform: 'rotate(-8deg)' }}></i>

                    <div className="grid relative z-1 mb-4">
                        <h4 className="col-12 m-0 font-medium font-bold text-orange-50">Separación registrada el {contrato.fechaEmision}</h4>

                        <div className="col-12 md:col-3 flex flex-column justify-content-center">
                            <span className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-2 flex align-items-center gap-2">
                                <i className="pi pi-tag"></i> Precio de Venta
                            </span>
                            <span className="text-3xl lg:text-4xl font-bold">
                                S/ {contrato.finanzas.precioTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="col-12 md:col-3 flex flex-column justify-content-center md:border-left-1 border-white-alpha-20 md:pl-4">
                            <span className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-2 flex align-items-center gap-2">
                                <i className="pi pi-wallet"></i> Financiamiento
                            </span>
                            <span className="text-3xl lg:text-4xl font-bold">
                                S/ {contrato.finanzas.saldoFinanciar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="col-12 md:col-3 flex flex-column justify-content-center md:border-left-1 border-white-alpha-20 md:pl-4">
                            <span className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-2 flex align-items-center gap-2">
                                <i className="pi pi-percentage"></i> Precio de Inicial
                            </span>
                            <span className="text-3xl lg:text-4xl font-bold">
                                S/ {contrato.finanzas.montoInicial.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="col-12 md:col-3 flex flex-column justify-content-center md:border-left-1 border-white-alpha-20 md:pl-4">
                            <span className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-2 flex align-items-center gap-2">
                                <i className="pi pi-calendar"></i> Fecha limite separacion
                            </span>
                            <div className="flex align-items-center gap-3">
                                <span className="text-2xl lg:text-3xl font-bold">
                                    {cuotaInicial?.vencimiento || 'N/A'}
                                </span>
                                <Button icon="pi pi-pencil" rounded text aria-label="Editar" onClick={abrirDialogoEditarInicial} className="p-0 text-white bg-white-alpha-10 hover:bg-white-alpha-20" />
                            </div>
                        </div>

                    </div>

                    <div className="relative z-1 p-4 border-round-2xl border-1 border-white-alpha-10 shadow-inset" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-end mb-3 gap-4">
                            <div>
                                <span className="text-orange-200 text-xs font-bold uppercase tracking-widest block mb-2 flex align-items-center gap-2">
                                    <i className="pi pi-check-circle text-yellow-200"></i> Progreso de Inicial
                                </span>
                                <div className="flex align-items-baseline gap-3">
                                    <span className="text-4xl md:text-5xl font-bold text-yellow-200">
                                        S/ {contrato.finanzas.montoInicialPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xl font-bold text-yellow-200 bg-yellow-500-alpha-20 border-1 border-yellow-500-alpha-30 px-2 py-1 border-round-xl">
                                        {progresoInicial}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="text-orange-100 text-xs font-bold uppercase tracking-widest block mb-1 flex align-items-center justify-content-start sm:justify-content-end gap-2">
                                    <i className="pi pi-exclamation-circle"></i> Falta Inicial
                                </span>
                                <span className="text-2xl lg:text-3xl font-bold text-yellow-200">S/ {contrato.finanzas.faltaPagarInicial.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div className="w-full bg-orange-900 border-round-xl overflow-hidden mt-2 border-1 border-white-alpha-10" style={{ height: '16px' }}>
                            <div className="h-full border-round-xl transition-all transition-duration-1000 relative" style={{ width: `${Math.max(progresoInicial, 2)}%`, background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' }}>
                                <div className="absolute top-0 left-0 w-full h-full bg-white-alpha-20 animation-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-round-3xl p-4 lg:p-5 mb-5 shadow-4 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)' }}>
                    <i className="pi pi-chart-line absolute text-white opacity-10" style={{ right: '-50px', top: '-50px', fontSize: '24rem', transform: 'rotate(-10deg)' }}></i>

                    <div className="grid relative z-1 mb-5">
                        <h4 className="col-12 m-0 font-medium font-bold text-blue-50block">Emitido el {contrato.fechaEmision}</h4>

                        <div className="col-12 md:col-4 flex flex-column justify-content-center">

                            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2 flex align-items-center gap-2">

                                <i className="pi pi-tag"></i> Precio de Venta (Total)
                            </span>
                            <span className="text-4xl lg:text-5xl font-bold">
                                S/ {contrato.finanzas.precioTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>

                        </div>

                        <div className="col-12 md:col-4 flex flex-column justify-content-center md:border-left-1 border-white-alpha-20 md:pl-5">
                            <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-2 flex align-items-center gap-2">
                                <i className="pi pi-wallet"></i> Saldo a Financiar
                            </span>
                            <span className="text-4xl lg:text-5xl font-bold">
                                S/ {contrato.finanzas.saldoFinanciar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="col-12 md:col-4">
                            <div className="detalle-inicial-card border-round-2xl p-3 text-sm border-1 border-white-alpha-20">
                                <div className="font-bold text-blue-900 mb-2 border-bottom-1 border-blue-100 pb-2 uppercase tracking-widest text-xs">Detalle de Cuota Inicial</div>
                                <div className="flex justify-content-between align-items-center mb-2 detalle-inicial-line">
                                    <span className="detalle-inicial-label">Inicial Acordada:</span>
                                    <span className="detalle-inicial-value detalle-inicial-value-total">S/ {contrato.finanzas.montoInicial.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-content-between align-items-center mb-2 detalle-inicial-line">
                                    <span className="detalle-inicial-label">Inicial Pagada:</span>
                                    <span className="detalle-inicial-value detalle-inicial-value-paid">S/ {contrato.finanzas.montoInicialPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-content-between align-items-center pt-2 mt-2 border-top-1 border-blue-100 detalle-inicial-footer">
                                    <span className="detalle-inicial-label detalle-inicial-label-footer">Saldo Inicial:</span>
                                    <span className="detalle-inicial-value detalle-inicial-value-balance">S/ {contrato.finanzas.faltaPagarInicial.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-1 p-4 border-round-2xl border-1 border-white-alpha-10 shadow-inset" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                        <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-end mb-3 gap-4">
                            <div>
                                <span className="text-blue-300 text-xs font-bold uppercase tracking-widest block mb-2 flex align-items-center gap-2">
                                    <i className="pi pi-check-circle text-green-400"></i> Progreso de Pago General
                                </span>
                                <div className="flex align-items-baseline gap-3">
                                    <span className="text-4xl md:text-5xl font-bold text-green-400">
                                        S/ {contrato.finanzas.totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xl font-bold text-green-400 bg-green-500-alpha-20 border-1 border-green-500-alpha-30 px-2 py-1 border-round-xl">
                                        {contrato.finanzas.progresoPago}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="text-orange-200 text-xs font-bold uppercase tracking-widest block mb-1 flex align-items-center justify-content-start sm:justify-content-end gap-2">
                                    <i className="pi pi-exclamation-circle"></i> Deuda Actual
                                </span>
                                <span className="text-2xl lg:text-3xl font-bold text-orange-400">S/ {contrato.finanzas.saldoDeudor.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="w-full bg-bluegray-900 border-round-xl overflow-hidden mt-2 border-1 border-white-alpha-10" style={{ height: '16px' }}>
                            <div className="h-full bg-green-400 border-round-xl transition-all transition-duration-1000 relative" style={{ width: `${Math.max(contrato.finanzas.progresoPago, 2)}%`, background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' }}>
                                <div className="absolute top-0 left-0 w-full h-full bg-white-alpha-20 animation-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {alertaSeparacion && (
                <div className="bg-red-50 border-1 border-red-200 border-round-xl p-3 mb-4 shadow-sm flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
                    <span className="text-red-800 font-bold text-lg">{alertaSeparacion}</span>
                </div>
            )}

            {/* 3. TABS DE PRIMEREACT (Cronograma vs Abonos) */}
            <TabView className="custom-tabview">
                <TabPanel header="Estado de Cuenta" leftIcon="pi pi-wallet mr-2">
                    <div className="grid mt-2" style={{ minHeight: '600px' }}>

                        {/* PANEL IZQUIERDO: CRONOGRAMA */}
                        <div className="col-12 lg:col-8 flex flex-column">
                            <div className="surface-0 shadow-1 border-round-2xl border-1 surface-border flex-1 flex flex-column overflow-hidden">
                                <div className="p-4 border-bottom-1 surface-border bg-white flex justify-content-between align-items-center">
                                    <div>
                                        <h2 className="m-0 text-800 text-xl flex align-items-center gap-2">
                                            <i className="pi pi-calendar text-blue-600"></i> {esSeparacion ? 'Cuota Inicial' : 'Cronograma de Cuotas'}
                                        </h2>
                                        <p className="text-sm text-500 m-0 mt-1">Seleccione una cuota para ver sus pagos a la derecha.</p>
                                    </div>
                                    {!esSeparacion && contrato.finanzas.cuotasAtrasadas > 0 && (
                                        <Tag severity="danger" icon="pi pi-exclamation-triangle" value={`${contrato.finanzas.cuotasAtrasadas} Atrasada(s)`} className="px-3 py-2 text-sm font-bold" />
                                    )}
                                </div>

                                <DataTable
                                    value={cuotasVisibles}
                                    selectionMode="single"
                                    selection={cuotaSeleccionada}
                                    onSelectionChange={(e) => seleccionarCuota(e.value)}
                                    dataKey="id"
                                    scrollable scrollHeight="500px"
                                    className="p-datatable-lg interactive-table flex-1"
                                    rowClassName={(r) => ({ 'bg-red-50': r.estado === 'VENCIDA' })}
                                >
                                    <Column field="numero" header="N°" body={(r) => r.numero === 0 ? '0 (Ini)' : r.numero} headerStyle={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }} style={{ width: '10%', fontWeight: 'bold', textAlign: 'center' }}></Column>
                                    <Column field="vencimiento" header="Vence" body={(r) => <div className="flex align-items-center justify-content-center gap-2"><i className="pi pi-calendar text-400"></i>{r.vencimiento}</div>} headerStyle={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }} style={{ textAlign: 'center' }}></Column>
                                    <Column header="Monto" body={(r) => <span className="font-bold text-800">S/ {r.montoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>} headerStyle={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }} style={{ textAlign: 'center' }}></Column>
                                    <Column header="Deuda" body={(r) => r.montoTotal - r.montoPagado > 0 ? <span className="font-bold text-orange-600">S/ {(r.montoTotal - r.montoPagado).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> : '-'} headerStyle={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }} style={{ textAlign: 'center' }}></Column>
                                    <Column header="Estado" body={estadoCuotaTemplate} headerStyle={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }} style={{ textAlign: 'center' }}></Column>
                                    <Column header="Atraso" body={retrasoTemplate} headerStyle={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }} style={{ textAlign: 'center', width: '10%' }}></Column>
                                    <Column body={() => <i className="pi pi-chevron-right text-400"></i>} style={{ width: '5%', textAlign: 'center' }}></Column>
                                </DataTable>
                            </div>
                        </div>

                        {/* PANEL DERECHO: DETALLES */}
                        <div className="col-12 lg:col-4 flex flex-column">
                            <div className="surface-50 shadow-1 border-round-2xl border-1 surface-border border-top-3 border-top-blue-600 flex-1 flex flex-column overflow-hidden">
                                <div className="p-4 border-bottom-1 surface-border bg-white">
                                    <h3 className="m-0 text-800 text-xl flex align-items-center gap-2">
                                        <i className="pi pi-receipt text-blue-600"></i> Detalle de Abonos
                                    </h3>
                                </div>

                                <div className="p-4 flex-1 overflow-y-auto">
                                    {cuotaPagar ? (
                                        // PANEL DE REGISTRO DE PAGO
                                        <div className="fade-in">
                                            <div className="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
                                                <div>
                                                    <h3 className="m-0 text-lg font-bold flex align-items-center text-800">
                                                        <i className="pi pi-credit-card text-green-600 mr-2 text-xl"></i> Registrar Pago
                                                    </h3>
                                                    <p className="m-0 text-sm text-500 mt-1 font-bold">Cuota N° {cuotaPagar.numero} - Vence: {cuotaPagar.vencimiento}</p>
                                                </div>
                                                <Button icon="pi pi-arrow-left" className="p-button-text p-button-secondary" onClick={() => setCuotaPagar(null)} tooltip="Volver" />
                                            </div>

                                            <div className="bg-blue-50 border-round p-3 mb-4 border-1 border-blue-200">
                                                <div className="flex justify-content-between mb-2">
                                                    <span className="text-lg font-bold text-blue-700">Monto Total de Cuota</span>
                                                    <span className="font-bold text-blue-900 text-lg">S/ {cuotaPagar.montoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-content-between align-items-center">
                                                    <span className="text-lg font-bold text-blue-700">Falta Pagar</span>
                                                    <span className="font-bold text-lg text-blue-700">S/ {(cuotaPagar.montoTotal - cuotaPagar.montoPagado).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>

                                            <div className="field mb-3">
                                                <label className="font-bold text-700 block mb-2">Monto a Abonar (S/)</label>
                                                <InputNumber value={montoAbonar} onValueChange={(e) => setMontoAbonar(e.value)} mode="currency" currency="PEN" className="w-full" />
                                                <small className="text-500">* Se permiten pagos parciales.</small>
                                            </div>

                                            <div className="field mb-3">
                                                <label className="font-medium text-700 block mb-2">Método de Pago</label>
                                                <Dropdown value={metodoPago} options={metodosPago} onChange={(e) => setMetodoPago(e.value)} className="w-full" />
                                            </div>

                                            <div className="field mb-3">
                                                <label className="font-medium text-700 block mb-2">Tipo de Comprobante</label>
                                                <Dropdown
                                                    value={tipoComprobante}
                                                    options={tipoComprobanteOptions}
                                                    onChange={(e) => setTipoComprobante(e.value)}
                                                    className="w-full"
                                                    disabled={esIngresoCaja}
                                                />
                                                {esIngresoCaja && (
                                                    <small className="text-500">Al pagar en caja sin operación, el sistema emite un Recibo de Ingreso.</small>
                                                )}
                                            </div>

                                            {metodoPago === 'EFECTIVO' ? (
                                                <Tag
                                                    severity="warning"
                                                    value="Este pago ingresara a Caja Fisica por validar"
                                                    className="w-full justify-content-center"
                                                />
                                            ) : (
                                                <div className="field mb-3">
                                                    <label className="font-medium text-700 block mb-2">Número de Operación</label>
                                                    <InputText value={numOperacion} onChange={(e) => setNumOperacion(e.target.value)} placeholder="Ej: 0948372" className="w-full" />
                                                </div>
                                            )}

                                            <div className="field mb-3">
                                                <label className="font-medium text-700 block mb-2">Descripción / Observación (Opcional)</label>
                                                <InputTextarea value={descripcionPago} onChange={(e) => setDescripcionPago(e.target.value)} rows={2} autoResize className="w-full" placeholder="Ej: Pago realizado por el hermano..." />
                                            </div>

                                            <div className="field mb-4">
                                                <label className="font-medium text-700 block mb-2">Comprobante / Voucher (Opcional)</label>
                                                <div className="relative flex flex-column align-items-center justify-content-center p-4 border-2 border-dashed border-round-xl surface-border hover:surface-hover transition-colors cursor-pointer bg-blue-50">
                                                    <input
                                                        type="file"
                                                        className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer z-10"
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) => setVoucherFileRegistro(e.target.files[0])}
                                                    />
                                                    {voucherFileRegistro ? (
                                                        <div className="text-center flex flex-column align-items-center">
                                                            <i className="pi pi-file-check text-3xl text-green-500 mb-2"></i>
                                                            <span className="font-bold text-700 text-sm">{voucherFileRegistro.name}</span>
                                                            <span className="text-xs text-500">{(voucherFileRegistro.size / (1024 * 1024)).toFixed(2)} MB</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center flex flex-column align-items-center">
                                                            <i className="pi pi-cloud-upload text-2xl text-blue-500 mb-2"></i>
                                                            <span className="font-bold text-700 text-sm">Haz clic o arrastra</span>
                                                            <span className="text-xs text-500 mt-1">JPG, PNG, PDF</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-content-end">
                                                <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setCuotaPagar(null)} />
                                                <Button label="Registrar Pago" icon="pi pi-check" className="btn-primary-custom shadow-2 border-round-xl font-bold" loading={registrandoPago} onClick={registrarPago} />
                                            </div>
                                        </div>
                                    ) : !cuotaSeleccionada ? (
                                        <div className="flex flex-column align-items-center justify-content-center h-full text-500 text-center py-6">
                                            <div className="surface-200 border-circle flex align-items-center justify-content-center mb-3" style={{ width: '5rem', height: '5rem' }}>
                                                <i className="pi pi-search text-3xl text-400"></i>
                                            </div>
                                            <span className="font-bold text-xl mb-2 text-700">Explore los Pagos</span>
                                            <span className="text-sm px-3 line-height-3">Haga clic en una fila del cronograma para ver los vouchers y métodos de pago.</span>
                                        </div>
                                    ) : (
                                        <div className="fade-in">
                                            <div className="bg-blue-50 border-1 border-blue-100 border-round-2xl p-4 text-center shadow-sm mb-4">
                                                <span className="font-bold text-blue-600 uppercase tracking-widest">Cuota N° {cuotaSeleccionada.numero === 0 ? '0 (Inicial)' : cuotaSeleccionada.numero}</span>
                                                <div className="text-5xl font-bold text-blue-900 mt-2 mb-3">S/ {cuotaSeleccionada.montoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                                <div className="flex justify-content-center align-items-center gap-3">
                                                    <span className="flex align-items-center font-bold gap-2 text-lg"><i className="pi pi-calendar text-blue-500"></i> {cuotaSeleccionada.vencimiento}</span>
                                                    <span className="text-300">|</span>
                                                    {estadoCuotaTemplate(cuotaSeleccionada)}
                                                </div>
                                                <div className="flex justify-content-center gap-3 mt-3">
                                                    {(cuotaSeleccionada.montoTotal - cuotaSeleccionada.montoPagado) > 0 && (
                                                        <Button
                                                            label="Registrar Pago"
                                                            icon="pi pi-credit-card"
                                                            className="btn-primary-custom shadow-2 border-round-xl font-bold w-full max-w-15rem"
                                                            onClick={() => abrirPanelPago(cuotaSeleccionada)}
                                                        />
                                                    )}
                                                    {(cuotaSeleccionada.numero === 0 || cuotaSeleccionada.tipo === 'INICIAL' || cuotaSeleccionada.tipoCuota === 'INICIAL') && esSeparacion && (
                                                        <Button
                                                            label="Editar Inicial"
                                                            icon="pi pi-pencil"
                                                            className="p-button-warning shadow-2 border-round-xl font-bold w-full max-w-15rem text-white"
                                                            onClick={abrirDialogoEditarInicial}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-bold uppercase tracking-widest mb-3 pl-2 m-0">Historial de Recibos</h3>

                                            {/* INDICADOR DE PAGOS PENDIENTES */}
                                            {cuotaSeleccionada.pagoPendiente && (
                                                <div className="bg-yellow-50 border-1 border-yellow-200 border-round-2xl p-3 mb-3 shadow-sm flex justify-content-between align-items-center">
                                                    <div className="flex align-items-center gap-2">
                                                        <i className="pi pi-exclamation-circle text-yellow-600 text-lg"></i>
                                                        <div className="flex flex-column">
                                                            <span className="text-lg font-bold text-yellow-700">Pago Pendiente de Validación</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        label="Procesar"
                                                        icon="pi pi-cog"
                                                        className="p-button-sm p-button-warning text-white"
                                                        onClick={() => abrirDialogoProcesar(cuotaSeleccionada.pagoPendiente)}
                                                    />
                                                </div>
                                            )}

                                            {cuotaSeleccionada.pagos && cuotaSeleccionada.pagos.length > 0 ? (
                                                <div className="flex flex-column gap-3">
                                                    {cuotaSeleccionada.pagos.map((pago, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`surface-0 border-1 surface-border border-round-2xl p-3 shadow-sm transition-colors ${pago.fotoVoucherUrl ? 'hover:border-blue-400 cursor-pointer' : ''}`}
                                                            onClick={() => pago.fotoVoucherUrl && viewVoucher(pago.fotoVoucherUrl)}
                                                        >
                                                            <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 surface-border pb-2">
                                                                <div className="flex align-items-center gap-2">
                                                                    <i className={`pi ${pago.fotoVoucherUrl ? 'pi-image text-blue-500' : 'pi-file text-400'} text-lg`}></i>
                                                                    <div className="flex flex-column">
                                                                        <span className="font-bold text-700">{pago.numeroComprobante || pago.id}</span>
                                                                        {pago.numeroOperacion && <small className="text-500">Operación: {pago.numeroOperacion}</small>}
                                                                        {pago.descripcion && <small className="text-500">Nota: {pago.descripcion}</small>}
                                                                    </div>
                                                                </div>
                                                                <div className="flex align-items-center gap-2">
                                                                    {pago.numeroComprobante && (
                                                                        <Button
                                                                            icon="pi pi-file-pdf"
                                                                            className="p-button-rounded p-button-danger p-button-text"
                                                                            tooltip={`Descargar ${getEtiquetaComprobante(pago.tipoComprobante)}`}
                                                                            onClick={(e) => { e.stopPropagation(); handleDescargarComprobante(pago); }}
                                                                        />
                                                                    )}
                                                                    <span className="text-x font-bold text-600 surface-100 px-3 py-2 border-round-md">{pago.fechaPago}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-content-between align-items-end">
                                                                <div>
                                                                    <span className="text-m text-500 mb-1 block">Método de pago</span>
                                                                    <span className="text-x font-bold text-700 flex align-items-center gap-2"><i className="pi pi-wallet text-blue-500"></i> {pago.metodoPago}</span>
                                                                    {(pago.estado || '').toUpperCase() === 'POR_VALIDAR' && (
                                                                        <Tag severity="warning" value="Pendiente de arqueo" className="mt-2" />
                                                                    )}
                                                                </div>
                                                                <span className="font-bold text-green-600 text-xl">S/ {pago.montoAbonado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div className="mt-4 bg-green-50 border-1 border-green-200 border-round-2xl p-3 flex justify-content-between align-items-center shadow-sm">
                                                        <span className="font-bold text-green-800">Total Pagado:</span>
                                                        <span className="text-2xl font-bold text-green-700">S/ {cuotaSeleccionada.montoPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed surface-border border-round-2xl p-5 text-center bg-white mt-3">
                                                    <i className="pi pi-exclamation-circle text-4xl text-300 mb-3"></i>
                                                    <p className="font-bold text-lg text-600 m-0">No hay abonos</p>
                                                    <p className="text-sm text-500 mt-2 mb-0">Esta cuota aún no registra ningún pago en el sistema.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Historial de Modificaciones" leftIcon="pi pi-history mr-2">
                    <div className="surface-0 shadow-1 border-round-2xl border-1 surface-border p-4 mt-2">
                        <div className="flex justify-content-between align-items-center mb-4">
                            <h3 className="m-0 flex align-items-center text-800 text-xl"><i className="pi pi-history mr-2 text-primary"></i> Registro Histórico</h3>
                            <Button label="Vista Previa (Borrador)" icon="pi pi-eye" className="p-button-outlined p-button-secondary font-bold border-round-xl" onClick={handleVistaPrevia} />
                        </div>
                        <DataTable value={historialesOrdenados} emptyMessage="No hay historial registrado." className="p-datatable-sm" paginator rows={10}>
                            <Column header="N°" body={(_, options) => options.rowIndex + 1} style={{ width: '5%' }}></Column>
                            <Column field="tipoRegistro" header="Tipo" body={(r) => r.tipoRegistro ? r.tipoRegistro.replace(/_/g, ' ') : '-'} style={{ width: '12%' }}></Column>
                            <Column field="descripcion" header="Descripción del Cambio" style={{ width: '35%' }}></Column>
                            <Column field="observacion" header="Nota Adicional" body={(r) => r.observacion || '-'} style={{ width: '25%' }}></Column>
                            <Column field="fechaRegistro" header="Fecha" body={(r) => (r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleDateString('es-PE') : '')} style={{ width: '15%' }}></Column>
                            <Column body={(r) => (
                                <div className="flex gap-2 justify-content-center">
                                    {r.tipoRegistro === 'INGRESO_CAJA' && (
                                        <Button
                                            icon="pi pi-upload"
                                            className="p-button-rounded p-button-warning p-button-text"
                                            title="Subir Recibo de Ingreso"
                                            onClick={() => abrirDialogoReciboIngreso(r)}
                                        />
                                    )}
                                    {r.rutaDocumentoPdf && (
                                        <Button icon="pi pi-file-pdf" className="p-button-rounded p-button-danger p-button-text" title="Ver PDF Histórico" onClick={() => verHistorialPdf(r)} />
                                    )}
                                </div>
                            )} style={{ width: '8%', textAlign: 'center' }}></Column>
                        </DataTable>
                    </div>
                </TabPanel>

            </TabView>
        </div>
    );
};

export default DetalleContrato;