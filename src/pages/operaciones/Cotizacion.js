import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { SelectButton } from 'primereact/selectbutton';
import PageHeader from '../../components/ui/PageHeader';
import DialogHeader from '../../components/ui/DialogHeader';
import { useAuth } from '../../context/AuthContext';
import { filtrarDocumento, maxLengthDocumento, placeholderDocumento } from '../../utils/documentoUtils';
import { ClienteService } from '../../service/ClienteService';
import { VendedorService } from '../../service/VendedorService';
import { LoteService } from '../../service/LoteService';
import { ReniecService } from '../../service/ReniecService';
import { CotizacionService } from '../../service/CotizacionService';
import { ContratoService } from '../../service/ContratoService';
import { UbigeoService } from '../../service/UbigeoService';
import { InteresadoService } from '../../service/InteresadoService';

import './Contrato.css';
import './Cotizacion.css';

const Cotizacion = ({ embedded = false }) => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);
    const crearCoCompradorVacio = () => ({
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        nombres: '',
        apellidos: '',
        estadoCivil: '',
        telefono: '',
        email: '',
        direccion: '',
        departamento: '',
        provincia: '',
        distrito: '',
        ubigeo: ''
    });

    // ==========================================
    // ESTADOS DEL FORMULARIO
    // ==========================================
    const [dni, setDni] = useState('');
    const [provinciasCo, setProvinciasCo] = useState([]);
    const [distritosCo, setDistritosCo] = useState([]);
    const [cliente, setCliente] = useState(null);
    const [coCompradorSeleccionado, setCoCompradorSeleccionado] = useState(null);
    const [mostrarCoComprador, setMostrarCoComprador] = useState(false);
    const [coCompradorModalVisible, setCoCompradorModalVisible] = useState(false);
    const [coCompradorDraft, setCoCompradorDraft] = useState(crearCoCompradorVacio());
    const [clientes, setClientes] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const estadoCivilOptions = [
        { label: 'Soltero(a)', value: 'Soltero(a)' },
        { label: 'Casado(a)', value: 'Casado(a)' },
        { label: 'Divorciado(a)', value: 'Divorciado(a)' },
        { label: 'Viudo(a)', value: 'Viudo(a)' },
        { label: 'Conviviente', value: 'Conviviente' }
    ];
    
    // Selectores
    const [lotes, setLotes] = useState([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [vendedores, setVendedores] = useState([]);
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
    const [pendingLoteId, setPendingLoteId] = useState(null);
    const [pendingVendedorId, setPendingVendedorId] = useState(null);
    const [urbanizacionSeleccionada, setUrbanizacionSeleccionada] = useState(null);
    const [etapaSeleccionada, setEtapaSeleccionada] = useState(null);
    const [manzanaSeleccionada, setManzanaSeleccionada] = useState(null);

    // Parámetros de la Cuota 0 (Inicial / Separación)
    const [lotePrecio, setLotePrecio] = useState(0); 
    const [inicialAcordada, setInicialAcordada] = useState(0); 
    const [abonoReal, setAbonoReal] = useState(0);
    const [fechaLimiteInicial, setFechaLimiteInicial] = useState(new Date(new Date().setDate(new Date().getDate() + 15)));
    
    // Parámetros del Cronograma (1 a N)
    const [cuotas, setCuotas] = useState(36);
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    
    // Parámetros Flexibles (Cuotas Especiales)
    const [isFlexible, setIsFlexible] = useState(false);
    const [cuotasEspeciales, setCuotasEspeciales] = useState(3);
    const [montoEspecial, setMontoEspecial] = useState(1000);

    // Tipo de Inicial
    const [tipoInicial, setTipoInicial] = useState(null);

    // Observaciones manuales
    const [observacion, setObservacion] = useState('');

    // Resultados y UI
    const [cronograma, setCronograma] = useState([]);
    const [descripcionGenerada, setDescripcionGenerada] = useState('');

    // Cálculos reactivos
    const abonoEfectivo = tipoInicial === 'TOTAL' ? inicialAcordada : abonoReal;
    const esSeparacion = tipoInicial === 'PARCIAL' && abonoReal < inicialAcordada;
    const faltaPagarInicial = inicialAcordada - abonoEfectivo;
    const saldoAFinanciar = lotePrecio - inicialAcordada;

    const bgCuotaCero = tipoInicial === 'PARCIAL' 
        ? 'bg-orange-50 border-orange-300' 
        : tipoInicial === 'TOTAL' 
        ? 'bg-green-50 border-green-300' 
        : 'bg-white border-300';

    // ==========================================
    // EFECTOS INICIALES Y CARGA DE DATOS
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

    const urbanizacionesOptions = useMemo(() => {
        const map = new Map();
        lotesOptions.forEach((item) => {
            const urbanizacion = item?.manzana?.etapa?.urbanizacion;
            if (urbanizacion?.id && !map.has(urbanizacion.id)) {
                map.set(urbanizacion.id, { label: urbanizacion.nombre || 'Sin nombre', value: urbanizacion });
            }
        });
        return Array.from(map.values());
    }, [lotesOptions]);

    const etapasOptions = useMemo(() => {
        if (!urbanizacionSeleccionada?.id) return [];
        const map = new Map();
        lotesOptions.forEach((item) => {
            const etapa = item?.manzana?.etapa;
            const urbanizacion = etapa?.urbanizacion;
            if (urbanizacion?.id === urbanizacionSeleccionada.id && etapa?.id && !map.has(etapa.id)) {
                map.set(etapa.id, { label: etapa.nombre || 'Sin nombre', value: etapa });
            }
        });
        return Array.from(map.values());
    }, [lotesOptions, urbanizacionSeleccionada]);

    const manzanasOptions = useMemo(() => {
        if (!etapaSeleccionada?.id) return [];
        const map = new Map();
        lotesOptions.forEach((item) => {
            const manzana = item?.manzana;
            const etapa = manzana?.etapa;
            if (etapa?.id === etapaSeleccionada.id && manzana?.id && !map.has(manzana.id)) {
                map.set(manzana.id, { label: manzana.nombre || 'Sin nombre', value: manzana });
            }
        });
        return Array.from(map.values());
    }, [lotesOptions, etapaSeleccionada]);

    const lotesFiltradosOptions = useMemo(() => {
        if (!manzanaSeleccionada?.id) return [];
        return lotesOptions.filter((item) => item?.manzana?.id === manzanaSeleccionada.id);
    }, [lotesOptions, manzanaSeleccionada]);

    const vendedoresOptions = useMemo(() =>
        vendedores.map((item) => ({
            ...item,
            nombreCompleto: `${item.nombres || ''} ${item.apellidos || ''}`.trim()
        })),
        [vendedores]
    );

    const coCompradoresOptions = useMemo(() => {
        const titularId = cliente?.id;
        const titularDocumento = (cliente?.numeroDocumento || '').trim();

        return (clientes || [])
            .filter((item) => item?.id && item.id !== titularId)
            .filter((item) => (item?.numeroDocumento || '').trim() !== titularDocumento)
            .map((item) => ({
                ...item,
                nombreCompleto: `${item.nombres || ''} ${item.apellidos || ''}`.trim(),
                detalleDocumento: `${item.tipoDocumento || 'DNI'}: ${item.numeroDocumento || 'N/A'}`
            }));
    }, [clientes, cliente]);

    const abrirModalCoComprador = () => {
        setCoCompradorDraft((prev) => ({
            ...crearCoCompradorVacio(),
            ...prev,
            tipoDocumento: prev?.tipoDocumento || 'DNI'
        }));
        setCoCompradorModalVisible(true);
        setMostrarCoComprador(true);
    };

    const cerrarModalCoComprador = () => {
        setCoCompradorModalVisible(false);
    };

    const buscarDniCoComprador = async () => {
        if (coCompradorDraft.tipoDocumento && coCompradorDraft.tipoDocumento !== 'DNI') {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'La consulta RENIEC aplica solo para DNI.' });
            return;
        }
        const dniCo = (coCompradorDraft.numeroDocumento || '').trim();
        if (dniCo.length !== 8) {
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'El DNI debe tener 8 dígitos.' });
            return;
        }
        try {
            const response = await ReniecService.consultarDNI(dniCo, axiosInstance);
            if (!response?.success) {
                toast.current?.show({ severity: 'warn', summary: 'RENIEC', detail: response?.message || 'DNI no encontrado.' });
                return;
            }
            const data = response.data || {};
            const nombres = data.nombres || data.nombre || '';
            const apellidoPaterno = data.apellidoPaterno || data.apellido_paterno || '';
            const apellidoMaterno = data.apellidoMaterno || data.apellido_materno || '';
            const apellidos = data.apellidos || `${apellidoPaterno} ${apellidoMaterno}`.trim();
            setCoCompradorDraft((prev) => ({ ...prev, nombres, apellidos }));
            toast.current?.show({ severity: 'success', summary: 'RENIEC', detail: 'Datos cargados correctamente.' });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar RENIEC.' });
        }
    };

    const onDepartamentoCoChange = async (value) => {
        setCoCompradorDraft((prev) => ({ ...prev, departamento: value, provincia: '', distrito: '', ubigeo: '' }));
        if (!value) { setProvinciasCo([]); setDistritosCo([]); return; }
        try {
            const response = await UbigeoService.listarProvincias(value, axiosInstance);
            setProvinciasCo(mapTextOptions(response));
        } catch (error) { setProvinciasCo([]); }
        setDistritosCo([]);
    };

    const onProvinciaCoChange = async (value) => {
        setCoCompradorDraft((prev) => ({ ...prev, provincia: value, distrito: '', ubigeo: '' }));
        if (!value || !coCompradorDraft.departamento) { setDistritosCo([]); return; }
        try {
            const response = await UbigeoService.listarDistritos(coCompradorDraft.departamento, value, axiosInstance);
            setDistritosCo(mapDistritoOptions(response));
        } catch (error) { setDistritosCo([]); }
    };

    const onDistritoCoChange = (value) => {
        const distritoSelected = distritosCo.find((item) => item.value === value);
        setCoCompradorDraft((prev) => ({ ...prev, distrito: value, ubigeo: distritoSelected?.ubigeo || '' }));
    };

    const guardarCoCompradorDraft = () => {
        const nombres = (coCompradorDraft.nombres || '').trim();
        const apellidos = (coCompradorDraft.apellidos || '').trim();
        const telefono = (coCompradorDraft.telefono || '').trim();

        if (!nombres || !apellidos) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese nombres y apellidos del co-comprador.' });
            return;
        }

        if (!telefono) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un teléfono para el co-comprador.' });
            return;
        }

        const resumenCoComprador = {
            ...coCompradorDraft,
            nombres,
            apellidos,
            telefono,
            nombreCompleto: `${nombres} ${apellidos}`.trim(),
            detalleDocumento: `${coCompradorDraft.tipoDocumento || 'DNI'}: ${(coCompradorDraft.numeroDocumento || '').trim() || 'N/A'}`
        };

        setCoCompradorSeleccionado(resumenCoComprador);
        setMostrarCoComprador(true);
        setCoCompradorModalVisible(false);
    };

    useEffect(() => {
        if (pendingLoteId && lotesOptions.length > 0) {
            const encontrado = lotesOptions.find((item) => item?.id === pendingLoteId);
            if (encontrado) {
                setLoteSeleccionado(encontrado);
                syncLoteUbicacion(encontrado);
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

    const syncLoteUbicacion = (lote) => {
        const manzana = lote?.manzana || null;
        const etapa = manzana?.etapa || null;
        const urbanizacion = etapa?.urbanizacion || null;
        setUrbanizacionSeleccionada(urbanizacion);
        setEtapaSeleccionada(etapa);
        setManzanaSeleccionada(manzana);
    };

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
                ClienteService.listar(axiosInstance),
                LoteService.listar(axiosInstance),
                VendedorService.listar(axiosInstance)
            ]);
            setClientes(resClientes || []); setLotes(resLotes || []); setVendedores(resVendedores || []);
            await cargarDepartamentos();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar datos base.' });
        }
    };

    const onLoteChange = (lote) => {
        setLoteSeleccionado(lote);
        syncLoteUbicacion(lote);
        if (lote && lote.precioVenta !== undefined && lote.precioVenta !== null) {
            setLotePrecio(lote.precioVenta);
        } else {
            setLotePrecio(0);
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
                    return new Date(b.fechaCotizacion || b.createdAt || 0).getTime() - new Date(a.fechaCotizacion || a.createdAt || 0).getTime();
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
                    estadoCivil: interesado.estadoCivil || clienteExistente?.estadoCivil || '',
                    telefono: interesado.telefono || clienteExistente?.telefono || '',
                    email: interesado.email || clienteExistente?.email || '',
                    departamento: dep, provincia: prov, distrito: dist, ubigeo: ubig,
                    direccion: interesado.direccion || clienteExistente?.direccion || ''
                }));
                setDni(documento);

                if (dep) {
                    await cargarProvincias(dep);
                    if (prov) await cargarDistritos(dep, prov);
                }

                if (seleccionada.vendedor?.id) {
                    const vendedorEncontrado = vendedoresOptions.find((item) => item?.id === seleccionada.vendedor.id);
                    if (vendedorEncontrado) setVendedorSeleccionado(vendedorEncontrado);
                    else setPendingVendedorId(seleccionada.vendedor.id);
                }

                if (seleccionada.lote?.id) {
                    const loteEncontrado = lotesOptions.find((item) => item?.id === seleccionada.lote.id);
                    if (loteEncontrado) {
                        setLoteSeleccionado(loteEncontrado);
                        syncLoteUbicacion(loteEncontrado);
                        if (loteEncontrado.precioVenta != null) {
                            setLotePrecio(loteEncontrado.precioVenta);
                        }
                    } else {
                        setPendingLoteId(seleccionada.lote.id);
                        if (seleccionada.precioTotal != null) {
                            setLotePrecio(seleccionada.precioTotal);
                        }
                    }
                }

                const coCompradorId = seleccionada.coComprador?.id || seleccionada.coCompradorId || null;
                if (coCompradorId) {
                    const coCompradorEncontrado = (clientes || []).find((item) => item?.id === coCompradorId);
                    if (coCompradorEncontrado) {
                        setCoCompradorSeleccionado(coCompradorEncontrado);
                    } else if (seleccionada.coComprador) {
                        setCoCompradorSeleccionado({
                            ...seleccionada.coComprador,
                            nombreCompleto: `${seleccionada.coComprador.nombres || ''} ${seleccionada.coComprador.apellidos || ''}`.trim(),
                            detalleDocumento: `${seleccionada.coComprador.tipoDocumento || 'DNI'}: ${seleccionada.coComprador.numeroDocumento || 'N/A'}`
                        });
                    }
                    setMostrarCoComprador(true);
                } else {
                    setCoCompradorSeleccionado(null);
                    setMostrarCoComprador(false);
                }

                const inicialCargada = seleccionada.montoInicialAcordado ?? 500;
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

                if (seleccionada.fechaInicioPago) setFechaInicio(new Date(seleccionada.fechaInicioPago));

                setTimeout(() => {
                    simular();
                }, 300);

                toast.current?.show({ severity: 'success', summary: 'Cotización encontrada', detail: 'Datos cargados.' });
                return;
            }

            if (clienteExistente) {
                setCliente(clienteExistente);
                setDni(clienteExistente.numeroDocumento || documento);
                setCoCompradorSeleccionado(null);
                setMostrarCoComprador(false);
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
            const apellidos = data.apellidos || `${apellidoPaterno} ${apellidoMaterno}`.trim();
            setCliente({
                id: undefined,
                numeroDocumento: documento,
                tipoDocumento: 'DNI',
                nombres,
                apellidos,
                estadoCivil: '',
                telefono: '',
                email: '',
                direccion: ''
            });
            setDni(documento);
            setCoCompradorSeleccionado(null);
            setMostrarCoComprador(false);
            toast.current?.show({ severity: 'success', summary: 'Encontrado', detail: 'Cliente cargado desde RENIEC.' });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error en la búsqueda.' });
        }
    };

    // ==========================================
    // SIMULACIÓN VÍA BACKEND
    // ==========================================
    const simular = async () => {
        if (!tipoInicial) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un Tipo de Inicial.' });
            return;
        }
        if (saldoAFinanciar <= 0 || cuotas <= 0) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Revise el saldo a financiar y las cuotas.' });
            return;
        }

        try {
            const abonoEf = tipoInicial === 'TOTAL' ? inicialAcordada : abonoReal;
            const simulacionRequest = {
                precioTotal: lotePrecio,
                montoInicial: abonoEf,
                cantidadCuotas: cuotas,
                fechaInicioPago: fechaInicio.toISOString().split('T')[0],
                cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: isFlexible ? montoEspecial : 0
            };

            const respuesta = await ContratoService.simular(simulacionRequest, axiosInstance);
            if (Array.isArray(respuesta)) {
                const cuotaInicial = {
                    numero: 0,
                    tipoCuota: 'INICIAL',
                    montoTotal: inicialAcordada,
                    montoPagado: abonoEf,
                    saldoPendiente: Math.max(inicialAcordada - abonoEf, 0),
                    fecha: fechaLimiteInicial.toISOString().split('T')[0],
                    estado: esSeparacion ? 'PAGADO_PARCIAL' : 'PAGADO_TOTAL'
                };

                const cuotasBackend = respuesta.map((item) => {
                    const esEspecial = isFlexible && Number(item.numeroCuota) <= Number(cuotasEspeciales || 0);
                    return {
                        numero: item.numeroCuota,
                        tipoCuota: esEspecial ? 'ESPECIAL' : 'MENSUAL',
                        montoTotal: item.monto,
                        montoPagado: 0,
                        saldoPendiente: item.monto,
                        fecha: item.fechaVencimiento,
                        estado: 'PENDIENTE'
                    };
                });
                setCronograma([cuotaInicial, ...cuotasBackend]);
                setDescripcionGenerada('Simulación completada');
                return;
            }
            if (respuesta && respuesta.cuotas) {
                setCronograma(respuesta.cuotas);
                setDescripcionGenerada(respuesta.descripcion || 'Simulación completada');
                return;
            }
            toast.current.show({ severity: 'warn', summary: 'Respuesta inesperada', detail: 'El servidor no devolvió los datos esperados.' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error en simulación', detail: error.response?.data?.message || 'No se pudo simular el cronograma.' });
        }
    };

    // ==========================================
    // GUARDADO OFICIAL
    // ==========================================
    const guardarCotizacion = async () => {
        if (!loteSeleccionado?.id || !vendedorSeleccionado?.id || cronograma.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Faltan datos', detail: 'Seleccione lote, vendedor y genere la simulación.' });
            return;
        }

        try {
            let idInteresadoFinal = cliente?.interesadoId;
            let coCompradorTemporalId = null;
            const coCompradorConId = coCompradorSeleccionado?.id ? coCompradorSeleccionado : null;
            const coCompradorNuevo = coCompradorSeleccionado && !coCompradorSeleccionado.id ? coCompradorSeleccionado : null;

            if (!idInteresadoFinal) {
                if (!cliente || !cliente.nombres) {
                    toast.current.show({ severity: 'error', summary: 'Falta Prospecto', detail: 'Debe buscar al prospecto por DNI primero.' });
                    return;
                }

                const documentoNormalizado = (cliente.numeroDocumento || dni || '').trim();
                const telefonoNormalizado = (cliente.telefono || '').trim();

                if (documentoNormalizado || telefonoNormalizado) {
                    const interesados = await InteresadoService.listar(axiosInstance);
                    const interesadoExistente = (interesados || []).find((item) => (
                        (documentoNormalizado && (item?.numeroDocumento || '').trim() === documentoNormalizado) ||
                        (telefonoNormalizado && (item?.telefono || '').trim() === telefonoNormalizado)
                    ));
                    if (interesadoExistente?.id) {
                        idInteresadoFinal = interesadoExistente.id;
                    }
                }

                if (!idInteresadoFinal) {
                    if (!telefonoNormalizado) {
                        toast.current.show({ severity: 'warn', summary: 'Telefono requerido', detail: 'Debe registrar un telefono para crear el interesado.' });
                        return;
                    }

                    const nuevoInteresado = {
                        tipoDocumento: cliente.tipoDocumento || 'DNI',
                        numeroDocumento: documentoNormalizado,
                        nombres: cliente.nombres,
                        apellidos: cliente.apellidos || '',
                        estadoCivil: (cliente.estadoCivil || '').trim(),
                        telefono: telefonoNormalizado,
                        email: cliente.email || '',
                        direccion: (cliente.direccion || '').trim(),
                        departamento: cliente.departamento || '',
                        provincia: cliente.provincia || '',
                        distrito: cliente.distrito || '',
                        ubigeo: cliente.ubigeo || ''
                    };

                    const resInt = await InteresadoService.crear(nuevoInteresado, axiosInstance);
                    idInteresadoFinal = resInt?.data?.id || resInt?.id;
                }
            }

            if (coCompradorNuevo) {
                const nombresCo = (coCompradorNuevo.nombres || '').trim();
                const apellidosCo = (coCompradorNuevo.apellidos || '').trim();
                const telefonoCo = (coCompradorNuevo.telefono || '').trim();

                if (!nombresCo || !apellidosCo || !telefonoCo) {
                    toast.current.show({ severity: 'warn', summary: 'Co-comprador incompleto', detail: 'Complete los datos del co-comprador antes de guardar.' });
                    return;
                }

                const nuevoCoComprador = {
                    tipoDocumento: coCompradorNuevo.tipoDocumento || 'DNI',
                    numeroDocumento: (coCompradorNuevo.numeroDocumento || '').trim(),
                    nombres: nombresCo,
                    apellidos: apellidosCo,
                    estadoCivil: (coCompradorNuevo.estadoCivil || '').trim(),
                    telefono: telefonoCo,
                    email: (coCompradorNuevo.email || '').trim(),
                    direccion: (coCompradorNuevo.direccion || '').trim(),
                    departamento: coCompradorNuevo.departamento || '',
                    provincia: coCompradorNuevo.provincia || '',
                    distrito: coCompradorNuevo.distrito || '',
                    ubigeo: coCompradorNuevo.ubigeo || ''
                };

                const resCo = await InteresadoService.crear(nuevoCoComprador, axiosInstance);
                coCompradorTemporalId = resCo?.data?.id || resCo?.id || null;
                if (!coCompradorTemporalId) {
                    throw new Error('No se pudo registrar el co-comprador.');
                }
            }

            const cuotaMensual = cronograma.find((item) => item?.numero !== 0 && item?.tipoCuota !== 'INICIAL');
            const montoCuotaCotizacion = cuotaMensual?.montoTotal ?? (cuotas > 0 ? saldoAFinanciar / cuotas : 0);
            const saldoFinanciar = saldoAFinanciar;

            const cotizacionPayload = {
                loteId: loteSeleccionado.id,
                interesadoId: idInteresadoFinal,
                coCompradorId: coCompradorConId?.id || coCompradorTemporalId || null,
                vendedorId: vendedorSeleccionado.id,
                tipoInicial: tipoInicial,
                precioTotal: lotePrecio,
                montoInicialAcordado: inicialAcordada,
                cantidadCuotas: cuotas,
                fechaInicioPago: fechaInicio.toISOString().split('T')[0],
                cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: isFlexible ? montoEspecial : 0,
                cuotasFlexibles: isFlexible,
                diasValidez: 7,
                montoCuotaCotizacion: montoCuotaCotizacion,
                saldoFinanciar: saldoFinanciar
            };

            try {
                await CotizacionService.crear(cotizacionPayload, axiosInstance);
            } catch (cotizacionError) {
                if (coCompradorTemporalId) {
                    await InteresadoService.eliminar(coCompradorTemporalId, axiosInstance).catch(() => null);
                }
                throw cotizacionError;
            }
            toast.current.show({ severity: 'success', summary: '¡Éxito!', detail: 'Cotización guardada correctamente.' });
            setCronograma([]);
            setObservacion('');
            setCoCompradorSeleccionado(null);
            setCoCompradorDraft(crearCoCompradorVacio());
            setMostrarCoComprador(false);
            setCoCompradorModalVisible(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la cotización.' });
        }
    };

    // ==========================================
    // TEMPLATES VISUALES
    // ==========================================
    const loteOptionTemplate = (option) => {
        return (
            <div className="flex justify-content-between align-items-center w-full border-bottom-1 surface-border py-2 px-1">
                <div>
                    <div className="font-bold text-700 text-lg">{option.descripcion || `Lote ${option.numero}`}</div>
                    <div className="text-sm text-500 mt-1">
                        <i className="pi pi-expand mr-1 text-blue-500"></i>{option.area || 0} m²
                    </div>
                </div>
                <div className="text-right">
                    <span className="font-bold text-blue-600 block text-lg">
                        S/ {(option.precioVenta || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <Tag severity="success" value="Disponible" className="text-xs mt-1" />
                </div>
            </div>
        );
    };

    const loteSelectedTemplate = (option, props) => {
        if (option) {
            return (
                <div className="flex align-items-center font-bold text-blue-800">
                    <i className="pi pi-map-marker mr-2"></i>
                    {option.descripcion || `Lote ${option.numero}`}
                </div>
            );
        }
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
                    {rowData.saldoPendiente > 0 && (
                        <span className="text-xs text-orange-600">Debe: S/ {rowData.saldoPendiente.toLocaleString()}</span>
                    )}
                </div>
            );
        }
        return <span className="font-bold">S/ {rowData.montoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>;
    };

    // MEJORA 2: Template visual para la columna "Tipo" para resaltar la cuota Especial
    const tipoTemplate = (rowData) => {
        if (rowData.tipoCuota === 'ESPECIAL') {
            return (
                <span className="text-orange-600 font-bold flex align-items-center">
                    <i className="pi pi-star-fill mr-1 text-xs"></i> ESPECIAL
                </span>
            );
        }
        return <span>{rowData.tipoCuota}</span>;
    }

    const renderContenido = () => (
        <div className="grid mt-3 align-items-stretch">
            
            {/* PANEL IZQUIERDO: PROSPECTO E INMUEBLE */}
            <div className="col-12 xl:col-6 flex">
                <div className="custom-card mb-4 w-full flex flex-column">
                    <div className="card-header">
                        <i className="pi pi-user text-primary"></i>
                        <span className="font-bold text-lg ml-2">Datos del Prospecto e Inmueble</span>
                    </div>
                    
                    <div className="p-fluid mt-3 flex-grow-1 flex flex-column justify-content-between">
                        <div>
                            {/* --- DATOS DEL CLIENTE CON PLACEHOLDERS --- */}
                            <div className="p-fluid grid">
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-sm">Tipo Documento</label>
                                    <Dropdown
                                        value={cliente?.tipoDocumento || 'DNI'}
                                        options={[ { label: 'DNI', value: 'DNI' }, { label: 'CE', value: 'CE' }, { label: 'RUC', value: 'RUC' } ]}
                                        onChange={(e) => setCliente((prev) => ({ ...(prev || {}), tipoDocumento: e.value, numeroDocumento: '' }))}
                                        placeholder="Seleccione tipo"
                                    />
                                </div>

                                <div className="field col-12 md:col-8">
                                    <label className="font-medium text-sm">Documento</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            value={cliente?.numeroDocumento || dni}
                                            onChange={(e) => {
                                                setDni(e.target.value);
                                                setCliente((prev) => ({ ...(prev || {}), numeroDocumento: e.target.value }));
                                            }}
                                            placeholder="Ej: 72384732"
                                        />
                                        <Button icon="pi pi-search" onClick={buscarCliente} className="btn-primary-custom" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-fluid grid">
                                <div className="field col-12 md:col-6">
                                    <label className="font-medium text-sm">Nombres</label>
                                    <InputText value={cliente?.nombres || ''} onChange={(e) => setCliente((prev) => ({ ...(prev || {}), nombres: e.target.value }))} placeholder="Ej. Juan Carlos" />
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label className="font-medium text-sm">Apellidos</label>
                                    <InputText value={cliente?.apellidos || ''} onChange={(e) => setCliente((prev) => ({ ...(prev || {}), apellidos: e.target.value }))} placeholder="Ej. Pérez Silva" />
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label className="font-medium text-sm">Estado Civil</label>
                                    <Dropdown
                                        value={cliente?.estadoCivil || ''}
                                        options={estadoCivilOptions}
                                        onChange={(e) => setCliente((prev) => ({ ...(prev || {}), estadoCivil: e.value }))}
                                        placeholder="Seleccione estado civil"
                                        showClear
                                    />
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label className="font-medium text-sm">Teléfono</label>
                                    <InputText value={cliente?.telefono || ''} onChange={(e) => setCliente((prev) => ({ ...(prev || {}), telefono: e.target.value }))} placeholder="Ej. 987654321" />
                                </div>
                                <div className="field col-12 ">
                                    <label className="font-medium text-sm">Correo</label>
                                    <InputText value={cliente?.email || ''} onChange={(e) => setCliente((prev) => ({ ...(prev || {}), email: e.target.value }))} placeholder="ejemplo@correo.com" />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-sm">Departamento</label>
                                    <Dropdown value={cliente?.departamento || ''} options={departamentos} onChange={(e) => onDepartamentoChange(e.value)} placeholder="Seleccione dep." />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-sm">Provincia</label>
                                    <Dropdown value={cliente?.provincia || ''} options={provincias} onChange={(e) => onProvinciaChange(e.value)} placeholder="Seleccione prov." disabled={!cliente?.departamento} />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-sm">Distrito</label>
                                    <Dropdown value={cliente?.distrito || ''} options={distritos} onChange={(e) => onDistritoChange(e.value)} placeholder="Seleccione dist." disabled={!cliente?.provincia} />
                                </div>
                                <div className="field col-12">
                                    <label className="font-medium text-sm">Dirección</label>
                                    <InputText value={cliente?.direccion || ''} onChange={(e) => setCliente((prev) => ({...(prev || {}), direccion: e.target.value}))} placeholder="Ej. Av. Los Libertadores 123" />
                                </div>
                                <div className="field col-12">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <label className="font-medium text-sm mb-0">Co-comprador (Opcional)</label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                icon="pi pi-plus"
                                                label="Nuevo"
                                                className="p-button-text p-button-sm"
                                                onClick={abrirModalCoComprador}
                                            />
                                            {(coCompradorSeleccionado?.id || coCompradorSeleccionado?.nombreCompleto) && (
                                                <Button
                                                    type="button"
                                                    icon="pi pi-times"
                                                    label="Limpiar"
                                                    className="p-button-text p-button-sm"
                                                    onClick={() => {
                                                        setCoCompradorSeleccionado(null);
                                                        setMostrarCoComprador(false);
                                                        setCoCompradorDraft(crearCoCompradorVacio());
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {mostrarCoComprador && coCompradorSeleccionado && !coCompradorSeleccionado.id && (
                                        <div className="mb-2 p-3 border-1 border-dashed border-300 border-round surface-50">
                                            <div className="text-sm font-bold text-700 mb-1">
                                                {coCompradorSeleccionado?.nombreCompleto || 'Co-comprador nuevo'}
                                            </div>
                                            <div className="text-xs text-500">
                                                {coCompradorSeleccionado?.detalleDocumento || 'Borrador local pendiente de guardar.'}
                                            </div>
                                        </div>
                                    )}
                                    {mostrarCoComprador && (
                                        <Dropdown
                                            value={coCompradorSeleccionado?.id ? coCompradorSeleccionado : null}
                                            options={coCompradoresOptions}
                                            onChange={(e) => {
                                                setCoCompradorSeleccionado(e.value);
                                                setCoCompradorDraft(crearCoCompradorVacio());
                                            }}
                                            optionLabel="nombreCompleto"
                                            placeholder="Seleccione co-comprador existente"
                                            showClear
                                            filter
                                            filterBy="nombreCompleto,numeroDocumento"
                                            disabled={coCompradoresOptions.length === 0}
                                            itemTemplate={(option) => (
                                                <div className="flex flex-column">
                                                    <span className="font-medium">{option.nombreCompleto || 'Sin nombre'}</span>
                                                    <small className="text-500">{option.detalleDocumento}</small>
                                                </div>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            <Divider align="left">
                                <span className="p-tag p-tag-rounded p-tag-secondary px-3">Ubicación del Lote</span>
                            </Divider>

                            {/* --- FILTROS DE LOTE --- */}
                            <div className="p-fluid grid">
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-sm">Urbanización</label>
                                    <Dropdown
                                        value={urbanizacionSeleccionada}
                                        options={urbanizacionesOptions}
                                        onChange={(e) => {
                                            setUrbanizacionSeleccionada(e.value);
                                            setEtapaSeleccionada(null);
                                            setManzanaSeleccionada(null);
                                            setLoteSeleccionado(null);
                                        }}
                                        placeholder="Seleccione Proyecto"
                                    />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-sm">Etapa</label>
                                    <Dropdown
                                        value={etapaSeleccionada}
                                        options={etapasOptions}
                                        onChange={(e) => {
                                            setEtapaSeleccionada(e.value);
                                            setManzanaSeleccionada(null);
                                            setLoteSeleccionado(null);
                                        }}
                                        placeholder="Seleccione Etapa"
                                        disabled={!urbanizacionSeleccionada}
                                    />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="font-medium text-sm">Manzana</label>
                                    <Dropdown
                                        value={manzanaSeleccionada}
                                        options={manzanasOptions}
                                        onChange={(e) => {
                                            setManzanaSeleccionada(e.value);
                                            setLoteSeleccionado(null);
                                        }}
                                        placeholder="Seleccione Mz."
                                        disabled={!etapaSeleccionada}
                                    />
                                </div>
                            </div>

                            {/* --- LISTA VISUAL DE LOTES --- */}
                            {manzanaSeleccionada && (
                                <div className="field mt-3 fade-in">
                                    <label className="font-bold text-blue-800 block mb-2">
                                        <i className="pi pi-list mr-2"></i>Lotes Disponibles en la {manzanaSeleccionada.nombre || 'Manzana'}
                                    </label>
                                    {lotesFiltradosOptions.length === 0 ? (
                                        <div className="p-3 border-round border-1 border-dashed surface-border text-center text-500">
                                            No hay lotes disponibles en esta manzana.
                                        </div>
                                    ) : (
                                        <div className="lotes-list-container custom-scrollbar">
                                            {lotesFiltradosOptions.map((loteOpt) => (
                                                <div 
                                                    key={loteOpt.id} 
                                                    className={`lote-item-card ${loteSeleccionado?.id === loteOpt.id ? 'selected' : ''}`}
                                                    onClick={() => onLoteChange(loteOpt)}
                                                >
                                                    <div className="lote-item-info">
                                                        <span className="lote-item-title">Lote {loteOpt.numero}</span>
                                                        <span className="lote-item-area"><i className="pi pi-expand mr-1"></i>{loteOpt.area || 0} m²</span>
                                                    </div>
                                                    <div className="lote-item-price">
                                                        <span className="price-tag">S/ {(loteOpt.precioVenta || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                        <i className={`pi ${loteSeleccionado?.id === loteOpt.id ? 'pi-check-circle text-blue-600' : 'pi-circle text-400'} ml-3 text-xl`}></i>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="field mt-3 mb-0 pt-3 border-top-1 surface-border">
                            <label className="font-medium text-sm">Vendedor Asignado</label>
                            <Dropdown value={vendedorSeleccionado} options={vendedoresOptions} onChange={(e) => setVendedorSeleccionado(e.value)} optionLabel="nombreCompleto" placeholder="Seleccione Asesor Comercial" />
                        </div>
                    </div>
                </div>
            </div>

            {/* PANEL DERECHO: FINANCIAMIENTO */}
            <div className="col-12 xl:col-6 flex">
                <div className="custom-card mb-4 w-full flex flex-column">
                    <div className="card-header mb-3">
                        <i className="pi pi-wallet text-primary"></i>
                        <span className="font-bold text-lg ml-2">Configuración de Financiamiento</span>
                    </div>

                    {/* Tarjeta de Resumen Visual del Lote */}
                    {loteSeleccionado ? (
                        <div className="bg-green-50 border-1 border-green-200 border-round p-3 mb-4 fade-in flex justify-content-between align-items-center">
                            <div>
                                <span className="text-green-800 font-bold block mb-1">Área: {loteSeleccionado.area || '-'} m²</span>
                                <span className="text-green-600 text-sm"><i className="pi pi-map-marker mr-1"></i>{loteSeleccionado.descripcion}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-500 uppercase block">Precio Oficial</span>
                                <span className="text-xl font-black text-green-700">S/ {(loteSeleccionado.precioVenta || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 mb-4 border-round surface-100 text-500 flex align-items-center border-1 surface-border">
                            <i className="pi pi-info-circle mr-2 text-xl"></i>
                            <span className="text-sm">Seleccione un lote en el panel izquierdo para ver sus detalles y configurar el financiamiento.</span>
                        </div>
                    )}

                    {/* 1. Precio e Inicial */}
                    <div className="custom-card mb-4">
                        <div className="card-header justify-content-between border-bottom-1 border-300 pb-2">
                            <div className="flex align-items-center">
                                <i className="pi pi-tag text-800"></i>
                                <span className="font-bold text-lg ml-2 text-800">Precio a Tratar e Inicial</span>
                            </div>
                        </div>

                        <div className="p-fluid grid mt-3">
                            <div className="field col-12 md:col-6">
                                <label className="font-medium text-sm">Precio a Tratar (S/)</label>
                                <InputNumber value={lotePrecio} onValueChange={(e) => setLotePrecio(e.value)} mode="currency" currency="PEN" placeholder="Ej: 50000" />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-medium text-sm">Inicial Acordada (S/)</label>
                                <InputNumber value={inicialAcordada} onValueChange={(e) => setInicialAcordada(e.value)} mode="currency" currency="PEN" className="input-highlight" placeholder="Ej: 500" />
                            </div>
                        </div>

                        <div className="mt-2 bg-white p-3 border-round border-1 border-blue-200">
                            <div className="flex align-items-center justify-content-between">
                                <span className="text-sm text-600">Detalle de monto a financiar</span>
                                <span className="font-bold text-blue-700">S/ {saldoAFinanciar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. La Cuota 0 (Inicial y Separación) con fondos Dinámicos */}
                    <div className={`custom-card mb-4 transition-colors transition-duration-300 ${bgCuotaCero}`}>
                        <div className="card-header justify-content-between border-bottom-1 border-300 pb-2">
                            <div className="flex align-items-center">
                                <i className="pi pi-wallet text-800"></i>
                                <span className="font-bold text-lg ml-2 text-800">Cuota 0 — Inicial</span>
                            </div>
                            <div className="flex align-items-center gap-2">
                                {tipoInicial === 'PARCIAL' && esSeparacion && <Tag severity="warning" value="SEPARACIÓN" />}
                                {tipoInicial === 'PARCIAL' && !esSeparacion && <Tag severity="success" value="VENTA FINAL" />}
                                {tipoInicial === 'TOTAL' && <Tag severity="success" value="INICIAL COMPLETA" />}
                            </div>
                        </div>

                        <div className="p-4">

                                <label className="font-medium text-sm block mb-2 text-800"><i className="pi pi-tag mr-2"></i>Seleccione Intención de Compra:</label>
                            

                            <SelectButton
                                value={tipoInicial}
                                onChange={(e) => e.value && setTipoInicial(e.value)}
                                options={[
                                    { label: '⚡ Abono Parcial', value: 'PARCIAL' },
                                    { label: '✅ Pago Total', value: 'TOTAL' }
                                ]}
                                className="w-full mb-4"
                            />

                            {tipoInicial === 'PARCIAL' && (
                                <div className="grid fade-in">
                                    <div className="col-12 md:col-6">
                                        <label className="font-bold text-xs uppercase text-orange-900">Abono Hoy (S/)</label>
                                        <InputNumber value={abonoReal} onValueChange={(e) => setAbonoReal(e.value)} mode="currency" currency="PEN" className="input-highlight-orange" />
                                    </div>
                                    {esSeparacion && (
                                        <div className="col-12 md:col-6">
                                            <label className="font-bold text-xs uppercase text-orange-900">Fecha Límite (Resto)</label>
                                            <Calendar value={fechaLimiteInicial} onChange={(e) => setFechaLimiteInicial(e.value)} dateFormat="dd/mm/yy" showIcon className="w-full" />
                                        </div>
                                    )}
                                    <div className="col-12 mt-2">
                                        <div className="bg-white p-2 border-round border-1 border-orange-200 flex align-items-center text-sm shadow-1">
                                            <i className="pi pi-exclamation-triangle text-orange-500 mr-2"></i>
                                            <span className="font-bold text-orange-800 font-size-5">Faltan S/ {faltaPagarInicial.toLocaleString()}</span>
                                        </div>
                                    </div>
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

                    <Divider />

                    <div className="p-fluid grid">
                        <div className="field col-12 md:col-6">
                            <label className="font-medium text-sm"><i className="pi pi-sort-numeric-up mr-2 text-primary"></i>Cantidad de Cuotas (Meses)</label>
                            <InputNumber value={cuotas} onValueChange={(e) => setCuotas(e.value)} showButtons min={1} max={120} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-medium text-sm"><i className="pi pi-calendar-plus mr-2 text-primary"></i>Día Fijo de Pago Mensual</label>
                            <Calendar value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon />
                        </div>
                    </div>

                    <div className="flex align-items-center mb-3">
                        <Checkbox inputId="flexible" checked={isFlexible} onChange={e => setIsFlexible(e.checked)} />
                        <label htmlFor="flexible" className="ml-2 font-medium text-sm text-700 cursor-pointer">Simulación Especial (Cuotas Mixtas)</label>
                    </div>

                    {isFlexible && (
                        <div className="p-fluid grid flexible-box fade-in">
                            <div className="field col-12 md:col-6 mb-0">
                                <label className="text-xs font-bold text-orange-800 uppercase">Primeras N Cuotas Fijas</label>
                                <InputNumber value={cuotasEspeciales} onValueChange={(e) => setCuotasEspeciales(e.value)} placeholder="Ej: 3" />
                            </div>
                            <div className="field col-12 md:col-6 mb-0">
                                <label className="text-xs font-bold text-orange-800 uppercase">Monto Especial Fijo (S/)</label>
                                <InputNumber value={montoEspecial} onValueChange={(e) => setMontoEspecial(e.value)} mode="currency" currency="PEN" placeholder="Ej: 1000" />
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <Button label="Simular Cronograma Oficial" icon="pi pi-cog" className="w-full btn-primary-custom p-button-lg shadow-3 border-round-xl" onClick={simular} />
                    </div>
                </div>
            </div>

            {/* Proyeccion financiera (Ocupa el 100% de la grilla inferior) */}
            <div className="col-12">
                <div className="custom-card h-full flex flex-column bg-gray-50 border-none">
                    <div className="card-header flex justify-content-between align-items-center mb-4 bg-white p-3 border-round shadow-1">
                        <div>
                            <i className="pi pi-check-square text-green-500 text-xl"></i>
                            <span className="font-bold text-xl ml-2 text-800">Proyección Financiera</span>
                        </div>
                        {cronograma.length > 0 && (
                            <Button label="Guardar Cotización" icon="pi pi-save" className="p-button-outlined p-button-lg border-round-xl font-bold" onClick={guardarCotizacion} />
                        )}
                    </div>

                    {cronograma.length === 0 ? (
                        <div className="flex-grow-1 flex flex-column align-items-center justify-content-center text-400 p-5 bg-white border-round border-1 border-gray-200">
                            <i className="pi pi-file-o text-7xl mb-4 opacity-20"></i>
                            <p className="m-0 text-xl font-medium">Cotización no generada</p>
                            <p className="m-0 mt-2">Configure los datos y simule para generar el cronograma.</p>
                        </div>
                    ) : (
                        <div className="flex-grow-1 flex flex-column fade-in">
                            <div className="bg-white p-4 border-round border-1 border-blue-100 shadow-1 mb-4 border-left-3 border-blue-500">
                                <h4 className="m-0 mb-2 text-blue-800 font-bold text-sm uppercase">Descripción del sistema:</h4>
                                <p className="m-0 text-700 italic">"{descripcionGenerada}"</p>
                            </div>

                            {/* MEJORA 1: Resumen con Precio Total y Saldo a Financiar */}
                            <div className="grid mb-4">
                                <div className="col-12 md:col-3">
                                    <div className="summary-box bg-white h-full">
                                        <span className="summary-title">Estado Proyectado</span>
                                        <span className={`font-bold ${esSeparacion ? 'text-orange-600' : 'text-green-600'}`}>
                                            {esSeparacion ? 'SEPARADO' : 'VENDIDO'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-12 md:col-3">
                                    <div className="summary-box bg-white h-full">
                                        <span className="summary-title text-blue-600">Precio Total Inmueble</span>
                                        <span className="summary-value text-blue-800">S/ {(lotePrecio).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
                            </div>

                            <div className="bg-white border-round shadow-1 overflow-hidden">
                                <DataTable value={cronograma} scrollable scrollHeight="500px" className="p-datatable-sm custom-table" 
                                    rowClassName={(data) => ({ 
                                        'bg-blue-50 font-bold': data.numero === 0,
                                        'bg-orange-50 font-bold': data.tipoCuota === 'ESPECIAL' // Resalta toda la fila de la cuota especial
                                    })}>
                                    <Column field="numero" header="N°" style={{ width: '8%' }} body={(r) => r.numero === 0 ? '0' : r.numero}></Column>
                                    
                                    {/* MEJORA 2: Template para destacar visualmente el Tipo "ESPECIAL" */}
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
        </div>
    );

    const contenido = renderContenido();

    return (
        <div className="contrato-page cotizacion-page">
            <Toast ref={toast} />
            <Dialog
                visible={coCompradorModalVisible}
                style={{ width: '800px', maxWidth: '95vw' }}
                header={
                    <DialogHeader
                        title="Nuevo Co-comprador"
                        subtitle="Registrar un nuevo co-comprador para la cotización"
                        icon="pi pi-users"
                    />
                }
                modal
                className="p-fluid custom-profile-dialog"
                footer={(
                    <div className="dialog-footer-buttons">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={cerrarModalCoComprador} />
                        <Button label="Guardar borrador" icon="pi pi-check" onClick={guardarCoCompradorDraft} autoFocus />
                    </div>
                )}
                onHide={cerrarModalCoComprador}
            >
                <div className="formgrid grid dialog-content-specific pt-2">
                    {/* Tipo de documento */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="tipoDocumentoCo">Tipo Documento</label>
                        <Dropdown
                            id="tipoDocumentoCo"
                            value={coCompradorDraft.tipoDocumento || 'DNI'}
                            options={[
                                { label: 'DNI', value: 'DNI' },
                                { label: 'Carnet de Extranjeria', value: 'CE' },
                                { label: 'RUC', value: 'RUC' }
                            ]}
                            onChange={(e) => setCoCompradorDraft((prev) => ({ ...prev, tipoDocumento: e.value, numeroDocumento: '' }))}
                            placeholder="Seleccione tipo"
                            className="w-full"
                        />
                    </div>

                    {/* N° de documento + RENIEC */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="numeroDocumentoCo">Documento</label>
                        <div className="p-inputgroup">
                            <InputText
                                id="numeroDocumentoCo"
                                value={coCompradorDraft.numeroDocumento}
                                onChange={(e) => {
                                    const val = e.target.value || '';
                                    const filtered = filtrarDocumento(val, coCompradorDraft.tipoDocumento || 'DNI');
                                    setCoCompradorDraft((prev) => ({ ...prev, numeroDocumento: filtered }));
                                }}
                                keyfilter="pint"
                                maxLength={maxLengthDocumento(coCompradorDraft.tipoDocumento)}
                                placeholder={placeholderDocumento(coCompradorDraft.tipoDocumento)}
                            />
                            <Button icon="pi pi-search" className="p-button-outlined" type="button" onClick={buscarDniCoComprador} />
                        </div>
                    </div>

                    {/* Nombres */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="nombresCo">Nombres</label>
                        <InputText
                            id="nombresCo"
                            value={coCompradorDraft.nombres}
                            onChange={(e) => setCoCompradorDraft((prev) => ({ ...prev, nombres: e.target.value }))}
                            placeholder="Ingrese nombres"
                        />
                    </div>

                    {/* Apellidos */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="apellidosCo">Apellidos</label>
                        <InputText
                            id="apellidosCo"
                            value={coCompradorDraft.apellidos}
                            onChange={(e) => setCoCompradorDraft((prev) => ({ ...prev, apellidos: e.target.value }))}
                            placeholder="Ingrese apellidos"
                        />
                    </div>

                    {/* Email */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="emailCo">Correo Electrónico</label>
                        <InputText
                            id="emailCo"
                            value={coCompradorDraft.email}
                            onChange={(e) => setCoCompradorDraft((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="ejemplo@correo.com"
                        />
                    </div>

                    {/* Teléfono */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="telefonoCo">Teléfono</label>
                        <InputText
                            id="telefonoCo"
                            value={coCompradorDraft.telefono}
                            onChange={(e) => setCoCompradorDraft((prev) => ({ ...prev, telefono: e.target.value }))}
                            placeholder="Ingrese teléfono"
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="estadoCivilCo">Estado Civil</label>
                        <Dropdown
                            id="estadoCivilCo"
                            value={coCompradorDraft.estadoCivil || ''}
                            options={estadoCivilOptions}
                            onChange={(e) => setCoCompradorDraft((prev) => ({ ...prev, estadoCivil: e.value }))}
                            placeholder="Seleccione estado civil"
                            className="w-full"
                            showClear
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="direccionCo">Dirección</label>
                        <InputText
                            id="direccionCo"
                            value={coCompradorDraft.direccion || ''}
                            onChange={(e) => setCoCompradorDraft((prev) => ({ ...prev, direccion: e.target.value }))}
                            placeholder="Ingrese dirección"
                        />
                    </div>

                    {/* Departamento */}
                    <div className="field col-12 md:col-4">
                        <label htmlFor="departamentoCo">Departamento</label>
                        <Dropdown
                            id="departamentoCo"
                            value={coCompradorDraft.departamento}
                            options={departamentos}
                            onChange={(e) => onDepartamentoCoChange(e.value)}
                            placeholder="Seleccione dep."
                            className="w-full"
                            filter
                            filterPlaceholder="Buscar"
                            showClear
                        />
                    </div>

                    {/* Provincia */}
                    <div className="field col-12 md:col-4">
                        <label htmlFor="provinciaCo">Provincia</label>
                        <Dropdown
                            id="provinciaCo"
                            value={coCompradorDraft.provincia}
                            options={provinciasCo}
                            onChange={(e) => onProvinciaCoChange(e.value)}
                            placeholder="Seleccione prov."
                            className="w-full"
                            filter
                            filterPlaceholder="Buscar"
                            showClear
                            disabled={!coCompradorDraft.departamento}
                        />
                    </div>

                    {/* Distrito */}
                    <div className="field col-12 md:col-4">
                        <label htmlFor="distritoCo">Distrito</label>
                        <Dropdown
                            id="distritoCo"
                            value={coCompradorDraft.distrito}
                            options={distritosCo}
                            onChange={(e) => onDistritoCoChange(e.value)}
                            placeholder="Seleccione dist."
                            className="w-full"
                            filter
                            filterPlaceholder="Buscar"
                            showClear
                            disabled={!coCompradorDraft.provincia}
                        />
                    </div>
                </div>
            </Dialog>
            {!embedded && (
                <PageHeader
                    title="Gestión Comercial"
                    description="Nuevo registro de cotización y simulación."
                    icon="pi pi-briefcase"
                />
            )}

            {embedded ? contenido : <div className="main-content">{contenido}</div>}
        </div>
    );
};

export default Cotizacion;