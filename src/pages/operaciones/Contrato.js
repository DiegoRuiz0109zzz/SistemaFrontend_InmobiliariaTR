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
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ClienteService } from '../../service/ClienteService';
import { VendedorService } from '../../service/VendedorService';
import { LoteService } from '../../service/LoteService';
import { ReniecService } from '../../service/ReniecService';
import { ContratoService } from '../../service/ContratoService';
import { CotizacionService } from '../../service/CotizacionService';
import { UbigeoService } from '../../service/UbigeoService';

import './Contrato.css';

const Contrato = () => {
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
    const [fechaLimiteInicial, setFechaLimiteInicial] = useState(new Date(new Date().setDate(new Date().getDate() + 15))); // +15 días por defecto
    const [fechaRegistro, setFechaRegistro] = useState(new Date()); // Fecha de registro/contrato
    
    // Parámetros del Cronograma (1 a N)
    const [cuotas, setCuotas] = useState(36);
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    
    // Parámetros Flexibles (Cuotas Especiales)
    const [isFlexible, setIsFlexible] = useState(false);
    const [cuotasEspeciales, setCuotasEspeciales] = useState(3);
    const [montoEspecial, setMontoEspecial] = useState(1000);

    // Observaciones manuales
    const [observacion, setObservacion] = useState('');

    // Resultados y UI
    const [cronograma, setCronograma] = useState([]);
    const [descripcionGenerada, setDescripcionGenerada] = useState('');

    // Cálculo reactivo para saber si es Separación o Venta
    const esSeparacion = abonoReal < inicialAcordada;
    const faltaPagarInicial = inicialAcordada - abonoReal;

    // ==========================================
    // EFECTOS INICIALES
    // ==========================================
    useEffect(() => {
        cargarDatosBase();
    }, []);

    useEffect(() => {
        if (pendingLoteId && lotes.length > 0) {
            const encontrado = lotes.find((item) => item?.id === pendingLoteId);
            if (encontrado) {
                setLoteSeleccionado(encontrado);
                if (encontrado.precioVenta !== undefined && encontrado.precioVenta !== null) {
                    setLotePrecio(encontrado.precioVenta);
                }
                setPendingLoteId(null);
            }
        }
        if (pendingVendedorId && vendedores.length > 0) {
            const encontrado = vendedores.find((item) => item?.id === pendingVendedorId);
            if (encontrado) {
                setVendedorSeleccionado(encontrado);
                setPendingVendedorId(null);
            }
        }
    }, [pendingLoteId, pendingVendedorId, lotes, vendedores]);

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
            // 1. PRIMERO: Verificamos si esta persona ya existe oficialmente como CLIENTE en la BD
            const listadoClientes = Array.isArray(clientes) ? clientes : [];
            const clienteExistente = listadoClientes.find((item) => item.numeroDocumento === documento);

            // 2. SEGUNDO: Buscamos si tiene Cotizaciones previas
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
                
                setCliente((prev) => ({
                    ...(prev || {}),
                    // 🔥 LA CLAVE QUE SOLUCIONA EL ERROR: 
                    // Solo usar el ID si viene de la tabla Clientes, NUNCA el de Interesados
                    id: clienteExistente?.id || undefined, 
                    numeroDocumento: interesado.numeroDocumento || documento,
                    tipoDocumento: interesado.tipoDocumento || clienteExistente?.tipoDocumento || 'DNI',
                    nombres: interesado.nombres || clienteExistente?.nombres || '',
                    apellidos: interesado.apellidos || clienteExistente?.apellidos || '',
                    telefono: interesado.telefono || clienteExistente?.telefono || '',
                    email: interesado.email || clienteExistente?.email || '',
                    departamento: clienteExistente?.departamento || '',
                    provincia: clienteExistente?.provincia || '',
                    distrito: clienteExistente?.distrito || '',
                    direccion: clienteExistente?.direccion || ''
                }));
                setDni(documento);

                if (seleccionada.vendedor?.id) {
                    const vendedorEncontrado = vendedores.find((item) => item?.id === seleccionada.vendedor.id);
                    if (vendedorEncontrado) {
                        setVendedorSeleccionado(vendedorEncontrado);
                    } else {
                        setPendingVendedorId(seleccionada.vendedor.id);
                    }
                }
                if (seleccionada.lote?.id) {
                    const loteEncontrado = lotes.find((item) => item?.id === seleccionada.lote.id);
                    if (loteEncontrado) {
                        setLoteSeleccionado(loteEncontrado);
                        if (loteEncontrado.precioVenta !== undefined && loteEncontrado.precioVenta !== null) {
                            setLotePrecio(loteEncontrado.precioVenta);
                        }
                    } else {
                        setPendingLoteId(seleccionada.lote.id);
                        if (seleccionada.precioTotal !== undefined && seleccionada.precioTotal !== null) {
                            setLotePrecio(seleccionada.precioTotal);
                        }
                    }
                }
                if (seleccionada.montoInicialAcordado !== undefined && seleccionada.montoInicialAcordado !== null) {
                    setInicialAcordada(seleccionada.montoInicialAcordado);
                }
                if (seleccionada.cantidadCuotas) {
                    setCuotas(seleccionada.cantidadCuotas);
                }
                if (seleccionada.cuotasEspeciales || seleccionada.montoCuotaEspecial) {
                    setIsFlexible(true);
                    setCuotasEspeciales(seleccionada.cuotasEspeciales || 0);
                    setMontoEspecial(seleccionada.montoCuotaEspecial || 0);
                } else {
                    setIsFlexible(false);
                    setCuotasEspeciales(0);
                    setMontoEspecial(0);
                }
                if (seleccionada.fechaCotizacion) {
                    setFechaInicio(new Date(seleccionada.fechaCotizacion));
                }

                toast.current?.show({ severity: 'success', summary: 'Cotización', detail: 'Datos cargados desde la cotización.' });
                return;
            }

            // 3. TERCERO: Si no tiene cotización, pero sí es Cliente Oficial
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

            // 4. CUARTO: Si no es nada, buscar en RENIEC
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
    const simular = () => {
        let saldoFinanciar = lotePrecio - inicialAcordada;
        if (saldoFinanciar <= 0 || cuotas <= 0) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Revise el saldo y cuotas.' });
            return;
        }

        let nuevoCronograma = [];

        // 1. GENERAR CUOTA 0 (INICIAL)
        nuevoCronograma.push({
            numero: 0,
            tipo: 'INICIAL',
            montoTotal: inicialAcordada,
            montoPagado: abonoReal,
            saldoPendiente: faltaPagarInicial > 0 ? faltaPagarInicial : 0,
            fecha: fechaLimiteInicial.toISOString().split('T')[0],
            estado: esSeparacion ? 'SEPARACIÓN' : 'PAGADO'
        });

        // 2. GENERAR CUOTAS REGULARES (1 a N)
        let cuotasNormalesCant = cuotas;
        let saldoNormales = saldoFinanciar;
        let especialesCant = isFlexible ? cuotasEspeciales : 0;
        let especialMonto = isFlexible ? montoEspecial : 0;

        if (isFlexible) {
            saldoNormales = saldoFinanciar - (especialesCant * especialMonto);
            cuotasNormalesCant = cuotas - especialesCant;
        }

        let cuotaBase = cuotasNormalesCant > 0 ? (saldoNormales / cuotasNormalesCant) : 0;
        let baseDate = new Date(fechaInicio);
        let diaPreferido = baseDate.getDate();

        for (let i = 0; i < cuotas; i++) {
            let montoAsignado = (i < especialesCant) ? especialMonto : cuotaBase;

            // Ajuste centavos última cuota
            if (i === cuotas - 1 && cuotasNormalesCant > 0) {
                let totalEspeciales = especialesCant * especialMonto;
                let totalNormales = (Math.round(cuotaBase * 100) / 100) * (cuotasNormalesCant - 1);
                montoAsignado = saldoFinanciar - totalEspeciales - totalNormales;
            }

            let currentMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
            let diaReal = Math.min(diaPreferido, new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate());
            currentMonth.setDate(diaReal);

            nuevoCronograma.push({
                numero: i + 1,
                tipo: 'MENSUAL',
                montoTotal: Math.round(montoAsignado * 100) / 100,
                montoPagado: 0,
                saldoPendiente: Math.round(montoAsignado * 100) / 100,
                fecha: currentMonth.toISOString().split('T')[0],
                estado: 'PENDIENTE'
            });
        }

        setCronograma(nuevoCronograma);

        // Previsualizar la descripción automática que hará el backend
        let desc = `Cuota Inicial de S/ ${inicialAcordada}. `;
        if (isFlexible && especialesCant > 0) {
            desc += `Fraccionado en ${especialesCant} cuotas de S/ ${especialMonto} y ${cuotasNormalesCant} cuotas con el saldo restante.`;
        } else {
            desc += `Fraccionado en ${cuotas} cuotas regulares.`;
        }
        setDescripcionGenerada(desc);
    };

    // ==========================================
    // GUARDADO OFICIAL (Resuelve el null ID)
    // ==========================================
    const guardarContrato = async () => {
        // 1. Validar que tengamos los objetos completos antes de empezar
        if (!loteSeleccionado?.id || !vendedorSeleccionado?.id || cronograma.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Faltan datos', detail: 'Asegúrese de seleccionar el lote, vendedor y generar la simulación.' });
            return;
        }

        try {
            let idClienteFinal = cliente?.id;

            // 2. Si no hay ID de cliente (es un prospecto de Reniec o Cotización), lo registramos primero
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
                    email: cliente.email || ''
                };
                
                // Llamada a tu API real para guardarlo en la base de datos
                const resCliente = await ClienteService.crear(nuevoClientePayload, axiosInstance);
                
                // SOPORTE MULTI-FORMATO: Extraemos el ID sin importar cómo lo devuelva tu configuración de Axios
                idClienteFinal = resCliente?.data?.id || resCliente?.id;
            }

            // 3. Validación de seguridad final (El cortafuegos)
            if (!idClienteFinal) {
                toast.current.show({ severity: 'error', summary: 'Error de ID', detail: 'No se pudo obtener ni generar el ID del cliente.' });
                return;
            }

            // 4. Armamos el payload con la certeza absoluta de que NINGÚN ID ES NULL
            const contratoPayload = {
                loteId: loteSeleccionado.id,
                clienteId: idClienteFinal,  // <-- Aquí viaja el ID real y seguro
                vendedorId: vendedorSeleccionado.id,
                precioTotal: lotePrecio,
                montoInicialAcordado: inicialAcordada,
                abonoInicialReal: abonoReal,
                fechaLimiteInicial: fechaLimiteInicial.toISOString().split('T')[0],
                cantidadCuotas: cuotas,
                fechaInicioPago: fechaInicio.toISOString().split('T')[0],
                cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: isFlexible ? montoEspecial : 0,
                observacion: observacion || '',
                fechaRegistro: new Date(fechaRegistro.getTime() - (fechaRegistro.getTimezoneOffset() * 60000)).toISOString().slice(0, 19)
            };

            // 5. Enviamos el Contrato
            const response = await ContratoService.crear(contratoPayload, axiosInstance);

            toast.current.show({ severity: 'success', summary: '¡Éxito!', detail: 'Contrato emitido y guardado correctamente.' });
            
            // Navegar al detalle de forma segura extrayendo el ID
            setTimeout(() => {
                const idGenerado = response?.id || response?.data?.id;
                if(idGenerado) {
                    navigate(`/detalle_contrato/${idGenerado}`);
                }
            }, 1000);
            
            // Limpiar la pantalla por si el usuario decide regresar
            setCronograma([]);
            setObservacion('');
            
        } catch (error) {
            console.error("Error completo en React:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar. Revisa la consola para más detalles.' });
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

    return (
        <div className="contrato-page">
            <Toast ref={toast} />
            <PageHeader title="Gestión Comercial" subtitle="Emisión de Contratos y Separaciones" icon="pi pi-file-edit" />

            <div className="main-content">
                <div className="grid mt-3">
                            
                            {/* PANEL IZQUIERDO: Configuración */}
                            <div className="col-12 xl:col-5">
                                
                                {/* 1. Entidades */}
                                <div className="custom-card mb-4">
                                    <div className="card-header">
                                        <i className="pi pi-users text-primary"></i>
                                        <span className="font-bold text-lg ml-2">Asignación de Entidades</span>
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
                                            <div className="field col-12 md:col-4">
                                                <label className="font-medium">Departamento</label>
                                                <Dropdown
                                                    value={cliente?.departamento || ''}
                                                    options={departamentos}
                                                    onChange={(e) => onDepartamentoChange(e.value)}
                                                    placeholder="Seleccione"
                                                />
                                            </div>
                                            <div className="field col-12 md:col-4">
                                                <label className="font-medium">Provincia</label>
                                                <Dropdown
                                                    value={cliente?.provincia || ''}
                                                    options={provincias}
                                                    onChange={(e) => onProvinciaChange(e.value)}
                                                    placeholder="Seleccione"
                                                    disabled={!cliente?.departamento}
                                                />
                                            </div>
                                            <div className="field col-12 md:col-4">
                                                <label className="font-medium">Distrito</label>
                                                <Dropdown
                                                    value={cliente?.distrito || ''}
                                                    options={distritos}
                                                    onChange={(e) => onDistritoChange(e.value)}
                                                    placeholder="Seleccione"
                                                    disabled={!cliente?.provincia}
                                                />
                                            </div>
                                            <div className="field col-12">
                                                <label className="font-medium">Dirección</label>
                                                <InputText
                                                    value={cliente?.direccion || ''}
                                                    onChange={(e) => setCliente((prev) => ({
                                                        ...(prev || {}),
                                                        direccion: e.target.value
                                                    }))}
                                                    placeholder="Av. / Jr. / Calle"
                                                />
                                            </div>
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
                                            <label className="font-medium">Fecha de Contrato</label>
                                            <Calendar value={fechaRegistro} onChange={(e) => setFechaRegistro(e.value)} showIcon showTime hourFormat="24" dateFormat="dd/mm/yy" />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. La Cuota 0 (Inicial y Separación) */}
                                <div className={`custom-card mb-4 transition-all ${esSeparacion ? 'border-warning bg-warning-light' : ''}`}>
                                    <div className="card-header justify-content-between">
                                        <div className="flex align-items-center">
                                            <i className="pi pi-wallet text-primary"></i>
                                            <span className="font-bold text-lg ml-2">La Cuota 0 (Inicial)</span>
                                        </div>
                                        {esSeparacion ? (
                                            <Tag severity="warning" value="SEPARACIÓN" icon="pi pi-exclamation-triangle" />
                                        ) : (
                                            <Tag severity="success" value="VENTA FINAL" icon="pi pi-check-circle" />
                                        )}
                                    </div>
                                    <div className="p-fluid grid mt-3">
                                        <div className="field col-12 md:col-4">
                                            <label className="font-medium">Precio Lote</label>
                                            <InputNumber value={lotePrecio} onValueChange={(e) => setLotePrecio(e.value)} mode="currency" currency="PEN" />
                                        </div>
                                        <div className="field col-12 md:col-4">
                                            <label className="font-medium">Inicial Acordada</label>
                                            <InputNumber value={inicialAcordada} onValueChange={(e) => setInicialAcordada(e.value)} mode="currency" currency="PEN" className="input-highlight" />
                                        </div>
                                        <div className="field col-12 md:col-4">
                                            <label className="font-medium text-blue-700">Abono Hoy</label>
                                            <InputNumber value={abonoReal} onValueChange={(e) => setAbonoReal(e.value)} mode="currency" currency="PEN" className="input-highlight-blue" />
                                        </div>
                                        
                                        {esSeparacion && (
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
                                            <span className="font-bold text-xl ml-2 text-800">Proyección del Contrato</span>
                                        </div>
                                        {cronograma.length > 0 && (
                                            <Button label="Guardar Contrato Oficial" icon="pi pi-save" className="btn-success-custom p-button-lg shadow-3 border-round-xl font-bold" onClick={guardarContrato} />
                                        )}
                                    </div>

                                    {cronograma.length === 0 ? (
                                        <div className="flex-grow-1 flex flex-column align-items-center justify-content-center text-400 p-5 bg-white border-round border-1 border-gray-200">
                                            <i className="pi pi-file-o text-7xl mb-4 opacity-20"></i>
                                            <p className="m-0 text-xl font-medium">Contrato no generado</p>
                                            <p className="m-0 mt-2">Haga clic en "Simular y Previsualizar" para ver el cronograma oficial.</p>
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
                                                        <span className="summary-value">S/ {(lotePrecio - inicialAcordada).toLocaleString()}</span>
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
            </div>
        </div>
    );
};

export default Contrato;