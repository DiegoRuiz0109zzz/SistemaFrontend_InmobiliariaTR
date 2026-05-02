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
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { SelectButton } from 'primereact/selectbutton';
import PageHeader from '../../components/ui/PageHeader';
import DialogHeader from '../../components/ui/DialogHeader';
import { filtrarDocumento, maxLengthDocumento, placeholderDocumento } from '../../utils/documentoUtils';
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
    const [coCompradorSeleccionado, setCoCompradorSeleccionado] = useState(null);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    
    // Modales de Edición (Cliente / Co-Comprador)
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editModalType, setEditModalType] = useState('CLIENTE');
    const [modalData, setModalData] = useState({});
    const [provinciasModal, setProvinciasModal] = useState([]);
    const [distritosModal, setDistritosModal] = useState([]);

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
            estadoCivil: interesado.estadoCivil || clienteExistente?.estadoCivil || '',
            telefono: interesado.telefono || clienteExistente?.telefono || '',
            email: interesado.email || clienteExistente?.email || '',
            departamento: dep,
            provincia: prov,
            distrito: dist,
            ubigeo: ubig,
            direccion: interesado.direccion || clienteExistente?.direccion || ''
        }));
        setCoCompradorSeleccionado(null);
        if (seleccionada.coComprador) {
            setCoCompradorSeleccionado(seleccionada.coComprador);
        } else if (seleccionada.coCompradorId) {
            const coComEncontrado = clientes.find((item) => item.id === seleccionada.coCompradorId);
            if (coComEncontrado) {
                setCoCompradorSeleccionado(coComEncontrado);
            } else {
                try {
                    const coCompradorDesdeBd = await InteresadoService.obtenerPorId(seleccionada.coCompradorId, axiosInstance);
                    if (coCompradorDesdeBd) setCoCompradorSeleccionado(coCompradorDesdeBd);
                } catch (error) {
                    console.error("Error obteniendo co-comprador por ID", error);
                }
            }
        }

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
                setCoCompradorSeleccionado(null);
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
            setCliente({
                id: undefined,
                numeroDocumento: documento,
                tipoDocumento: 'DNI',
                nombres,
                apellidos: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
                estadoCivil: '',
                telefono: '',
                email: '',
                direccion: ''
            });
            setCoCompradorSeleccionado(null);
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
    // LOGICA DE EDICION Y ELIMINACION CLIENTE/CO-COMPRADOR
    // ==========================================
    const confirmarEliminarCoComprador = () => {
        confirmDialog({
            message: '¿Está seguro de quitar el co-comprador de este contrato?',
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, quitar',
            rejectLabel: 'No',
            acceptClassName: 'p-button-danger',
            accept: () => setCoCompradorSeleccionado(null)
        });
    };

    const guardarModal = () => {
        if (editModalType === 'CLIENTE') {
            setCliente({ ...cliente, ...modalData });
        } else {
            setCoCompradorSeleccionado({ ...coCompradorSeleccionado, ...modalData });
        }
        setDialogVisible(false);
    };

    const abrirModal = async (type) => {
        setEditModalType(type);
        const sourceData = type === 'CLIENTE' ? cliente : coCompradorSeleccionado;
        setModalData({ ...sourceData });
        
        if (sourceData?.departamento) {
            try {
                const resProv = await UbigeoService.listarProvincias(sourceData.departamento, axiosInstance);
                setProvinciasModal(mapTextOptions(resProv));
                if (sourceData.provincia) {
                    const resDist = await UbigeoService.listarDistritos(sourceData.departamento, sourceData.provincia, axiosInstance);
                    setDistritosModal(mapDistritoOptions(resDist));
                }
            } catch(e) {}
        } else {
            setProvinciasModal([]);
            setDistritosModal([]);
        }
        setDialogVisible(true);
    };
    
    const onDepartamentoModalChange = async (value) => {
        setModalData((prev) => ({ ...prev, departamento: value, provincia: '', distrito: '', ubigeo: '' }));
        if (!value) { setProvinciasModal([]); setDistritosModal([]); return; }
        try {
            const res = await UbigeoService.listarProvincias(value, axiosInstance);
            setProvinciasModal(mapTextOptions(res));
        } catch (e) { setProvinciasModal([]); }
        setDistritosModal([]);
    };

    const onProvinciaModalChange = async (value) => {
        setModalData((prev) => ({ ...prev, provincia: value, distrito: '', ubigeo: '' }));
        if (!value || !modalData.departamento) { setDistritosModal([]); return; }
        try {
            const res = await UbigeoService.listarDistritos(modalData.departamento, value, axiosInstance);
            setDistritosModal(mapDistritoOptions(res));
        } catch (e) { setDistritosModal([]); }
    };

    const onDistritoModalChange = (value) => {
        const distritoSelected = distritosModal.find((item) => item.value === value);
        setModalData((prev) => ({ ...prev, distrito: value, ubigeo: distritoSelected?.ubigeo || '' }));
    };

    const buscarDniModal = async () => {
        if (modalData.tipoDocumento && modalData.tipoDocumento !== 'DNI') return;
        const doc = (modalData.numeroDocumento || '').trim();
        if (doc.length !== 8) return;
        try {
            const res = await ReniecService.consultarDNI(doc, axiosInstance);
            if (res?.success) {
                const data = res.data || {};
                const nombres = data.nombres || data.nombre || '';
                const apellidos = data.apellidos || `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();
                setModalData((prev) => ({ ...prev, nombres, apellidos }));
                toast.current?.show({ severity: 'success', summary: 'RENIEC', detail: 'Datos encontrados.' });
            }
        } catch (e) { }
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
            let idClienteFinal = null;
            if (cliente) {
                const clienteExistente = clientes.find(c => c.numeroDocumento === cliente.numeroDocumento);
                if (clienteExistente) {
                    idClienteFinal = clienteExistente.id;
                } else {
                    const nuevoClientePayload = {
                        tipoDocumento: cliente.tipoDocumento || 'DNI',
                        numeroDocumento: cliente.numeroDocumento || dni,
                        nombres: cliente.nombres,
                        apellidos: cliente.apellidos || '',
                        estadoCivil: cliente.estadoCivil || '',
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
            }

            if (!idClienteFinal) {
                toast.current.show({ severity: 'error', summary: 'Error de ID', detail: 'No se pudo obtener el ID del cliente.' });
                return;
            }

            let idCoCompradorFinal = null;
            if (coCompradorSeleccionado) {
                // Verificar si es un Cliente existente o si vino como Interesado
                const coCompradorCliente = clientes.find(c => c.numeroDocumento === coCompradorSeleccionado.numeroDocumento);
                
                if (coCompradorCliente) {
                    idCoCompradorFinal = coCompradorCliente.id;
                } else {
                    const nuevoCoCompradorPayload = {
                        tipoDocumento: coCompradorSeleccionado.tipoDocumento || 'DNI',
                        numeroDocumento: coCompradorSeleccionado.numeroDocumento,
                        nombres: coCompradorSeleccionado.nombres,
                        apellidos: coCompradorSeleccionado.apellidos || '',
                        estadoCivil: coCompradorSeleccionado.estadoCivil || '',
                        telefono: coCompradorSeleccionado.telefono || '',
                        email: coCompradorSeleccionado.email || '',
                        departamento: coCompradorSeleccionado.departamento || '',
                        provincia: coCompradorSeleccionado.provincia || '',
                        distrito: coCompradorSeleccionado.distrito || '',
                        ubigeo: coCompradorSeleccionado.ubigeo || '',
                        direccion: coCompradorSeleccionado.direccion || ''
                    };
                    const resCoComprador = await ClienteService.crear(nuevoCoCompradorPayload, axiosInstance);
                    idCoCompradorFinal = resCoComprador?.data?.id || resCoComprador?.id;
                }
            }

            const contratoPayload = {
                loteId: loteSeleccionado.id,
                clienteId: idClienteFinal,
                coCompradorId: idCoCompradorFinal,
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

                        </div>
                    </div>
                </div>
            </div>

            {/* ====== PANEL DERECHO: FINANCIAMIENTO ====== */}
            {hasCliente && (
                <div className="col-12 xl:col-7 flex">
                    <div className="custom-card mb-4 w-full flex flex-column">
                        <div className="card-header flex justify-content-between align-items-center">
                            <div>
                                <i className={`pi ${!isEditFinanciamiento ? 'pi-file-check' : 'pi-wallet'} text-primary`}></i>
                                <span className="font-bold text-lg ml-2">{!isEditFinanciamiento ? 'Resumen de Contrato' : 'Configuración de Financiamiento'}</span>
                            </div>
                            {isEditFinanciamiento && (
                                <Button 
                                    label="Edición Habilitada" 
                                    icon="pi pi-unlock" 
                                    className="p-button-sm p-button-warning" 
                                />
                            )}
                        </div>

                        <div className="p-fluid grid mt-3">
                            {!isEditFinanciamiento ? (
                                <div className="col-12 fade-in">
                                    {/* 1. SECCIÓN DE COMPRADORES */}
                                    <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">
                                        <i className="pi pi-users mr-2 text-primary"></i>Datos de los Compradores
                                    </h4>
                                    <div className="grid mb-4">
                                        <div className="col-12 md:col-6">
                                            <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full">
                                                <span className="text-xs text-500 uppercase font-bold block mb-1">Titular</span>
                                                <span className="text-lg font-bold text-800 block">{cliente?.nombres} {cliente?.apellidos}</span>
                                                <span className="text-sm text-600"><i className="pi pi-id-card mr-1"></i>{cliente?.numeroDocumento}</span>
                                                {cliente?.telefono && <span className="text-sm text-600 block mt-1"><i className="pi pi-phone mr-1"></i>{cliente.telefono}</span>}
                                            </div>
                                        </div>
                                        {coCompradorSeleccionado && (
                                            <div className="col-12 md:col-6">
                                                <div className="p-3 border-round border-1 border-blue-200 bg-blue-50 shadow-1 h-full">
                                                    <span className="text-xs text-blue-600 uppercase font-bold block mb-1">Co-comprador</span>
                                                    <span className="text-lg font-bold text-blue-900 block">{coCompradorSeleccionado.nombres} {coCompradorSeleccionado.apellidos}</span>
                                                    <span className="text-sm text-blue-700"><i className="pi pi-id-card mr-1"></i>{coCompradorSeleccionado.numeroDocumento}</span>
                                                    {coCompradorSeleccionado.telefono && <span className="text-sm text-blue-700 block mt-1"><i className="pi pi-phone mr-1"></i>{coCompradorSeleccionado.telefono}</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. INMUEBLE Y ASESOR */}
                                    <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">
                                        <i className="pi pi-map-marker mr-2 text-indigo-500"></i>Detalles del Inmueble y Asesor
                                    </h4>
                                    <div className="grid mb-4">
                                        <div className="col-12 md:col-6">
                                            <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full flex flex-column">
                                                <span className="text-xs text-500 uppercase font-bold block mb-1">Inmueble Seleccionado</span>
                                                {loteSeleccionado ? (
                                                    <>
                                                        <span className="text-lg font-bold text-800 block">{`${loteSeleccionado.manzana?.etapa?.urbanizacion?.nombre || ''}`}</span>
                                                        <span className="text-sm text-600 font-medium block mb-2">{`${loteSeleccionado.manzana?.etapa?.nombre || ''} - Mz ${loteSeleccionado.manzana?.nombre || ''} Lt ${loteSeleccionado.numero || ''}`}</span>
                                                        <div className="mt-auto pt-2"><Tag value={`Área: ${loteSeleccionado.area} m²`} severity="info" /></div>
                                                    </>
                                                ) : (
                                                    <span className="text-500 font-italic">Ningún lote seleccionado</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-12 md:col-6">
                                            <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full">
                                                <span className="text-xs text-500 uppercase font-bold block mb-1">Vendedor Asignado</span>
                                                <span className="text-lg font-bold text-800 block">{vendedorSeleccionado ? `${vendedorSeleccionado.nombres} ${vendedorSeleccionado.apellidos}` : 'No asignado'}</span>
                                                {vendedorSeleccionado?.telefono && <span className="text-sm text-600"><i className="pi pi-phone mr-1"></i>{vendedorSeleccionado.telefono}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. FINANCIAMIENTO (Con el botón) */}
                                    <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">
                                        <i className="pi pi-wallet mr-2 text-green-500"></i>Resumen del Financiamiento
                                    </h4>
                                    <div className="bg-blue-50 border-round-xl border-1 border-blue-200 shadow-1 p-4 mb-4">
                                        <div className="grid">
                                            {/* Highlighted core numbers */}
                                            <div className="col-12 md:col-6 mb-3">
                                                <span className="text-xs text-blue-600 uppercase font-bold block mb-1">Saldo a Financiar</span>
                                                <span className="text-3xl font-black text-blue-800">S/ {saldoAFinanciar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="col-12 md:col-6 mb-3">
                                                <span className="text-xs text-green-600 uppercase font-bold block mb-1">Promedio por Cuota ({cuotas})</span>
                                                <span className="text-3xl font-black text-green-700">S/ {cuotaPromedio.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-600">/ mes</span></span>
                                            </div>
                                            
                                            {/* Details row */}
                                            <div className="col-12 md:col-3 mb-2">
                                                <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full text-center">
                                                    <span className="text-xs text-500 uppercase font-bold block mb-1">Precio Inmueble</span>
                                                    <span className="text-lg font-black text-800">S/ {parseFloat(lotePrecio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                            <div className="col-12 md:col-3 mb-2">
                                                <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full text-center">
                                                    <span className="text-xs text-500 uppercase font-bold block mb-1">Inicial Acordada</span>
                                                    <span className="text-lg font-black text-green-700">S/ {parseFloat(inicialAcordada || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                            <div className="col-12 md:col-3 mb-2">
                                                <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full text-center">
                                                    <span className="text-xs text-500 uppercase font-bold block mb-1">Plan de Cuotas</span>
                                                    <span className="text-lg font-black text-800">{cuotas} meses</span>
                                                    {isFlexible && <div className="text-xs text-orange-600 mt-1 font-bold"><i className="pi pi-star-fill text-xs mr-1"></i>Mixtas</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 md:col-3 mb-2">
                                                <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full text-center">
                                                    <span className="text-xs text-500 uppercase font-bold block mb-1">Día de Pago</span>
                                                    <span className="text-lg font-black text-800">{fechaInicio instanceof Date ? fechaInicio.toLocaleDateString('es-PE', { day: '2-digit' }) : '-'}</span>
                                                </div>
                                            </div>
                                            <div className="col-12 mt-2">
                                                <div className={`p-3 border-round border-1 shadow-1 h-full flex flex-column justify-content-center ${bgCuotaCero}`}>
                                                    <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 surface-border pb-2">
                                                        <span className="text-sm text-800 uppercase font-bold">Estado de Inicial (Cuota 0)</span>
                                                        {tipoInicial === 'PARCIAL' && esSeparacion && <Tag severity="warning" value="SEPARACIÓN" />}
                                                        {tipoInicial === 'PARCIAL' && !esSeparacion && <Tag severity="success" value="VENTA FINAL" />}
                                                        {tipoInicial === 'TOTAL' && <Tag severity="success" value="INICIAL COMPLETA" />}
                                                    </div>
                                                    {tipoInicial === 'PARCIAL' ? (
                                                        <div className="flex justify-content-between">
                                                            <div>
                                                                <span className="text-xs text-500 uppercase font-bold block mb-1">Abono Hoy</span>
                                                                <span className="text-xl font-bold text-orange-800">S/ {parseFloat(abonoReal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                            {esSeparacion && (
                                                                <div className="text-right">
                                                                    <span className="text-xs text-500 uppercase font-bold block mb-1">Saldo Pendiente</span>
                                                                    <span className="text-xl font-bold text-red-600">S/ {faltaPagarInicial.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <i className="pi pi-check-circle text-green-500 text-3xl mb-2"></i>
                                                            <span className="text-xl font-black block text-green-800">Pagado al 100%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-column md:flex-row justify-content-end gap-3 pt-4 border-top-1 border-blue-200">
                                            <Button label="Modificar Parámetros" icon="pi pi-sliders-v" className="p-button-outlined p-button-secondary bg-white w-full md:w-auto p-button-lg" onClick={() => setIsEditFinanciamiento(true)} />
                                            <Button label="Generar Contrato Oficial" icon="pi pi-check-circle" className="btn-success-custom p-button-lg shadow-2 font-bold px-5 w-full md:w-auto" disabled={cronograma.length === 0} onClick={guardarContrato} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Edit Participants */}
                                    {cliente && (
                                        <div className="col-12 fade-in mb-4">
                                            <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">Modificar Compradores</h4>
                                            <div className="grid">
                                                {/* Titular */}
                                                <div className="col-12 md:col-6">
                                                    <div className="p-3 border-round border-1 surface-border bg-white shadow-1 h-full">
                                                        <div className="flex justify-content-between align-items-center mb-2">
                                                            <span className="text-xs text-500 uppercase font-bold block">Titular del Contrato</span>
                                                            <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-sm p-0 m-0 w-2rem h-2rem" tooltip="Editar Titular" onClick={() => abrirModal('CLIENTE')} />
                                                        </div>
                                                        <span className="text-lg font-bold text-800 block">{`${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || '-'}</span>
                                                        <span className="text-sm text-600"><i className="pi pi-id-card mr-1"></i>{`${cliente.tipoDocumento || 'DNI'}: ${cliente.numeroDocumento || ''}`}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Co-comprador */}
                                                <div className="col-12 md:col-6">
                                                    {coCompradorSeleccionado ? (
                                                        <div className="p-3 border-round border-1 border-blue-200 bg-blue-50 shadow-1 h-full">
                                                            <div className="flex justify-content-between align-items-center mb-2">
                                                                <span className="text-xs text-blue-600 uppercase font-bold block">Co-comprador</span>
                                                                <div>
                                                                    <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-sm text-blue-600 p-0 m-0 w-2rem h-2rem" tooltip="Editar Co-comprador" onClick={() => abrirModal('COCOMPRADOR')} />
                                                                    <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-sm p-button-danger p-0 m-0 w-2rem h-2rem ml-2" tooltip="Quitar Co-comprador" onClick={confirmarEliminarCoComprador} />
                                                                </div>
                                                            </div>
                                                            <span className="text-lg font-bold text-blue-900 block">{`${coCompradorSeleccionado.nombres || ''} ${coCompradorSeleccionado.apellidos || ''}`.trim() || '-'}</span>
                                                            <span className="text-sm text-blue-700"><i className="pi pi-id-card mr-1"></i>{`${coCompradorSeleccionado.tipoDocumento || 'DNI'}: ${coCompradorSeleccionado.numeroDocumento || ''}`}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 border-round border-1 border-dashed surface-border bg-white shadow-none h-full flex flex-column justify-content-center">
                                                            <label className="text-xs text-500 uppercase font-bold block mb-2">Añadir Co-comprador (Opcional)</label>
                                                            <Dropdown
                                                                value={coCompradorSeleccionado}
                                                                options={coCompradoresOptions}
                                                                onChange={(e) => setCoCompradorSeleccionado(e.value)}
                                                                optionLabel="nombreCompleto"
                                                                placeholder="Seleccione o busque"
                                                                showClear filter filterBy="nombreCompleto,numeroDocumento"
                                                                className="w-full p-inputtext-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Edit Inmueble & Vendedor */}
                                    <div className="col-12 fade-in mb-4">
                                        <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">Modificar Inmueble y Asesor</h4>
                                        <div className="grid">
                                            <div className="col-12 md:col-6">
                                                <label className="text-xs text-500 uppercase font-bold block mb-2">Inmueble Seleccionado</label>
                                                <Dropdown
                                                    value={loteSeleccionado}
                                                    options={lotesOptions}
                                                    onChange={onLoteChange}
                                                    itemTemplate={loteOptionTemplate}
                                                    valueTemplate={loteSelectedTemplate}
                                                    placeholder="Despliegue para cambiar lote"
                                                    className="w-full bg-white"
                                                    panelStyle={{ minWidth: '320px' }}
                                                />
                                                {loteSeleccionado && (
                                                    <div className="mt-2 text-right">
                                                        <span className="text-xs text-500 uppercase font-bold mr-2">Área: {loteSeleccionado.area} m²</span>
                                                        <span className="text-sm font-black text-green-700">Oficial: S/ {loteSeleccionado.precioVenta?.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-12 md:col-6">
                                                <label className="text-xs text-500 uppercase font-bold block mb-2">Vendedor Asignado</label>
                                                <Dropdown 
                                                    value={vendedorSeleccionado} 
                                                    options={vendedoresOptions} 
                                                    onChange={(e) => setVendedorSeleccionado(e.value)} 
                                                    optionLabel="nombreCompleto" 
                                                    placeholder="Seleccione Vendedor"
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1. Generales (Financiamiento) */}
                                    <div className="col-12 fade-in">
                                        <h4 className="text-sm font-bold text-600 mb-3 border-bottom-1 surface-border pb-2">1. Condiciones Generales</h4>
                                        <div className="grid">
                                            <div className="field col-12 md:col-3">
                                                <label className="font-medium text-xs uppercase text-500">Precio a Tratar (S/)</label>
                                                <InputNumber value={lotePrecio} onValueChange={(e) => setLotePrecio(e.value)} mode="currency" currency="PEN" className="font-bold" />
                                            </div>
                                            <div className="field col-12 md:col-3">
                                                <label className="font-medium text-xs uppercase text-500">Inicial Acordada (S/)</label>
                                                <InputNumber value={inicialAcordada} onValueChange={(e) => setInicialAcordada(e.value)} mode="currency" currency="PEN" className="font-bold" />
                                            </div>
                                            <div className="field col-12 md:col-3">
                                                <label className="font-medium text-xs uppercase text-500">N° Cuotas Mensuales</label>
                                                <InputNumber value={cuotas} onValueChange={(e) => setCuotas(e.value)} showButtons min={1} max={120} />
                                            </div>
                                            <div className="field col-12 md:col-3">
                                                <label className="font-medium text-xs uppercase text-500">Día Fijo de Pago</label>
                                                <Calendar value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cuotas Especiales */}
                                    <div className="col-12 mb-4 fade-in">
                                        <div className="bg-slate-50 p-3 border-round border-1 surface-border">
                                            <div className="flex align-items-center">
                                                <Checkbox inputId="flexible" checked={isFlexible} onChange={e => setIsFlexible(e.checked)} />
                                                <label htmlFor="flexible" className="ml-2 font-medium text-sm text-700 cursor-pointer">Simulación Especial (Cuotas Mixtas)</label>
                                            </div>
                                            {isFlexible && (
                                                <div className="grid mt-2 fade-in">
                                                    <div className="field col-6 mb-0">
                                                        <label className="text-xs font-bold text-orange-800 uppercase">Primeras N Cuotas Fijas</label>
                                                        <InputNumber value={cuotasEspeciales} onValueChange={(e) => setCuotasEspeciales(e.value)} />
                                                    </div>
                                                    <div className="field col-6 mb-0">
                                                        <label className="text-xs font-bold text-orange-800 uppercase">Monto Especial Fijo (S/)</label>
                                                        <InputNumber value={montoEspecial} onValueChange={(e) => setMontoEspecial(e.value)} mode="currency" currency="PEN" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Inicial */}
                                    <div className="col-12 fade-in">
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
                                    <div className="col-12 mt-3 fade-in">
                                        <label className="font-medium text-sm block mb-1">Fecha Oficial del Contrato</label>
                                        <Calendar value={fechaRegistro} onChange={(e) => setFechaRegistro(e.value)} showIcon showTime hourFormat="24" dateFormat="dd/mm/yy" />
                                    </div>
                                    
                                    <div className="col-12 mt-4 flex justify-content-between fade-in">
                                        <Button label="Cerrar Edición" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setIsEditFinanciamiento(false)} />
                                        <Button label="Generar / Actualizar Cronograma" icon="pi pi-calculator" className="btn-primary-custom" onClick={simular} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ====== TABLA DE PROYECCIÓN ====== */}
            {hasCliente && isEditFinanciamiento && (
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
            <ConfirmDialog />
            {!embedded && (
                <PageHeader title="Cierre de Venta" description="Ajuste el financiamiento y genere el contrato oficial." icon="pi pi-check-square" />
            )}
            {embedded ? renderContenido() : <div className="main-content">{renderContenido()}</div>}
            
            <Dialog
                visible={dialogVisible}
                style={{ width: '800px', maxWidth: '95vw' }}
                header={
                    <DialogHeader
                        title={editModalType === 'CLIENTE' ? 'Editar Titular' : 'Editar Co-comprador'}
                        subtitle="Modifique los datos de contacto y ubicación"
                        icon={editModalType === 'CLIENTE' ? 'pi pi-user' : 'pi pi-users'}
                    />
                }
                modal
                className="p-fluid custom-profile-dialog"
                footer={(
                    <div className="dialog-footer-buttons">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setDialogVisible(false)} />
                        <Button label="Actualizar" icon="pi pi-check" onClick={guardarModal} autoFocus />
                    </div>
                )}
                onHide={() => setDialogVisible(false)}
            >
                <div className="formgrid grid dialog-content-specific pt-2">
                    {/* Tipo de documento */}
                    <div className="field col-12 md:col-6">
                        <label>Tipo Documento</label>
                        <Dropdown
                            value={modalData.tipoDocumento || 'DNI'}
                            options={[{ label: 'DNI', value: 'DNI' }, { label: 'Carnet de Extranjeria', value: 'CE' }, { label: 'RUC', value: 'RUC' }]}
                            onChange={(e) => setModalData((prev) => ({ ...prev, tipoDocumento: e.value, numeroDocumento: '' }))}
                            placeholder="Seleccione tipo"
                            className="w-full"
                        />
                    </div>

                    {/* N° de documento + RENIEC */}
                    <div className="field col-12 md:col-6">
                        <label>Documento</label>
                        <div className="p-inputgroup">
                            <InputText
                                value={modalData.numeroDocumento || ''}
                                onChange={(e) => {
                                    const val = e.target.value || '';
                                    const filtered = filtrarDocumento(val, modalData.tipoDocumento || 'DNI');
                                    setModalData((prev) => ({ ...prev, numeroDocumento: filtered }));
                                }}
                                keyfilter="pint"
                                maxLength={maxLengthDocumento(modalData.tipoDocumento)}
                                placeholder={placeholderDocumento(modalData.tipoDocumento)}
                            />
                            <Button icon="pi pi-search" className="p-button-outlined" type="button" onClick={buscarDniModal} />
                        </div>
                    </div>

                    {/* Nombres */}
                    <div className="field col-12 md:col-6">
                        <label>Nombres</label>
                        <InputText
                            value={modalData.nombres || ''}
                            onChange={(e) => setModalData((prev) => ({ ...prev, nombres: e.target.value }))}
                            placeholder="Ingrese nombres"
                        />
                    </div>

                    {/* Apellidos */}
                    <div className="field col-12 md:col-6">
                        <label>Apellidos</label>
                        <InputText
                            value={modalData.apellidos || ''}
                            onChange={(e) => setModalData((prev) => ({ ...prev, apellidos: e.target.value }))}
                            placeholder="Ingrese apellidos"
                        />
                    </div>

                    {/* Email */}
                    <div className="field col-12 md:col-6">
                        <label>Correo Electrónico</label>
                        <InputText
                            value={modalData.email || ''}
                            onChange={(e) => setModalData((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="ejemplo@correo.com"
                        />
                    </div>

                    {/* Teléfono */}
                    <div className="field col-12 md:col-6">
                        <label>Teléfono</label>
                        <InputText
                            value={modalData.telefono || ''}
                            onChange={(e) => setModalData((prev) => ({ ...prev, telefono: e.target.value }))}
                            placeholder="Ingrese teléfono"
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Estado Civil</label>
                        <Dropdown
                            value={modalData.estadoCivil || ''}
                            options={estadoCivilOptions}
                            onChange={(e) => setModalData((prev) => ({ ...prev, estadoCivil: e.value }))}
                            placeholder="Seleccione estado civil"
                            className="w-full"
                            showClear
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Dirección</label>
                        <InputText
                            value={modalData.direccion || ''}
                            onChange={(e) => setModalData((prev) => ({ ...prev, direccion: e.target.value }))}
                            placeholder="Ingrese dirección"
                        />
                    </div>

                    {/* Departamento */}
                    <div className="field col-12 md:col-4">
                        <label>Departamento</label>
                        <Dropdown
                            value={modalData.departamento || ''}
                            options={departamentos}
                            onChange={(e) => onDepartamentoModalChange(e.value)}
                            placeholder="Seleccione dep."
                            className="w-full"
                            filter
                            showClear
                        />
                    </div>

                    {/* Provincia */}
                    <div className="field col-12 md:col-4">
                        <label>Provincia</label>
                        <Dropdown
                            value={modalData.provincia || ''}
                            options={provinciasModal}
                            onChange={(e) => onProvinciaModalChange(e.value)}
                            placeholder="Seleccione prov."
                            className="w-full"
                            filter
                            showClear
                            disabled={!modalData.departamento}
                        />
                    </div>

                    {/* Distrito */}
                    <div className="field col-12 md:col-4">
                        <label>Distrito</label>
                        <Dropdown
                            value={modalData.distrito || ''}
                            options={distritosModal}
                            onChange={(e) => onDistritoModalChange(e.value)}
                            placeholder="Seleccione dist."
                            className="w-full"
                            filter
                            showClear
                            disabled={!modalData.provincia}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Contrato;