import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { SelectButton } from 'primereact/selectbutton';
import { TabView, TabPanel } from 'primereact/tabview';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ClienteService } from '../../service/ClienteService';
import { VendedorService } from '../../service/VendedorService';
import { LoteService } from '../../service/LoteService';
import { ReniecService } from '../../service/ReniecService';
import { ContratoService } from '../../service/ContratoService';
import { CotizacionService } from '../../service/CotizacionService';
import { UbigeoService } from '../../service/UbigeoService';
import { InteresadoService } from '../../service/InteresadoService';

import './Contrato.css';
import './Cotizacion.css';

const Cotizacion = () => {
    const navigate = useNavigate();
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    // ==========================================
    // ESTADOS DEL FORMULARIO
    // ==========================================
    const [dni, setDni] = useState('');
    const [cliente, setCliente] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    
    // Selectores
    const [lotes, setLotes] = useState([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [vendedores, setVendedores] = useState([]);
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
    const [pendingLoteId, setPendingLoteId] = useState(null);
    const [pendingVendedorId, setPendingVendedorId] = useState(null);

    // Parámetros de la Cuota 0 (Inicial / Separación)
    const [lotePrecio, setLotePrecio] = useState(15500);
    const [inicialAcordada, setInicialAcordada] = useState(500);
    const [abonoReal, setAbonoReal] = useState(100);
    const [fechaLimiteInicial, setFechaLimiteInicial] = useState(new Date(new Date().setDate(new Date().getDate() + 15)));
    const [fechaRegistro, setFechaRegistro] = useState(new Date());
    
    // Parámetros del Cronograma (1 a N)
    const [cuotas, setCuotas] = useState(36);
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    
    // Parámetros Flexibles (Cuotas Especiales)
    const [isFlexible, setIsFlexible] = useState(false);
    const [cuotasEspeciales, setCuotasEspeciales] = useState(3);
    const [montoEspecial, setMontoEspecial] = useState(1000);

    // Tipo de Inicial: CERO | PARCIAL | TOTAL
    const [tipoInicial, setTipoInicial] = useState('PARCIAL');

    // Observaciones manuales
    const [observacion, setObservacion] = useState('');

    // Tab activo: 0 = Cotización, 1 = Contrato
    const [tabIndex, setTabIndex] = useState(0);

    // Resultados y UI
    const [cronograma, setCronograma] = useState([]);
    const [descripcionGenerada, setDescripcionGenerada] = useState('');

    // Cálculo reactivo según TipoInicial
    const montoInicialEfectivo = tipoInicial === 'CERO' ? 0 : inicialAcordada;
    const abonoEfectivo = tipoInicial === 'TOTAL' ? inicialAcordada
        : tipoInicial === 'CERO' ? 0
        : abonoReal;
    const esSeparacion = tipoInicial === 'PARCIAL' && abonoReal < inicialAcordada;
    const faltaPagarInicial = montoInicialEfectivo - abonoEfectivo;
    const saldoAFinanciar = lotePrecio - montoInicialEfectivo;

    // ==========================================
    // EFECTOS INICIALES
    // ==========================================
    useEffect(() => {
        cargarDatosBase();
    }, []);

    const lotesOptions = useMemo(() =>
        lotes.map((item) => ({
            ...item,
            descripcion: `${item?.manzana?.etapa?.urbanizacion?.nombre || ''} / ${item?.manzana?.etapa?.nombre || ''} / Mz ${item?.manzana?.nombre || ''} - Lote ${item?.numero || ''}`.trim()
        })),
        [lotes]
    );

    const vendedoresOptions = useMemo(() =>
        vendedores.map((item) => ({
            ...item,
            nombreCompleto: `${item.nombres || ''} ${item.apellidos || ''}`.trim()
        })),
        [vendedores]
    );

    useEffect(() => {
        if (pendingLoteId && lotesOptions.length > 0) {
            const encontrado = lotesOptions.find((item) => item?.id === pendingLoteId);
            if (encontrado) {
                setLoteSeleccionado(encontrado);
                if (encontrado.precioVenta != null) {
                    setLotePrecio(encontrado.precioVenta);
                }
                setPendingLoteId(null);
            }
        }
        if (pendingVendedorId && vendedoresOptions.length > 0) {
            const encontrado = vendedoresOptions.find((item) => item?.id === pendingVendedorId);
            if (encontrado) {
                setVendedorSeleccionado(encontrado);
                setPendingVendedorId(null);
            }
        }
    }, [pendingLoteId, pendingVendedorId, lotesOptions, vendedoresOptions]);

    const mapTextOptions = (items) => (items || []).map((item) => ({ label: item, value: item }));

    const mapDistritoOptions = (items) => (items || []).map((item) => {
        const distrito = item?.distrito || item?.nombreDistrito || item?.name || '';
        const ubigeo = item?.ubigeo || item?.idUbigeo || item?.codigoUbigeo || '';
        return { label: distrito, value: distrito, ubigeo };
    });

    const cargarDepartamentos = async () => {
        try {
            const response = await UbigeoService.listarDepartamentos(axiosInstance);
            setDepartamentos(mapTextOptions(response));
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar departamentos.' });
        }
    };

    const cargarProvincias = async (departamento) => {
        if (!departamento) {
            setProvincias([]);
            setDistritos([]);
            return;
        }

        try {
            const response = await UbigeoService.listarProvincias(departamento, axiosInstance);
            setProvincias(mapTextOptions(response));
        } catch (error) {
            setProvincias([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar provincias.' });
        }
    };

    const cargarDistritos = async (departamento, provincia) => {
        if (!departamento || !provincia) {
            setDistritos([]);
            return;
        }

        try {
            const response = await UbigeoService.listarDistritos(departamento, provincia, axiosInstance);
            setDistritos(mapDistritoOptions(response));
        } catch (error) {
            setDistritos([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar distritos.' });
        }
    };

    const onDepartamentoChange = async (value) => {
        setCliente((prev) => ({
            ...(prev || {}),
            departamento: value,
            provincia: '',
            distrito: '',
            ubigeo: ''
        }));
        await cargarProvincias(value);
        setDistritos([]);
    };

    const onProvinciaChange = async (value) => {
        setCliente((prev) => ({
            ...(prev || {}),
            provincia: value,
            distrito: '',
            ubigeo: ''
        }));
        await cargarDistritos(cliente?.departamento, value);
    };

    const onDistritoChange = (value) => {
        const distritoSelected = distritos.find((item) => item.value === value);
        setCliente((prev) => ({
            ...(prev || {}),
            distrito: value,
            ubigeo: distritoSelected?.ubigeo || ''
        }));
    };

    const cargarDatosBase = async () => {
        try {
            const [resClientes, resLotes, resVendedores] = await Promise.all([
                ClienteService.listar(axiosInstance),
                LoteService.listar(axiosInstance),
                VendedorService.listar(axiosInstance)
            ]);
            setClientes(resClientes || []);
            setLotes(resLotes || []);
            setVendedores(resVendedores || []);
            await cargarDepartamentos();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar datos base.' });
        }
    };

    const onLoteChange = (e) => {
        setLoteSeleccionado(e.value);
        if (e.value && e.value.precioVenta !== undefined && e.value.precioVenta !== null) {
            setLotePrecio(e.value.precioVenta);
        }
    };

    const buscarCliente = async () => {
        const documento = (cliente?.numeroDocumento || dni || '').trim();
        if (documento.length !== 8) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'DNI inválido.' });
            return;
        }

        try {
            const listadoClientes = Array.isArray(clientes) ? clientes : [];
            const clienteExistente = listadoClientes.find((item) => item.numeroDocumento === documento);

            const cotizaciones = await CotizacionService.buscarPorDni(documento, axiosInstance);
            const listaCotizaciones = Array.isArray(cotizaciones) ? cotizaciones : [];

            if (listaCotizaciones.length > 0) {
                const sorted = [...listaCotizaciones].sort((a, b) => {
                    const aDate = new Date(a.fechaCotizacion || a.createdAt || 0).getTime();
                    const bDate = new Date(b.fechaCotizacion || b.createdAt || 0).getTime();
                    return bDate - aDate;
                });
                const seleccionada = sorted[0];
                const interesado = seleccionada.interesado || {};
                
                const dep = interesado.departamento || clienteExistente?.departamento || '';
                const prov = interesado.provincia || clienteExistente?.provincia || '';
                const dist = interesado.distrito || clienteExistente?.distrito || '';
                const ubig = interesado.ubigeo || clienteExistente?.ubigeo || '';

                setCliente((prev) => ({
                    ...(prev || {}),
                    id: clienteExistente?.id || undefined, 
                    interesadoId: interesado.id || undefined,
                    numeroDocumento: interesado.numeroDocumento || documento,
                    tipoDocumento: interesado.tipoDocumento || clienteExistente?.tipoDocumento || 'DNI',
                    nombres: interesado.nombres || clienteExistente?.nombres || '',
                    apellidos: interesado.apellidos || clienteExistente?.apellidos || '',
                    telefono: interesado.telefono || clienteExistente?.telefono || '',
                    email: interesado.email || clienteExistente?.email || '',
                    departamento: dep,
                    provincia: prov,
                    distrito: dist,
                    ubigeo: ubig,
                    direccion: clienteExistente?.direccion || ''
                }));
                setDni(documento);

                if (dep) {
                    await cargarProvincias(dep);
                    if (prov) {
                        await cargarDistritos(dep, prov);
                    }
                }

                if (seleccionada.vendedor?.id) {
                    const vendedorEncontrado = vendedoresOptions.find((item) => item?.id === seleccionada.vendedor.id);
                    if (vendedorEncontrado) {
                        setVendedorSeleccionado(vendedorEncontrado);
                    } else {
                        setPendingVendedorId(seleccionada.vendedor.id);
                    }
                }

                let precioLoteCargado = lotePrecio;
                if (seleccionada.lote?.id) {
                    const loteEncontrado = lotesOptions.find((item) => item?.id === seleccionada.lote.id);
                    if (loteEncontrado) {
                        setLoteSeleccionado(loteEncontrado);
                        if (loteEncontrado.precioVenta != null) {
                            setLotePrecio(loteEncontrado.precioVenta);
                            precioLoteCargado = loteEncontrado.precioVenta;
                        }
                    } else {
                        setPendingLoteId(seleccionada.lote.id);
                        if (seleccionada.precioTotal != null) {
                            setLotePrecio(seleccionada.precioTotal);
                            precioLoteCargado = seleccionada.precioTotal;
                        }
                    }
                }

                const inicialCargada = seleccionada.montoInicialAcordado ?? 0;
                const cuotasCargadas = seleccionada.cantidadCuotas || 36;
                const tipoCargado = seleccionada.tipoInicial || 'PARCIAL';
                const flexCargado = !!(seleccionada.cuotasFlexibles || seleccionada.cuotasEspeciales || seleccionada.montoCuotaEspecial);
                const espCargadas = seleccionada.cuotasEspeciales || 0;
                const mtoEspCargado = seleccionada.montoCuotaEspecial || 0;

                setInicialAcordada(inicialCargada);
                setCuotas(cuotasCargadas);
                setTipoInicial(tipoCargado);
                setIsFlexible(flexCargado);
                setCuotasEspeciales(espCargadas);
                setMontoEspecial(mtoEspCargado);

                if (seleccionada.fechaInicioPago) {
                    setFechaInicio(new Date(seleccionada.fechaInicioPago));
                }

                setTimeout(() => {
                    simularConDatos(precioLoteCargado, inicialCargada, cuotasCargadas, tipoCargado, flexCargado, espCargadas, mtoEspCargado);
                }, 300);

                toast.current?.show({ severity: 'success', summary: 'Cotización encontrada', detail: 'Datos cargados. Puede modificar y guardar como cotización o generar contrato.' });
                return;
            }

            if (clienteExistente) {
                setCliente(clienteExistente);
                setDni(clienteExistente.numeroDocumento || documento);
                if (clienteExistente.departamento) {
                    await cargarProvincias(clienteExistente.departamento);
                }
                if (clienteExistente.provincia) {
                    await cargarDistritos(clienteExistente.departamento, clienteExistente.provincia);
                }
                toast.current?.show({ severity: 'success', summary: 'Encontrado', detail: 'Cliente cargado desde el sistema.' });
                return;
            }

            const response = await ReniecService.consultarDNI(documento, axiosInstance);
            if (!response?.success) {
                const message = response?.message || 'No se encontraron datos para el DNI.';
                toast.current?.show({ severity: 'warn', summary: 'RENIEC', detail: message });
                return;
            }

            const data = response.data || {};
            const nombres = data.nombres || data.nombre || '';
            const apellidoPaterno = data.apellidoPaterno || data.apellido_paterno || '';
            const apellidoMaterno = data.apellidoMaterno || data.apellido_materno || '';
            const apellidos = data.apellidos || `${apellidoPaterno} ${apellidoMaterno}`.trim();
            setCliente({ id: undefined, numeroDocumento: documento, tipoDocumento: 'DNI', nombres, apellidos, email: '' });
            setDni(documento);
            toast.current?.show({ severity: 'success', summary: 'Encontrado', detail: 'Cliente cargado desde RENIEC.' });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error en la búsqueda.' });
        }
    };

    // ==========================================
    // SIMULADOR MATEMÁTICO (Incluye Cuota 0)
    // ==========================================

    const simularConDatos = (pPrecio, pInicial, pCuotas, pTipo, pFlex, pEsp, pMtoEsp) => {
        const iniEf = pTipo === 'CERO' ? 0 : pInicial;
        const saldo = pPrecio - iniEf;
        if (saldo <= 0 || pCuotas <= 0) return;

        let nc = [];
        const abonoEf = pTipo === 'TOTAL' ? pInicial : pTipo === 'CERO' ? 0 : abonoReal;
        const esSep = pTipo === 'PARCIAL' && abonoReal < pInicial;
        const falta = iniEf - abonoEf;

        if (pTipo !== 'CERO') {
            nc.push({
                numero: 0, tipoCuota: 'INICIAL', montoTotal: iniEf,
                montoPagado: abonoEf, saldoPendiente: Math.max(falta, 0),
                fecha: fechaLimiteInicial.toISOString().split('T')[0],
                estado: esSep ? 'PAGADO_PARCIAL' : 'PAGADO_TOTAL'
            });
        }

        let eCant = pFlex ? pEsp : 0;
        let eMto = pFlex ? pMtoEsp : 0;
        let nCant = pCuotas;
        let nSaldo = saldo;
        if (pFlex) { nSaldo = saldo - (eCant * eMto); nCant = pCuotas - eCant; }
        let base = nCant > 0 ? nSaldo / nCant : 0;
        let bd = new Date(fechaInicio);
        let dia = bd.getDate();

        for (let i = 0; i < pCuotas; i++) {
            let m = i < eCant ? eMto : base;
            if (i === pCuotas - 1 && nCant > 0) m = saldo - (eCant * eMto) - (Math.round(base * 100) / 100) * (nCant - 1);
            let dt = new Date(bd.getFullYear(), bd.getMonth() + i, 1);
            dt.setDate(Math.min(dia, new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate()));
            nc.push({ numero: i + 1, tipoCuota: 'MENSUAL', montoTotal: Math.round(m * 100) / 100, montoPagado: 0, saldoPendiente: Math.round(m * 100) / 100, fecha: dt.toISOString().split('T')[0], estado: 'PENDIENTE' });
        }

        setCronograma(nc);
        let desc = pTipo === 'CERO' ? 'Sin cuota inicial. ' : `Cuota Inicial de S/ ${iniEf}. `;
        desc += pFlex && eCant > 0
            ? `Fraccionado en ${eCant} cuotas de S/ ${eMto} y ${nCant} cuotas con el saldo restante.`
            : `Fraccionado en ${pCuotas} cuotas regulares.`;
        setDescripcionGenerada(desc);
    };

    const simular = () => {
        if (saldoAFinanciar <= 0 || cuotas <= 0) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Revise el saldo y cuotas.' });
            return;
        }
        simularConDatos(lotePrecio, inicialAcordada, cuotas, tipoInicial, isFlexible, cuotasEspeciales, montoEspecial);
    };

    // ==========================================
    // GUARDADO OFICIAL
    // ==========================================
    const guardarContrato = async () => {
        if (!loteSeleccionado?.id || !vendedorSeleccionado?.id || cronograma.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Faltan datos', detail: 'Asegúrese de seleccionar el lote, vendedor y generar la simulación.' });
            return;
        }

        try {
            let idClienteFinal = cliente?.id;

            if (!idClienteFinal) {
                if (!cliente || !cliente.nombres) {
                    toast.current.show({ severity: 'error', summary: 'Falta Cliente', detail: 'Debe buscar al prospecto por DNI primero.' });
                    return;
                }

                const nuevoClientePayload = {
                    tipoDocumento: 'DNI',
                    numeroDocumento: dni,
                    nombres: cliente.nombres,
                    apellidos: cliente.apellidos || '',
                    telefono: cliente.telefono || '',
                    email: cliente.email || '',
                    departamento: cliente.departamento || '',
                    provincia: cliente.provincia || '',
                    distrito: cliente.distrito || '',
                    ubigeo: cliente.ubigeo || ''
                };
                
                const resCliente = await ClienteService.crear(nuevoClientePayload, axiosInstance);
                idClienteFinal = resCliente?.data?.id || resCliente?.id;
            }

            if (!idClienteFinal) {
                toast.current.show({ severity: 'error', summary: 'Error de ID', detail: 'No se pudo obtener ni generar el ID del cliente.' });
                return;
            }

            const contratoPayload = {
                loteId: loteSeleccionado.id,
                clienteId: idClienteFinal,
                vendedorId: vendedorSeleccionado.id,

                precioTotal: lotePrecio,

                montoInicial: montoInicialEfectivo,
                montoAbonadoIncial: abonoEfectivo,
                saldoFinanciar: saldoAFinanciar,

                tipoInicial: tipoInicial,

                cantidadCuotas: cuotas,
                fechaInicioCronograma: fechaInicio.toISOString().split('T')[0],
                cuotasFlexibles: isFlexible,
                cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: isFlexible ? montoEspecial : 0,

                fechaLimiteInicial: tipoInicial !== 'CERO' ? fechaLimiteInicial.toISOString().split('T')[0] : null,

                observacion: observacion || '',
                fechaRegistro: new Date(fechaRegistro.getTime() - (fechaRegistro.getTimezoneOffset() * 60000)).toISOString().slice(0, 19)
            };

            const response = await ContratoService.crear(contratoPayload, axiosInstance);

            toast.current.show({ severity: 'success', summary: '¡Éxito!', detail: 'Contrato emitido y guardado correctamente.' });
            
            setTimeout(() => {
                const idGenerado = response?.id || response?.data?.id;
                if (idGenerado) {
                    navigate(`/detalle_contrato/${idGenerado}`);
                }
            }, 1000);
            
            setCronograma([]);
            setObservacion('');
            
        } catch (error) {
            console.error('Error completo en React:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar. Revisa la consola para más detalles.' });
        }
    };

    const guardarCotizacion = async () => {
        if (!loteSeleccionado?.id || !vendedorSeleccionado?.id || cronograma.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Faltan datos', detail: 'Seleccione lote, vendedor y genere la simulación.' });
            return;
        }

        try {
            let idInteresadoFinal = cliente?.interesadoId;

            if (!idInteresadoFinal) {
                if (!cliente || !cliente.nombres) {
                    toast.current.show({ severity: 'error', summary: 'Falta Prospecto', detail: 'Debe buscar al prospecto por DNI primero.' });
                    return;
                }

                const nuevoInteresado = {
                    tipoDocumento: cliente.tipoDocumento || 'DNI',
                    numeroDocumento: dni,
                    nombres: cliente.nombres,
                    apellidos: cliente.apellidos || '',
                    telefono: cliente.telefono || '',
                    email: cliente.email || '',
                    departamento: cliente.departamento || '',
                    provincia: cliente.provincia || '',
                    distrito: cliente.distrito || '',
                    ubigeo: cliente.ubigeo || ''
                };

                const resInt = await InteresadoService.crear(nuevoInteresado, axiosInstance);
                idInteresadoFinal = resInt?.data?.id || resInt?.id;
            }

            if (!idInteresadoFinal) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener el ID del interesado.' });
                return;
            }

            const cotizacionPayload = {
                loteId: loteSeleccionado.id,
                interesadoId: idInteresadoFinal,
                vendedorId: vendedorSeleccionado.id,
                tipoInicial: tipoInicial,
                precioTotal: lotePrecio,
                montoInicialAcordado: tipoInicial === 'CERO' ? 0 : inicialAcordada,
                cantidadCuotas: cuotas,
                fechaInicioPago: fechaInicio.toISOString().split('T')[0],
                cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: isFlexible ? montoEspecial : 0,
                cuotasFlexibles: isFlexible,
                diasValidez: 7
            };

            await CotizacionService.crear(cotizacionPayload, axiosInstance);

            toast.current.show({ severity: 'success', summary: '¡Éxito!', detail: 'Cotización guardada correctamente.' });
            setCronograma([]);
            setObservacion('');
        } catch (error) {
            console.error('Error al guardar cotización:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la cotización.' });
        }
    };

    // ==========================================
    // TEMPLATES DE TABLA
    // ==========================================
    const estadoTemplate = (rowData) => {
        if (rowData.numero === 0) {
            return rowData.estado === 'SEPARACIÓN' 
                ? <Tag severity="warning" value="FALTA INICIAL" />
                : <Tag severity="success" value="PAGADO" />;
        }
        return <span className="status-badge proyectado">Proyectado</span>;
    };

    const montoTemplate = (rowData) => {
        if (rowData.numero === 0) {
            return (
                <div className="flex flex-column text-right">
                    <span className="font-bold text-blue-700">S/ {rowData.montoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    {rowData.saldoPendiente > 0 && (
                        <span className="text-xs text-orange-600">Debe: S/ {rowData.saldoPendiente.toLocaleString()}</span>
                    )}
                </div>
            );
        }
        return <span className="font-bold">S/ {rowData.montoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>;
    };

    const renderContenido = (isContrato) => (
        <div className="grid mt-3">
            {/* PANEL IZQUIERDO: Configuración */}
            <div className="col-12 xl:col-5">
                {/* 1. Entidades */}
                <div className="custom-card mb-4">
                    <div className="card-header">
                        <i className={`pi ${isContrato ? 'pi-users' : 'pi-user'} text-primary`}></i>
                        <span className="font-bold text-lg ml-2">{isContrato ? 'Buscar Interesado con Cotización' : 'Datos del Prospecto'}</span>
                    </div>
                    <div className="p-fluid mt-3">
                        <div className="field">
                            <label className="font-medium">Documento</label>
                            <div className="p-inputgroup">
                                <InputText
                                    value={cliente?.numeroDocumento || dni}
                                    onChange={(e) => {
                                        setDni(e.target.value);
                                        setCliente((prev) => ({
                                            ...(prev || {}),
                                            numeroDocumento: e.target.value
                                        }));
                                    }}
                                    placeholder="Ej: 72384732"
                                />
                                <Button icon="pi pi-search" onClick={buscarCliente} className="btn-primary-custom" />
                            </div>
                        </div>

                        <div className="p-fluid grid">
                            <div className="field col-12 md:col-6">
                                <label className="font-medium">Tipo Documento</label>
                                <Dropdown
                                    value={cliente?.tipoDocumento || 'DNI'}
                                    options={[
                                        { label: 'DNI', value: 'DNI' },
                                        { label: 'Carnet de Extranjeria', value: 'CE' },
                                        { label: 'RUC', value: 'RUC' }
                                    ]}
                                    onChange={(e) => setCliente((prev) => ({
                                        ...(prev || {}),
                                        tipoDocumento: e.value
                                    }))}
                                    placeholder="Seleccione tipo"
                                />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-medium">Nombres</label>
                                <InputText
                                    value={cliente?.nombres || ''}
                                    onChange={(e) => setCliente((prev) => ({
                                        ...(prev || {}),
                                        nombres: e.target.value
                                    }))}
                                    placeholder="Ingrese nombres"
                                />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-medium">Apellidos</label>
                                <InputText
                                    value={cliente?.apellidos || ''}
                                    onChange={(e) => setCliente((prev) => ({
                                        ...(prev || {}),
                                        apellidos: e.target.value
                                    }))}
                                    placeholder="Ingrese apellidos"
                                />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-medium">Teléfono</label>
                                <InputText
                                    value={cliente?.telefono || ''}
                                    onChange={(e) => setCliente((prev) => ({
                                        ...(prev || {}),
                                        telefono: e.target.value
                                    }))}
                                    placeholder="Ingrese teléfono"
                                />
                            </div>
                            <div className="field col-12">
                                <label className="font-medium">Correo</label>
                                <InputText
                                    value={cliente?.email || ''}
                                    onChange={(e) => setCliente((prev) => ({
                                        ...(prev || {}),
                                        email: e.target.value
                                    }))}
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                            {/* Ubicación - solo visible en tab Contrato */}
                            {isContrato && (<>
                            <div className="field col-12 md:col-4">
                                <label className="font-medium">Departamento</label>
                                <Dropdown value={cliente?.departamento || ''} options={departamentos} onChange={(e) => onDepartamentoChange(e.value)} placeholder="Seleccione" />
                            </div>
                            <div className="field col-12 md:col-4">
                                <label className="font-medium">Provincia</label>
                                <Dropdown value={cliente?.provincia || ''} options={provincias} onChange={(e) => onProvinciaChange(e.value)} placeholder="Seleccione" disabled={!cliente?.departamento} />
                            </div>
                            <div className="field col-12 md:col-4">
                                <label className="font-medium">Distrito</label>
                                <Dropdown value={cliente?.distrito || ''} options={distritos} onChange={(e) => onDistritoChange(e.value)} placeholder="Seleccione" disabled={!cliente?.provincia} />
                            </div>
                            <div className="field col-12">
                                <label className="font-medium">Dirección</label>
                                <InputText value={cliente?.direccion || ''} onChange={(e) => setCliente((prev) => ({...(prev || {}), direccion: e.target.value}))} placeholder="Av. / Jr. / Calle" />
                            </div>
                            </>)}
                        </div>
                        <div className="field">
                            <label className="font-medium">Vendedor Asignado</label>
                            <Dropdown value={vendedorSeleccionado} options={vendedoresOptions} onChange={(e) => setVendedorSeleccionado(e.value)} optionLabel="nombreCompleto" placeholder="Seleccione Vendedor" />
                        </div>
                        <div className="field">
                            <label className="font-medium">Lote a Vender</label>
                            <Dropdown value={loteSeleccionado} options={lotesOptions} onChange={onLoteChange} optionLabel="descripcion" placeholder="Seleccione un Lote" />
                        </div>
                        <div className="field mb-0">
                            <label className="font-medium">{isContrato ? 'Fecha de Contrato' : 'Fecha de Cotización'}</label>
                            <Calendar value={fechaRegistro} onChange={(e) => setFechaRegistro(e.value)} showIcon showTime hourFormat="24" dateFormat="dd/mm/yy" />
                        </div>
                    </div>
                </div>

                {/* 2. La Cuota 0 (Inicial y Separación) */}
                <div className={`custom-card mb-4 ${esSeparacion ? 'border-warning' : ''}`}>
                    <div className="card-header justify-content-between">
                        <div className="flex align-items-center">
                            <i className="pi pi-wallet text-primary"></i>
                            <span className="font-bold text-lg ml-2">Cuota 0 — Inicial</span>
                        </div>
                        {tipoInicial === 'CERO' && <Tag severity="info" value="SIN INICIAL" icon="pi pi-info-circle" />}
                        {tipoInicial === 'PARCIAL' && esSeparacion && <Tag severity="warning" value="SEPARACIÓN" icon="pi pi-exclamation-triangle" />}
                        {tipoInicial === 'PARCIAL' && !esSeparacion && <Tag severity="success" value="VENTA FINAL" icon="pi pi-check-circle" />}
                        {tipoInicial === 'TOTAL' && <Tag severity="success" value="INICIAL COMPLETA" icon="pi pi-check-circle" />}
                    </div>

                    {/* Selector de Tipo de Inicial */}
                    <div className="mt-3 mb-3">
                        <label className="font-medium block mb-2"><i className="pi pi-tag mr-2 text-primary"></i>Tipo de Inicial</label>
                        <SelectButton
                            value={tipoInicial}
                            onChange={(e) => e.value && setTipoInicial(e.value)}
                            options={[
                                { label: '🚫 Sin Inicial (CERO)', value: 'CERO' },
                                { label: '⚡ Abono Parcial', value: 'PARCIAL' },
                                { label: '✅ Pago Total', value: 'TOTAL' }
                            ]}
                            className="w-full tipo-inicial-selector"
                        />
                    </div>

                    {/* Campos según tipo */}
                    {tipoInicial === 'CERO' ? (
                        <div className="p-3 bg-blue-50 border-round border-1 border-blue-200">
                            <p className="m-0 text-blue-800 font-medium text-sm">
                                <i className="pi pi-info-circle mr-2"></i>
                                El cliente financia el 100% del precio del lote. No se cobra inicial.
                            </p>
                            <p className="m-0 mt-1 text-blue-700 text-sm">
                                Saldo a financiar: <strong>S/ {lotePrecio.toLocaleString('en-US', {minimumFractionDigits:2})}</strong>
                            </p>
                        </div>
                    ) : (
                        <div className="p-fluid grid mt-2">
                            <div className="field col-12 md:col-4">
                                <label className="font-medium">Precio Lote</label>
                                <InputNumber value={lotePrecio} onValueChange={(e) => setLotePrecio(e.value)} mode="currency" currency="PEN" />
                            </div>
                            <div className="field col-12 md:col-4">
                                <label className="font-medium">Inicial Acordada</label>
                                <InputNumber value={inicialAcordada} onValueChange={(e) => setInicialAcordada(e.value)} mode="currency" currency="PEN" className="input-highlight" />
                            </div>
                            {tipoInicial === 'PARCIAL' && (
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-blue-700">Abono Hoy</label>
                                    <InputNumber value={abonoReal} onValueChange={(e) => setAbonoReal(e.value)} mode="currency" currency="PEN" className="input-highlight-blue" />
                                </div>
                            )}
                            {tipoInicial === 'TOTAL' && (
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-green-700">Abono Hoy</label>
                                    <InputNumber value={inicialAcordada} disabled mode="currency" currency="PEN" />
                                </div>
                            )}

                            {esSeparacion && tipoInicial === 'PARCIAL' && (
                                <div className="field col-12 fade-in bg-white p-3 border-round border-1 border-orange-200 mt-2">
                                    <div className="flex align-items-center mb-2">
                                        <i className="pi pi-info-circle text-orange-500 mr-2"></i>
                                        <span className="text-sm font-bold text-orange-800">
                                            Faltan S/ {faltaPagarInicial.toLocaleString()} para completar la Inicial.
                                        </span>
                                    </div>
                                    <label className="font-medium text-sm"><i className="pi pi-clock mr-2 text-orange-600"></i>Fecha Límite para completar la Cuota 0:</label>
                                    <Calendar value={fechaLimiteInicial} onChange={(e) => setFechaLimiteInicial(e.value)} dateFormat="dd/mm/yy" showIcon className="mt-1" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Cronograma Regular */}
                <div className="custom-card mb-4">
                    <div className="card-header">
                        <i className="pi pi-calendar text-primary"></i>
                        <span className="font-bold text-lg ml-2">Cronograma de Pagos (Cuotas)</span>
                    </div>
                    <div className="p-fluid grid mt-3">
                        <div className="field col-12 md:col-6">
                            <label className="font-medium"><i className="pi pi-sort-numeric-up mr-2 text-primary"></i>Cantidad de Cuotas</label>
                            <InputNumber value={cuotas} onValueChange={(e) => setCuotas(e.value)} showButtons min={1} max={120} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-medium"><i className="pi pi-calendar-plus mr-2 text-primary"></i>Día Fijo Mensual</label>
                            <Calendar value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon />
                        </div>
                    </div>

                    <Divider />
                    <div className="flex items-center mb-3">
                        <Checkbox inputId="flexible" checked={isFlexible} onChange={e => setIsFlexible(e.checked)} />
                        <label htmlFor="flexible" className="ml-2 font-medium text-700 cursor-pointer">Simulación Especial (Cuotas Mixtas)</label>
                    </div>

                    {isFlexible && (
                        <div className="p-fluid grid flexible-box fade-in">
                            <div className="field col-12 md:col-6 mb-0">
                                <label className="text-sm font-bold text-orange-800">Primeras N Cuotas</label>
                                <InputNumber value={cuotasEspeciales} onValueChange={(e) => setCuotasEspeciales(e.value)} />
                            </div>
                            <div className="field col-12 md:col-6 mb-0">
                                <label className="text-sm font-bold text-orange-800">Monto Fijo (S/)</label>
                                <InputNumber value={montoEspecial} onValueChange={(e) => setMontoEspecial(e.value)} mode="currency" currency="PEN" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Observaciones */}
                <div className="custom-card mb-4">
                    <div className="p-fluid">
                        <div className="field mb-0">
                            <label className="font-medium">Observaciones del Vendedor (Opcional)</label>
                            <InputTextarea value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={3} autoResize placeholder="Ej: El cliente prometió traer el resto de la inicial en efectivo mañana." />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button label="Simular y Previsualizar" icon="pi pi-cog" className="w-full btn-primary-custom p-button-lg shadow-3 border-round-xl" onClick={simular} />
                    </div>
                </div>
            </div>

            {/* PANEL DERECHO: Previsualización de la Simulación */}
            <div className="col-12 xl:col-7">
                <div className="custom-card h-full flex flex-column bg-gray-50 border-none">
                    <div className="card-header flex justify-content-between align-items-center mb-4 bg-white p-3 border-round shadow-1">
                        <div>
                            <i className="pi pi-check-square text-green-500 text-xl"></i>
                            <span className="font-bold text-xl ml-2 text-800">Proyección Financiera</span>
                        </div>
                        {cronograma.length > 0 && !isContrato && (
                            <Button label="Guardar Cotización" icon="pi pi-file" className="p-button-outlined p-button-lg border-round-xl font-bold" onClick={guardarCotizacion} />
                        )}
                        {cronograma.length > 0 && isContrato && (
                            <Button label="Generar Contrato" icon="pi pi-file-edit" className="btn-success-custom p-button-lg shadow-3 border-round-xl font-bold" onClick={guardarContrato} />
                        )}
                    </div>

                    {cronograma.length === 0 ? (
                        <div className="flex-grow-1 flex flex-column align-items-center justify-content-center text-400 p-5 bg-white border-round border-1 border-gray-200">
                            <i className="pi pi-file-o text-7xl mb-4 opacity-20"></i>
                            <p className="m-0 text-xl font-medium">{isContrato ? 'Contrato no generado' : 'Cotización no generada'}</p>
                            <p className="m-0 mt-2">{isContrato ? 'Busque un interesado con cotización, modifique y simule.' : 'Configure los datos y simule para generar cotización.'}</p>
                        </div>
                    ) : (
                        <div className="flex-grow-1 flex flex-column fade-in">
                            
                            {/* Panel Resumen Backend */}
                            <div className="bg-white p-4 border-round border-1 border-blue-100 shadow-1 mb-4 border-left-3 border-blue-500">
                                <h4 className="m-0 mb-2 text-blue-800 font-bold text-sm uppercase">Descripción autogenerada por el sistema:</h4>
                                <p className="m-0 text-700 italic">"{descripcionGenerada}"</p>
                            </div>

                            {/* Estado del Lote */}
                            <div className="grid mb-4">
                                <div className="col-4">
                                    <div className="summary-box bg-white">
                                        <span className="summary-title">Estado Proyectado</span>
                                        <span className={`font-bold ${esSeparacion ? 'text-orange-600' : 'text-green-600'}`}>
                                            {esSeparacion ? 'SEPARADO' : 'VENDIDO'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="summary-box bg-white">
                                        <span className="summary-title">Saldo a Financiar</span>
                                        <span className="summary-value">S/ {saldoAFinanciar.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="summary-box bg-white">
                                        <span className="summary-title">Total Cuotas</span>
                                        <span className="summary-value">{cuotas} + Cuota 0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla Oficial */}
                            <div className="bg-white border-round shadow-1 overflow-hidden">
                                <DataTable value={cronograma} scrollable scrollHeight="500px" className="p-datatable-sm custom-table" 
                                    rowClassName={(data) => ({ 'bg-blue-50 font-bold': data.numero === 0 })}>
                                    <Column field="numero" header="N°" style={{ width: '8%' }} body={(r) => r.numero === 0 ? '0' : r.numero}></Column>
                                    <Column field="tipo" header="Tipo" style={{ width: '20%' }}></Column>
                                    <Column field="fecha" header="Vencimiento" style={{ width: '25%' }} body={(row) => <><i className="pi pi-calendar mr-2 text-400"></i>{row.fecha}</>}></Column>
                                    <Column header="Monto (S/)" body={montoTemplate} style={{ width: '25%', textAlign: 'right' }}></Column>
                                    <Column header="Estado" body={estadoTemplate} style={{ width: '22%', textAlign: 'center' }}></Column>
                                </DataTable>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="contrato-page cotizacion-page">
            <Toast ref={toast} />
            <PageHeader
                title="Gestión Comercial"
                description={tabIndex === 0 ? 'Nuevo registro de cotización y simulación.' : 'Generación de contratos desde cotizaciones.'}
                icon="pi pi-briefcase"
            />

            <div className="main-content">
                <TabView
                    activeIndex={tabIndex}
                    onTabChange={(e) => {
                        setTabIndex(e.index);
                        setCronograma([]);
                    }}
                >
                    <TabPanel header="Nuevo Registro" leftIcon="pi pi-file mr-2">
                        {renderContenido(false)}
                    </TabPanel>
                    <TabPanel header="Contrato" leftIcon="pi pi-file-edit mr-2">
                        {renderContenido(true)}
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
};

export default Cotizacion;