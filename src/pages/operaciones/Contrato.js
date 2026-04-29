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

const Contrato = ({ embedded = false }) => {
    const navigate = useNavigate();
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    // ==========================================
    // ESTADOS DEL FORMULARIO
    // ==========================================
    const [dni, setDni] = useState('');
    const [criterioBusqueda, setCriterioBusqueda] = useState('');
    const [cotizaciones, setCotizaciones] = useState([]);
    const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
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
    
    // Candado de Edición
    const [isEditFinanciamiento, setIsEditFinanciamiento] = useState(false);

    // Parámetros de Financiamiento
    const [lotePrecio, setLotePrecio] = useState(0);
    const [inicialAcordada, setInicialAcordada] = useState(500);
    const [abonoReal, setAbonoReal] = useState(0);
    const [fechaLimiteInicial, setFechaLimiteInicial] = useState(new Date(new Date().setDate(new Date().getDate() + 15)));
    const [fechaRegistro, setFechaRegistro] = useState(new Date()); 
    
    const [cuotas, setCuotas] = useState(36);
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    
    const [isFlexible, setIsFlexible] = useState(false);
    const [cuotasEspeciales, setCuotasEspeciales] = useState(3);
    const [montoEspecial, setMontoEspecial] = useState(1000);

    const [tipoInicial, setTipoInicial] = useState('PARCIAL');
    const [observacion, setObservacion] = useState('');
    const [cotizacionOrigenId, setCotizacionOrigenId] = useState(null);

    // Resultados y UI
    const [cronograma, setCronograma] = useState([]);
    const [descripcionGenerada, setDescripcionGenerada] = useState('');

    // Cálculos reactivos
    const montoInicialEfectivo = tipoInicial === 'CERO' ? 0 : inicialAcordada;
    const abonoEfectivo = tipoInicial === 'TOTAL' ? inicialAcordada : tipoInicial === 'CERO' ? 0 : abonoReal;
    const esSeparacion = tipoInicial === 'PARCIAL' && abonoReal < inicialAcordada;
    const faltaPagarInicial = Math.max(montoInicialEfectivo - abonoEfectivo, 0);
    const saldoAFinanciar = Math.max(lotePrecio - montoInicialEfectivo, 0);
    const hasCliente = Boolean(cliente?.numeroDocumento || cliente?.nombres);
    const cuotaPromedio = useMemo(() => {
        if (!Array.isArray(cronograma) || cronograma.length === 0) return 0;
        const cuotasMensuales = cronograma.filter((item) => item?.numero !== 0);
        if (cuotasMensuales.length === 0) return 0;
        const total = cuotasMensuales.reduce((acc, item) => acc + (Number(item?.montoTotal) || 0), 0);
        return total / cuotasMensuales.length;
    }, [cronograma]);

    const bgCuotaCero = tipoInicial === 'CERO' ? 'bg-blue-50 border-blue-200' 
                      : tipoInicial === 'PARCIAL' ? 'bg-orange-50 border-orange-300' 
                      : 'bg-green-50 border-green-300';

    // ==========================================
    // EFECTOS INICIALES
    // ==========================================
    useEffect(() => {
        cargarDatosBase();
    }, []);

    const cotizacionesOrdenadas = useMemo(() => {
        const base = Array.isArray(cotizaciones) ? [...cotizaciones] : [];
        return base.sort((a, b) => {
            const aDate = new Date(a.fechaCotizacion || a.createdAt || 0).getTime();
            const bDate = new Date(b.fechaCotizacion || b.createdAt || 0).getTime();
            return bDate - aDate;
        });
    }, [cotizaciones]);

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
                if (encontrado.precioVenta != null) setLotePrecio(encontrado.precioVenta);
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
        if (!departamento) { setProvincias([]); setDistritos([]); return; }
        try {
            const response = await UbigeoService.listarProvincias(departamento, axiosInstance);
            setProvincias(mapTextOptions(response));
        } catch (error) {
            setProvincias([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar provincias.' });
        }
    };

    const cargarDistritos = async (departamento, provincia) => {
        if (!departamento || !provincia) { setDistritos([]); return; }
        try {
            const response = await UbigeoService.listarDistritos(departamento, provincia, axiosInstance);
            setDistritos(mapDistritoOptions(response));
        } catch (error) {
            setDistritos([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar distritos.' });
        }
    };

    const onDepartamentoChange = async (value) => {
        setCliente((prev) => ({ ...(prev || {}), departamento: value, provincia: '', distrito: '', ubigeo: '' }));
        await cargarProvincias(value);
        setDistritos([]);
    };

    const onProvinciaChange = async (value) => {
        setCliente((prev) => ({ ...(prev || {}), provincia: value, distrito: '', ubigeo: '' }));
        await cargarDistritos(cliente?.departamento, value);
    };

    const onDistritoChange = (value) => {
        const distritoSelected = distritos.find((item) => item.value === value);
        setCliente((prev) => ({ ...(prev || {}), distrito: value, ubigeo: distritoSelected?.ubigeo || '' }));
    };

    const cargarDatosBase = async () => {
        try {
            const [resClientes, resLotes, resVendedores] = await Promise.all([
                ClienteService.listar(axiosInstance), LoteService.listar(axiosInstance), VendedorService.listar(axiosInstance)
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
        if (e.value && e.value.precioVenta != null) {
            setLotePrecio(e.value.precioVenta);
        }
    };

    const cargarDesdeCotizacion = async (seleccionada, clienteExistente) => {
        if (!seleccionada) return;
        setCotizacionOrigenId(seleccionada?.id || null);
        const interesado = seleccionada.interesado || {};

        const dep = interesado.departamento || clienteExistente?.departamento || '';
        const prov = interesado.provincia || clienteExistente?.provincia || '';
        const dist = interesado.distrito || clienteExistente?.distrito || '';
        const ubig = interesado.ubigeo || clienteExistente?.ubigeo || '';

        setCliente((prev) => ({
            ...(prev || {}),
            id: clienteExistente?.id || undefined,
            interesadoId: interesado.id || undefined,
            numeroDocumento: interesado.numeroDocumento || dni,
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

        if (dep) {
            await cargarProvincias(dep);
            if (prov) await cargarDistritos(dep, prov);
        }

        if (seleccionada.vendedor?.id) {
            const vendedorEncontrado = vendedoresOptions.find((item) => item?.id === seleccionada.vendedor.id);
            if (vendedorEncontrado) setVendedorSeleccionado(vendedorEncontrado);
            else setPendingVendedorId(seleccionada.vendedor.id);
        }

        let precioLoteCargado = 0;
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

        const inicialCargada = seleccionada.montoInicialAcordado ?? 500;
        const cuotasCargadas = seleccionada.cantidadCuotas || 36;
        const tipoCargado = seleccionada.tipoInicial || 'PARCIAL';
        const flexCargado = !!(seleccionada.cuotasFlexibles || seleccionada.cuotasEspeciales || seleccionada.montoCuotaEspecial);
        const espCargadas = seleccionada.cuotasEspeciales || 0;
        const mtoEspCargado = seleccionada.montoCuotaEspecial || 0;

        setInicialAcordada(inicialCargada);
        setAbonoReal(tipoCargado === 'TOTAL' ? inicialCargada : (inicialCargada * 0.2));
        setCuotas(cuotasCargadas);
        setTipoInicial(tipoCargado);
        setIsFlexible(flexCargado);
        setCuotasEspeciales(espCargadas);
        setMontoEspecial(mtoEspCargado);

        if (seleccionada.fechaInicioPago) setFechaInicio(new Date(seleccionada.fechaInicioPago));

        setTimeout(() => {
            simularConDatos(precioLoteCargado, inicialCargada, cuotasCargadas, tipoCargado, flexCargado, espCargadas, mtoEspCargado);
        }, 300);
    };

    const buscarCliente = async () => {
        const documento = (cliente?.numeroDocumento || dni || '').trim();
        if (documento.length !== 8) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'DNI inválido.' });
            return;
        }

        try {
            setCotizacionOrigenId(null);
            setIsEditFinanciamiento(false);
            
            const listadoClientes = Array.isArray(clientes) ? clientes : [];
            const clienteExistente = listadoClientes.find((item) => item.numeroDocumento === documento);

            const cotizaciones = await CotizacionService.buscarPorDni(documento, axiosInstance);
            const listaCotizaciones = Array.isArray(cotizaciones) ? cotizaciones : [];

            if (listaCotizaciones.length > 0) {
                const sorted = [...listaCotizaciones].sort((a, b) => {
                    return new Date(b.fechaCotizacion || b.createdAt || 0).getTime() - new Date(a.fechaCotizacion || a.createdAt || 0).getTime();
                });
                const seleccionada = sorted[0];
                setCotizaciones(listaCotizaciones);
                setCotizacionSeleccionada(seleccionada);
                await cargarDesdeCotizacion(seleccionada, clienteExistente);
                toast.current?.show({ severity: 'success', summary: 'Cotización encontrada', detail: 'Se cargaron los datos de la cotización.' });
                return;
            }

            if (clienteExistente) {
                setCliente(clienteExistente);
                setDni(clienteExistente.numeroDocumento || documento);
                if (clienteExistente.departamento) await cargarProvincias(clienteExistente.departamento);
                if (clienteExistente.provincia) await cargarDistritos(clienteExistente.departamento, clienteExistente.provincia);
                toast.current?.show({ severity: 'success', summary: 'Encontrado', detail: 'Cliente cargado desde el sistema.' });
                return;
            }

            const response = await ReniecService.consultarDNI(documento, axiosInstance);
            if (!response?.success) {
                toast.current?.show({ severity: 'warn', summary: 'RENIEC', detail: response?.message || 'DNI no encontrado.' });
                return;
            }

            const data = response.data || {};
            const nombres = data.nombres || data.nombre || '';
            const apellidoPaterno = data.apellidoPaterno || data.apellido_paterno || '';
            const apellidoMaterno = data.apellidoMaterno || data.apellido_materno || '';
            setCliente({ id: undefined, numeroDocumento: documento, tipoDocumento: 'DNI', nombres, apellidos: `${apellidoPaterno} ${apellidoMaterno}`.trim(), email: '' });
            setDni(documento);
            toast.current?.show({ severity: 'success', summary: 'Encontrado', detail: 'Cliente cargado desde RENIEC.' });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error en la búsqueda.' });
        }
    };

    const limpiarResultados = () => {
        setCotizaciones([]);
        setCotizacionSeleccionada(null);
        setCotizacionOrigenId(null);
        setCronograma([]);
    };

    const buscarCotizaciones = async () => {
        const criterio = criterioBusqueda.trim();
        if (criterio.length < 4) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese al menos 4 caracteres.' });
            return;
        }

        try {
            const response = await CotizacionService.listar(axiosInstance);
            const listado = Array.isArray(response) ? response : [];
            const criterioNormalizado = criterio.toLowerCase();

            const filtrado = listado.filter((item) => {
                const doc = `${item?.interesado?.numeroDocumento || ''}`.toLowerCase();
                const idCotizacion = `${item?.id || ''}`.toLowerCase();
                return doc.includes(criterioNormalizado) || idCotizacion.includes(criterioNormalizado);
            });

            if (filtrado.length === 0) {
                toast.current?.show({ severity: 'warn', summary: 'Sin resultados', detail: 'No se encontraron cotizaciones para este criterio.' });
                limpiarResultados();
                return;
            }

            setCotizaciones(filtrado);
            const seleccion = [...filtrado].sort((a, b) => {
                const aDate = new Date(a.fechaCotizacion || a.createdAt || 0).getTime();
                const bDate = new Date(b.fechaCotizacion || b.createdAt || 0).getTime();
                return bDate - aDate;
            })[0];
            setCotizacionSeleccionada(seleccion);
            await cargarDesdeCotizacion(seleccion, null);
            setCronograma([]);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo buscar la cotización.' });
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
            
            nc.push({ 
                numero: i + 1, 
                tipoCuota: (pFlex && i < eCant) ? 'ESPECIAL' : 'MENSUAL', 
                montoTotal: Math.round(m * 100) / 100, 
                montoPagado: 0, 
                saldoPendiente: Math.round(m * 100) / 100, 
                fecha: dt.toISOString().split('T')[0], 
                estado: 'PENDIENTE' 
            });
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

    const formatDate = (value) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('es-PE');
    };

    // ==========================================
    // GUARDADO OFICIAL DE CONTRATO
    // ==========================================
    const guardarContrato = async () => {
        if (!loteSeleccionado?.id || !vendedorSeleccionado?.id || cronograma.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Faltan datos', detail: 'Seleccione el lote, vendedor y genere la simulación.' });
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
                    tipoDocumento: cliente.tipoDocumento || 'DNI',
                    numeroDocumento: dni,
                    nombres: cliente.nombres,
                    apellidos: cliente.apellidos || '',
                    telefono: cliente.telefono || '',
                    email: cliente.email || '',
                    departamento: cliente.departamento || '',
                    provincia: cliente.provincia || '',
                    distrito: cliente.distrito || '',
                    ubigeo: cliente.ubigeo || '',
                    direccion: cliente.direccion || ''
                };
                const resCliente = await ClienteService.crear(nuevoClientePayload, axiosInstance);
                idClienteFinal = resCliente?.data?.id || resCliente?.id;
            }

            if (!idClienteFinal) {
                toast.current.show({ severity: 'error', summary: 'Error de ID', detail: 'No se pudo obtener el ID del cliente.' });
                return;
            }

            const contratoPayload = {
                loteId: loteSeleccionado.id,
                clienteId: idClienteFinal,
                vendedorId: vendedorSeleccionado.id,
                precioTotal: lotePrecio,
                montoInicialAcordado: inicialAcordada,
                abonoInicialReal: abonoEfectivo,
                fechaLimiteInicial: tipoInicial !== 'CERO' ? fechaLimiteInicial.toISOString().split('T')[0] : null,
                cantidadCuotas: cuotas,
                fechaInicioPago: fechaInicio.toISOString().split('T')[0],
                fechaContrato: fechaRegistro.toISOString().split('T')[0],
                cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: isFlexible ? montoEspecial : 0,
                cotizacionId: cotizacionOrigenId,
                tipoInicial: tipoInicial,
                cuotasFlexibles: isFlexible,
                observacion: observacion || ''
            };

            const response = await ContratoService.crear(contratoPayload, axiosInstance);
            toast.current.show({ severity: 'success', summary: '¡Éxito!', detail: 'Contrato emitido correctamente.' });
            
            setTimeout(() => {
                const idGenerado = response?.id || response?.data?.id;
                if(idGenerado) navigate(`/detalle_contrato/${idGenerado}`);
            }, 1000);
            
            setCronograma([]);
            setObservacion('');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar contrato.' });
        }
    };

    // ==========================================
    // TEMPLATES VISUALES
    // ==========================================
    const loteOptionTemplate = (option) => (
        <div className="flex justify-content-between align-items-center w-full border-bottom-1 surface-border py-2 px-1">
            <div>
                <div className="font-bold text-700 text-lg">{option.descripcion || `Lote ${option.numero}`}</div>
                <div className="text-sm text-500 mt-1"><i className="pi pi-expand mr-1 text-blue-500"></i>{option.area || 0} m²</div>
            </div>
            <div className="text-right">
                <span className="font-bold text-blue-600 block text-lg">S/ {(option.precioVenta || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <Tag severity="success" value="Disponible" className="text-xs mt-1" />
            </div>
        </div>
    );

    const loteSelectedTemplate = (option, props) => {
        if (option) return <div className="flex align-items-center font-bold text-blue-800"><i className="pi pi-map-marker mr-2"></i>{option.descripcion || `Lote ${option.numero}`}</div>;
        return <span>{props.placeholder}</span>;
    };

    const estadoTemplate = (rowData) => {
        if (rowData.numero === 0) {
            return rowData.estado === 'SEPARACIÓN' || rowData.estado === 'PAGADO_PARCIAL'
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
                    {rowData.saldoPendiente > 0 && <span className="text-xs text-orange-600">Debe: S/ {rowData.saldoPendiente.toLocaleString()}</span>}
                </div>
            );
        }
        return <span className="font-bold">S/ {rowData.montoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>;
    };

    const tipoTemplate = (rowData) => {
        if (rowData.tipoCuota === 'ESPECIAL') {
            return <span className="text-orange-600 font-bold flex align-items-center"><i className="pi pi-star-fill mr-1 text-xs"></i> ESPECIAL</span>;
        }
        if (rowData.tipoCuota === 'INICIAL') {
            return <span className="text-blue-700 font-bold flex align-items-center"><i className="pi pi-wallet mr-1 text-xs"></i> INICIAL</span>;
        }
        return <span>{rowData.tipoCuota || 'MENSUAL'}</span>;
    };

    // ==========================================
    // RENDER PRINCIPAL
    // ==========================================
    const renderContenido = () => (
        <div className="grid mt-3 align-items-stretch">
            
            {/* ====== PANEL IZQUIERDO: CONTEXTO ====== */}
            <div className="col-12 xl:col-5 flex">
                <div className="custom-card mb-4 w-full flex flex-column">
                    <div className="card-header">
                        <i className="pi pi-search text-primary"></i>
                        <span className="font-bold text-lg ml-2">Buscador y Contexto</span>
                    </div>
                    
                    <div className="p-fluid mt-3 flex-grow-1 flex flex-column justify-content-between">
                        <div>
                            {/* Buscador */}
                            <label className="font-medium text-sm mb-2 block">Documento del interesado o N° cotización</label>
                            <div className="p-inputgroup mb-4">
                                <InputText value={criterioBusqueda} onChange={(e) => setCriterioBusqueda(e.target.value)} placeholder="Ej: 72384732 o COT-102" />
                                <Button icon="pi pi-search" onClick={buscarCotizaciones} className="btn-primary-custom" />
                                <Button icon="pi pi-times" className="p-button-outlined" onClick={limpiarResultados} />
                            </div>

                            <div className="custom-card mb-4">
                                <div className="card-header">
                                    <i className="pi pi-list text-primary"></i>
                                    <span className="font-bold text-lg ml-2">Cotizaciones encontradas</span>
                                </div>
                                <div className="p-fluid mt-3">
                                    <DataTable
                                        value={cotizacionesOrdenadas}
                                        selectionMode="single"
                                        selection={cotizacionSeleccionada}
                                        onSelectionChange={async (e) => {
                                            setCotizacionSeleccionada(e.value);
                                            await cargarDesdeCotizacion(e.value, null);
                                            setCronograma([]);
                                        }}
                                        dataKey="id"
                                        paginator
                                        rows={5}
                                        emptyMessage="No hay cotizaciones para mostrar."
                                        className="p-datatable-sm custom-table"
                                    >
                                        <Column header="Documento" body={(row) => `${row?.interesado?.tipoDocumento || 'DNI'} ${row?.interesado?.numeroDocumento || ''}`}></Column>
                                        <Column header="Interesado" body={(row) => `${row?.interesado?.nombres || ''} ${row?.interesado?.apellidos || ''}`.trim()}></Column>
                                        <Column header="Fecha" body={(row) => formatDate(row?.fechaCotizacion)}></Column>
                                        <Column header="Estado" body={(row) => row?.estado || 'VIGENTE'}></Column>
                                    </DataTable>
                                </div>
                            </div>

                            {cotizacionSeleccionada && (
                                <div className="custom-card fade-in mb-4">
                                    <div className="flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <span className="text-xs font-bold text-500 uppercase">Cotización activa</span>
                                            <h3 className="m-0 text-xl font-black text-800">{cotizacionSeleccionada.id || '-'}</h3>
                                        </div>
                                        <span className="status-badge vigente">{cotizacionSeleccionada.estado || 'VIGENTE'}</span>
                                    </div>

                                    <div className="info-box mb-3">
                                        <div className="font-bold text-800 flex align-items-center">
                                            <i className="pi pi-user mr-2 text-primary"></i> {`${cotizacionSeleccionada?.interesado?.nombres || ''} ${cotizacionSeleccionada?.interesado?.apellidos || ''}`.trim()}
                                        </div>
                                        <div className="text-sm text-600 mt-1 ml-4">{cotizacionSeleccionada?.lote?.descripcion || ''}</div>
                                    </div>

                                    <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 mb-2">
                                        <span className="text-sm font-medium text-600">Precio Total</span>
                                        <span className="font-bold text-800">S/ {(cotizacionSeleccionada.precioTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 mb-2">
                                        <span className="text-sm font-medium text-blue-600">Inicial</span>
                                        <span className="font-bold text-blue-800">S/ {(cotizacionSeleccionada.montoInicialAcordado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-sm font-medium text-600">Cuotas</span>
                                        <span className="font-bold text-800">{cotizacionSeleccionada.cantidadCuotas || 0}</span>
                                    </div>
                                </div>
                            )}
                            {hasCliente && (
                                <>
                                    <Divider />
                                    <div className="p-fluid grid">
                                        <div className="field col-12">
                                            <label className="font-medium text-sm">Vendedor Asignado</label>
                                            <Dropdown value={vendedorSeleccionado} options={vendedoresOptions} onChange={(e) => setVendedorSeleccionado(e.value)} optionLabel="nombreCompleto" placeholder="Seleccione Vendedor" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Lote */}
                        {hasCliente && (
                            <div className="mt-3 bg-slate-50 p-3 border-round border-1 surface-border">
                                <label className="font-medium text-sm block mb-2 text-indigo-700"><i className="pi pi-map-marker mr-2"></i>Inmueble Seleccionado</label>
                                <Dropdown
                                    value={loteSeleccionado}
                                    options={lotesOptions}
                                    onChange={onLoteChange}
                                    itemTemplate={loteOptionTemplate}
                                    valueTemplate={loteSelectedTemplate}
                                    placeholder="Despliegue para seleccionar lote"
                                    className="p-dropdown-lg w-full bg-white"
                                    disabled={!isEditFinanciamiento}
                                    panelStyle={{ minWidth: '320px' }}
                                />
                                {loteSeleccionado && (
                                    <div className="mt-2 text-right">
                                        <span className="text-xs text-500 uppercase font-bold mr-2">Área: {loteSeleccionado.area} m²</span>
                                        <span className="text-sm font-black text-green-700">Precio Oficial: S/ {loteSeleccionado.precioVenta?.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ====== PANEL DERECHO: FINANCIAMIENTO ====== */}
            {hasCliente && (
                <div className="col-12 xl:col-7 flex">
                    <div className="custom-card mb-4 w-full flex flex-column">
                        <div className="card-header flex justify-content-between align-items-center">
                            <div>
                                <i className="pi pi-wallet text-primary"></i>
                                <span className="font-bold text-lg ml-2">Configuración de Financiamiento</span>
                            </div>
                            <Button 
                                label={isEditFinanciamiento ? 'Edición Habilitada' : 'Desbloquear Edición'} 
                                icon={isEditFinanciamiento ? 'pi pi-unlock' : 'pi pi-lock'} 
                                className={`p-button-sm ${isEditFinanciamiento ? 'p-button-warning' : 'p-button-secondary p-button-outlined'}`} 
                                onClick={() => setIsEditFinanciamiento(!isEditFinanciamiento)} 
                            />
                        </div>

                        <div className="p-fluid grid mt-3">
                            {/* 1. Generales */}
                            <div className="col-12">
                                <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">1. Condiciones Generales</h4>
                                <div className="grid">
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium text-xs uppercase text-500">Precio a Tratar (S/)</label>
                                        <InputNumber value={lotePrecio} onValueChange={(e) => setLotePrecio(e.value)} mode="currency" currency="PEN" disabled={!isEditFinanciamiento} className="font-bold" />
                                    </div>
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium text-xs uppercase text-500">Inicial Acordada (S/)</label>
                                        <InputNumber value={inicialAcordada} onValueChange={(e) => setInicialAcordada(e.value)} mode="currency" currency="PEN" disabled={!isEditFinanciamiento} className="font-bold" />
                                    </div>
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium text-xs uppercase text-500">N° Cuotas Mensuales</label>
                                        <InputNumber value={cuotas} onValueChange={(e) => setCuotas(e.value)} showButtons min={1} max={120} disabled={!isEditFinanciamiento} />
                                    </div>
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium text-xs uppercase text-500">Día Fijo de Pago</label>
                                        <Calendar value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon disabled={!isEditFinanciamiento} />
                                    </div>
                                </div>
                            </div>

                            {/* Cuotas Especiales */}
                            <div className="col-12 mb-4">
                                <div className="bg-slate-50 p-3 border-round border-1 surface-border">
                                    <div className="flex align-items-center">
                                        <Checkbox inputId="flexible" checked={isFlexible} onChange={e => setIsFlexible(e.checked)} disabled={!isEditFinanciamiento} />
                                        <label htmlFor="flexible" className="ml-2 font-medium text-sm text-700 cursor-pointer">Simulación Especial (Cuotas Mixtas)</label>
                                    </div>
                                    {isFlexible && (
                                        <div className="grid mt-2 fade-in">
                                            <div className="field col-6 mb-0">
                                                <label className="text-xs font-bold text-orange-800 uppercase">Primeras N Cuotas Fijas</label>
                                                <InputNumber value={cuotasEspeciales} onValueChange={(e) => setCuotasEspeciales(e.value)} disabled={!isEditFinanciamiento} />
                                            </div>
                                            <div className="field col-6 mb-0">
                                                <label className="text-xs font-bold text-orange-800 uppercase">Monto Especial Fijo (S/)</label>
                                                <InputNumber value={montoEspecial} onValueChange={(e) => setMontoEspecial(e.value)} mode="currency" currency="PEN" disabled={!isEditFinanciamiento} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Inicial */}
                            <div className="col-12">
                                <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">2. Resolución de Inicial</h4>
                                <div className={`p-4 border-round border-2 transition-colors transition-duration-300 ${bgCuotaCero}`}>
                                    <div className="flex justify-content-between align-items-center mb-3">
                                        <label className="font-bold text-800 m-0">Cuota 0 — Inicial</label>
                                        {tipoInicial === 'PARCIAL' && esSeparacion && <Tag severity="warning" value="SEPARACIÓN" />}
                                        {tipoInicial === 'PARCIAL' && !esSeparacion && <Tag severity="success" value="VENTA FINAL" />}
                                        {tipoInicial === 'TOTAL' && <Tag severity="success" value="INICIAL COMPLETA" />}
                                        
                                    </div>
                                    <label className="font-medium text-sm block mb-2 text-800"><i className="pi pi-tag mr-2"></i>Seleccione Intención de Compra:</label>
                                    <SelectButton
                                        value={tipoInicial}
                                        onChange={(e) => e.value && setTipoInicial(e.value)}
                                        options={[
                                            { label: '⚡ Abono Parcial', value: 'PARCIAL' },
                                            { label: '✅ Pago Total', value: 'TOTAL' }
                                        ]}
                                        className="w-full mb-4"
                                        disabled={!isEditFinanciamiento}
                                    />


                                    {tipoInicial === 'PARCIAL' && (
                                        <div className="grid fade-in">
                                            <div className="col-12 md:col-6">
                                                <label className="font-bold text-xs uppercase text-orange-900">Abono Hoy (S/)</label>
                                                <InputNumber value={abonoReal} onValueChange={(e) => setAbonoReal(e.value)} mode="currency" currency="PEN" disabled={!isEditFinanciamiento} className="input-highlight-orange" />
                                            </div>
                                            {esSeparacion && (
                                                <div className="col-12 md:col-6">
                                                    <label className="font-bold text-xs uppercase text-orange-900">Fecha Límite (Resto)</label>
                                                    <Calendar value={fechaLimiteInicial} onChange={(e) => setFechaLimiteInicial(e.value)} dateFormat="dd/mm/yy" showIcon disabled={!isEditFinanciamiento} className="w-full" />
                                                </div>
                                            )}
                                            {esSeparacion && (
                                                <div className="col-12 mt-2">
                                                    <div className="bg-white p-2 border-round border-1 border-orange-200 flex align-items-center text-sm shadow-1">
                                                        <i className="pi pi-exclamation-triangle text-orange-500 mr-2"></i>
                                                        <span className="font-bold text-orange-800">Faltan S/ {faltaPagarInicial.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {tipoInicial === 'TOTAL' && (
                                        <div className="text-center p-3 bg-white border-round border-1 border-green-200 fade-in">
                                            <i className="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
                                            <p className="m-0 font-bold text-green-900">Inicial Cubierta al 100%</p>
                                            <p className="m-0 text-lg font-black text-green-700">S/ {parseFloat(inicialAcordada).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detalles finales */}
                            <div className="col-12 mt-2">
                                <label className="font-medium text-sm block mb-1">Fecha Oficial del Contrato</label>
                                <Calendar value={fechaRegistro} onChange={(e) => setFechaRegistro(e.value)} showIcon showTime hourFormat="24" dateFormat="dd/mm/yy" disabled={!isEditFinanciamiento} />
                            </div>
                            
                            <div className="col-12 mt-4 text-right">
                                <Button label="Generar / Actualizar Cronograma" icon="pi pi-calculator" className="btn-primary-custom w-full md:w-auto" onClick={simular} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== TABLA DE PROYECCIÓN ====== */}
            {hasCliente && (
                <div className="col-12">
                    <div className="custom-card h-full flex flex-column bg-gray-50 border-none">
                        <div className="card-header flex justify-content-between align-items-center mb-4 bg-white p-3 border-round shadow-1">
                            <div>
                                <i className="pi pi-check-square text-green-500 text-xl"></i>
                                <span className="font-bold text-xl ml-2 text-800">Proyección Oficial</span>
                            </div>
                            {cronograma.length > 0 && (
                                <Button label="Emitir Contrato Oficial" icon="pi pi-file-edit" className="btn-success-custom p-button-lg shadow-3 border-round-xl font-bold" onClick={guardarContrato} />
                            )}
                        </div>

                        {cronograma.length === 0 ? (
                            <div className="flex-grow-1 flex flex-column align-items-center justify-content-center text-400 p-5 bg-white border-round border-1 border-gray-200">
                                <i className="pi pi-file-o text-7xl mb-4 opacity-20"></i>
                                <p className="m-0 text-xl font-medium">Contrato no generado</p>
                                <p className="m-0 mt-2">Busque un cliente, configure el financiamiento y simule.</p>
                            </div>
                        ) : (
                            <div className="flex-grow-1 flex flex-column fade-in">
                                {/* Resumen 5 Columnas */}
                                <div className="grid mb-4">
                                    <div className="col-12 md:col-3">
                                        <div className="summary-box bg-white h-full">
                                            <span className="summary-title">Estado Proyectado</span>
                                            <span className={`font-bold ${esSeparacion ? 'text-orange-600' : 'text-green-600'}`}>
                                                {esSeparacion ? 'SEPARADO' : 'ACTIVO'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-12 md:col-3">
                                        <div className="summary-box bg-white h-full">
                                            <span className="summary-title text-blue-600">Precio Inmueble</span>
                                            <span className="summary-value text-blue-800">S/ {parseFloat(lotePrecio).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="col-12 md:col-3">
                                        <div className="summary-box bg-white h-full">
                                            <span className="summary-title">Saldo a Financiar</span>
                                            <span className="summary-value">S/ {saldoAFinanciar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="col-12 md:col-3">
                                        <div className="summary-box bg-white h-full">
                                            <span className="summary-title">Total Cuotas</span>
                                            <span className="summary-value">{cuotas} + Inicial</span>
                                        </div>
                                    </div>
                                    {/* <div className="col-12 md:col-3">
                                        <div className="summary-box bg-white h-full">
                                            <span className="summary-title">Cuota Promedio</span>
                                            <span className="summary-value">S/ {cuotaPromedio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div> */}
                                </div>

                            <div className="bg-white border-round shadow-1 overflow-hidden">
                                <DataTable value={cronograma} scrollable scrollHeight="500px" className="p-datatable-sm custom-table" 
                                    rowClassName={(data) => ({ 
                                        'bg-blue-50 font-bold': data.numero === 0,
                                        'bg-orange-50 font-bold': data.tipoCuota === 'ESPECIAL'
                                    })}>
                                    <Column field="numero" header="N°" style={{ width: '8%' }} body={(r) => r.numero === 0 ? '0' : r.numero}></Column>
                                    <Column field="tipoCuota" header="Tipo" style={{ width: '20%' }} body={tipoTemplate}></Column>
                                    <Column field="fecha" header="Vencimiento" style={{ width: '25%' }} body={(row) => <><i className="pi pi-calendar mr-2 text-400"></i>{row.fecha}</>}></Column>
                                    <Column header="Monto (S/)" body={montoTemplate} style={{ width: '25%', textAlign: 'right' }}></Column>
                                    <Column header="Estado" body={estadoTemplate} style={{ width: '22%', textAlign: 'center' }}></Column>
                                </DataTable>
                            </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="contrato-page cotizacion-page">
            <Toast ref={toast} />
            {!embedded && (
                <PageHeader title="Cierre de Venta" description="Ajuste el financiamiento y genere el contrato oficial." icon="pi pi-check-square" />
            )}
            {embedded ? renderContenido() : <div className="main-content">{renderContenido()}</div>}
        </div>
    );
};

export default Contrato;