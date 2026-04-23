import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { CotizacionService } from '../../service/CotizacionService';
import { InteresadoService } from '../../service/InteresadoService';
import { ReniecService } from '../../service/ReniecService';
import { LoteService } from '../../service/LoteService';
import { VendedorService } from '../../service/VendedorService';
import { ContratoService } from '../../service/ContratoService';

import '../Usuario.css';
import './Contrato.css';
import './Cotizacion.css';

const Cotizacion = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    // ==========================================
    // ESTADOS DEL FORMULARIO
    // ==========================================
    const [dni, setDni] = useState('');
    const [interesado, setInteresado] = useState(null);
    
    // Selectores
    const [lotes, setLotes] = useState([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [vendedores, setVendedores] = useState([]);
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);

    // Parámetros Financieros
    const [lotePrecio, setLotePrecio] = useState(0);
    const [inicial, setInicial] = useState(0);
    const [cuotas, setCuotas] = useState(36);
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    
    // Parámetros Flexibles (Cuotas Especiales)
    const [isFlexible, setIsFlexible] = useState(false);
    const [cuotasEspeciales, setCuotasEspeciales] = useState(0);
    const [montoEspecial, setMontoEspecial] = useState(0);

    // Resultados
    const [cronograma, setCronograma] = useState([]);

    // ==========================================
    // EFECTOS (Cargar Datos Iniciales)
    // ==========================================
    useEffect(() => {
        cargarDatosBase();
    }, []);

    const lotesTableRows = useMemo(() =>
        lotes
            .filter((item) => {
                const estado = item.estadoVenta || item.estado;
                return estado && (estado.toUpperCase() === 'DISPONIBLE' || estado.toUpperCase() === 'DISPONIBLES');
            })
            .map((item) => ({
                id: item.id,
                numero: item.numero,
                area: item.area,
                precio: item.precioVenta,
                urbanizacion: item?.manzana?.etapa?.urbanizacion?.nombre || '',
                etapa: item?.manzana?.etapa?.nombre || '',
                manzana: item?.manzana?.nombre || '',
                raw: item
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

    const cargarDatosBase = async () => {
        try {
            const [resLotes, resVendedores] = await Promise.all([
                LoteService.listar(axiosInstance),
                VendedorService.listar(axiosInstance)
            ]);
            setLotes(resLotes || []);
            setVendedores(resVendedores || []);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los lotes/vendedores.' });
        }
    };


    // Actualiza el precio si cambian el lote
    const onLoteChange = (value) => {
        setLoteSeleccionado(value);
        if (value && value.precioVenta !== undefined && value.precioVenta !== null) {
            setLotePrecio(value.precioVenta);
        }
    };

    // ==========================================
    // LÓGICA DE NEGOCIO
    // ==========================================
    const buscarDni = async () => {
        const documento = (interesado?.numeroDocumento || dni || '').trim();
        if (documento.length !== 8) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un DNI válido de 8 dígitos.' });
            return;
        }
        try {
            const interesadosData = await InteresadoService.listar(axiosInstance);
            const listado = Array.isArray(interesadosData) ? interesadosData : interesadosData?.content || [];
            const encontrado = listado.find((item) => item.numeroDocumento === documento);
            if (encontrado) {
                setInteresado(encontrado);
                setDni(encontrado.numeroDocumento || documento);
                toast.current?.show({ severity: 'success', summary: 'Encontrado', detail: 'Prospecto cargado desde el sistema.' });
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
            setInteresado({ numeroDocumento: documento, tipoDocumento: 'DNI', nombres, apellidos, email: '' });
            setDni(documento);
            toast.current?.show({ severity: 'success', summary: 'Encontrado', detail: 'Prospecto cargado desde RENIEC.' });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'No encontrado', detail: 'No se encontraron datos.' });
        }
    };

    const simular = async () => {
        const saldoFinanciar = lotePrecio - inicial;
        if (saldoFinanciar <= 0 || cuotas <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Verifique el saldo y las cuotas.' });
            return;
        }

        const payload = {
            precioTotal: lotePrecio,
            montoInicial: inicial,
            saldoFinanciar,
            cantidadCuotas: cuotas,
            cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
            montoCuotaEspecial: isFlexible ? montoEspecial : 0,
            fechaInicioPago: fechaInicio ? fechaInicio.toISOString().split('T')[0] : null
        };

        try {
            const response = await ContratoService.simular(payload, axiosInstance);
            const listado = response || [];
            const mapped = listado.map((item) => ({
                numero: item.numeroCuota,
                monto: item.monto,
                fecha: item.fechaVencimiento
            }));
            setCronograma(mapped);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Simulación', detail: 'No se pudo simular el cronograma.' });
        }
    };

    // ==========================================
    // GUARDAR COTIZACIÓN (Blindado)
    // ==========================================
    const guardarCotizacion = async () => {
        // 1. Validación estricta con Optional Chaining (?.)
        if (!loteSeleccionado?.id || !vendedorSeleccionado?.id || cronograma.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Faltan datos', detail: 'Seleccione correctamente el lote, vendedor y genere la simulación.' });
            return;
        }

        try {
            let idInteresadoFinal = interesado?.id;

            // 2. Si no tiene ID de Interesado (Vino de Reniec o solo es texto), lo registramos primero
            if (!idInteresadoFinal) {
                if (!interesado || !interesado.nombres) {
                    toast.current.show({ severity: 'error', summary: 'Falta Prospecto', detail: 'Debe buscar al prospecto por DNI primero.' });
                    return;
                }

                const nuevoInteresado = {
                    tipoDocumento: 'DNI', 
                    numeroDocumento: dni,
                    nombres: interesado.nombres,
                    apellidos: interesado.apellidos || '',
                    telefono: interesado.telefono || '', 
                    email: interesado.email || ''
                };
                
                // Llamada a BD
                const resNuevoInt = await InteresadoService.crear(nuevoInteresado);
                
                // ⚠️ EL CORTAFUEGOS (Soporte Multi-formato Axios)
                idInteresadoFinal = resNuevoInt?.data?.id || resNuevoInt?.id;
                
                if (resNuevoInt?.data) {
                    setInteresado(resNuevoInt.data);
                } else if (resNuevoInt) {
                    setInteresado(resNuevoInt);
                }
            }

            // 3. Verificación final para evitar el error de servidor
            if (!idInteresadoFinal) {
                toast.current.show({ severity: 'error', summary: 'Error de ID', detail: 'No se pudo obtener el ID del interesado tras crearlo.' });
                return;
            }

            // 4. Armamos el payload seguro (Ningún ID es nulo)
            const payload = {
                loteId: loteSeleccionado.id,
                interesadoId: idInteresadoFinal, // <-- ID Real garantizado
                vendedorId: vendedorSeleccionado.id,
                precioTotal: lotePrecio,
                montoInicialAcordado: inicial,
                cantidadCuotas: cuotas,
                fechaInicioPago: fechaInicio.toISOString().split('T')[0],
                cuotasEspeciales: isFlexible ? cuotasEspeciales : 0,
                montoCuotaEspecial: isFlexible ? montoEspecial : 0,
                diasValidez: 7
            };

            await CotizacionService.crear(payload);
            
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Cotización guardada correctamente.' });
            
            // Limpiamos el formulario
            setCronograma([]);
            setInteresado(null);
            setDni('');
            
        } catch (error) {
            console.error("Error al guardar cotización:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la cotización. Revise la consola.' });
        }
    };

    // ==========================================
    // TEMPLATES
    // ==========================================
    const currencyTemplate = (rowData) => {
        return `S/ ${rowData.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="cotizacion-page">
            <Toast ref={toast} />
            <PageHeader title="Gestión Comercial" subtitle="Simulador y Generador de Cotizaciones" icon="pi pi-file" />

            <div className="main-content">
                <div className="grid mt-3">
                            
                            {/* PANEL IZQUIERDO: Formulario de Negociación */}
                            <div className="col-12 lg:col-5">
                                
                                {/* Tarjeta 1: Datos del Prospecto */}
                                <div className="custom-card mb-4">
                                    <div className="card-header">
                                        <i className="pi pi-user text-primary"></i>
                                        <span className="font-bold text-lg ml-2">Datos del Prospecto</span>
                                    </div>
                                    
                                    <div className="p-fluid mt-3">
                                        <div className="field">
                                            <label htmlFor="numeroDocumento" className="font-medium">Documento</label>
                                            <div className="p-inputgroup">
                                                <InputText
                                                    id="numeroDocumento"
                                                    value={interesado?.numeroDocumento || dni}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (/^\d{0,8}$/.test(val)) {
                                                            setDni(val);
                                                            setInteresado((prev) => ({
                                                                ...(prev || {}),
                                                                numeroDocumento: val
                                                            }));
                                                        }
                                                    }}
                                                    keyfilter="pint"
                                                    maxLength={8}
                                                    placeholder="Ej: 72384732"
                                                />
                                                <Button icon="pi pi-search" onClick={buscarDni} className="btn-primary-custom" />
                                            </div>
                                        </div>

                                        <div className="p-fluid grid">
                                            <div className="field col-12 md:col-6">
                                                <label htmlFor="tipoDocumento" className="font-medium">Tipo Documento</label>
                                                <Dropdown
                                                    id="tipoDocumento"
                                                    value={interesado?.tipoDocumento || 'DNI'}
                                                    options={[
                                                        { label: 'DNI', value: 'DNI' },
                                                        { label: 'Carnet de Extranjeria', value: 'CE' },
                                                        { label: 'RUC', value: 'RUC' }
                                                    ]}
                                                    onChange={(e) => setInteresado((prev) => ({
                                                        ...(prev || {}),
                                                        tipoDocumento: e.value
                                                    }))}
                                                    placeholder="Seleccione tipo"
                                                />
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label htmlFor="nombres" className="font-medium">Nombres</label>
                                                <InputText
                                                    id="nombres"
                                                    value={interesado?.nombres || ''}
                                                    onChange={(e) => setInteresado((prev) => ({
                                                        ...(prev || {}),
                                                        nombres: e.target.value
                                                    }))}
                                                    placeholder="Ingrese nombres"
                                                />
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label htmlFor="apellidos" className="font-medium">Apellidos</label>
                                                <InputText
                                                    id="apellidos"
                                                    value={interesado?.apellidos || ''}
                                                    onChange={(e) => setInteresado((prev) => ({
                                                        ...(prev || {}),
                                                        apellidos: e.target.value
                                                    }))}
                                                    placeholder="Ingrese apellidos"
                                                />
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label htmlFor="telefono" className="font-medium">Teléfono</label>
                                                <InputText
                                                    id="telefono"
                                                    value={interesado?.telefono || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (/^\d{0,9}$/.test(val)) {
                                                            setInteresado((prev) => ({
                                                                ...(prev || {}),
                                                                telefono: val
                                                            }));
                                                        }
                                                    }}
                                                    keyfilter="pint"
                                                    maxLength={9}
                                                    placeholder="Ej: 987654321"
                                                />
                                            </div>
                                            <div className="field col-12">
                                                <label htmlFor="email" className="font-medium">Correo</label>
                                                <InputText
                                                    id="email"
                                                    value={interesado?.email || ''}
                                                    onChange={(e) => setInteresado((prev) => ({
                                                        ...(prev || {}),
                                                        email: e.target.value
                                                    }))}
                                                    placeholder="correo@ejemplo.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="field">
                                            <label htmlFor="vendedor" className="font-medium">Vendedor Asignado</label>
                                            <Dropdown id="vendedor" value={vendedorSeleccionado} options={vendedoresOptions} onChange={(e) => setVendedorSeleccionado(e.value)} optionLabel="nombreCompleto" placeholder="Seleccione Vendedor" />
                                        </div>
                                    </div>
                                </div>

                                <div className="custom-card mb-4">
                                    <div className="card-header">
                                        <i className="pi pi-map-marker text-primary"></i>
                                        <span className="font-bold text-lg ml-2">Lote a Cotizar</span>
                                    </div>

                                    <div className="p-fluid mt-3">
                                        <DataTable
                                            value={lotesTableRows}
                                            selectionMode="single"
                                            selection={loteSeleccionado}
                                            onSelectionChange={(e) => onLoteChange(e.value?.raw || e.value)}
                                            dataKey="id"
                                            paginator
                                            rows={6}
                                            emptyMessage="No hay lotes disponibles."
                                            className="p-datatable-sm"
                                        >
                                            <Column field="ubicacion" header="Ubicación" style={{ width: '35%' }} body={(row) => `${row.urbanizacion} - ${row.etapa}`} />
                                            <Column field="lote" header="Mza/Lt" style={{ width: '20%' }} body={(row) => `Mz ${row.manzana} - Lt ${row.numero}`} />
                                            <Column field="area" header="Área" style={{ width: '15%' }} body={(row) => `${row.area || ''} m2`} />
                                            <Column field="precio" header="Precio" style={{ width: '30%' }} body={(row) => <span className="font-bold text-green-600">S/ {row.precio?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>} />
                                        </DataTable>
                                    </div>
                                </div>

                                {/* Tarjeta 2: Parámetros Financieros */}
                                <div className="custom-card">
                                    <div className="card-header">
                                        <i className="pi pi-calculator text-primary"></i>
                                        <span className="font-bold text-lg ml-2">Parámetros de Financiamiento</span>
                                    </div>

                                    <div className="p-fluid grid mt-3">
                                        <div className="field col-12 md:col-6">
                                            <label className="font-medium">Precio Total (S/)</label>
                                            <InputNumber value={lotePrecio} onValueChange={(e) => setLotePrecio(e.value)} mode="currency" currency="PEN" locale="es-PE" />
                                        </div>
                                        <div className="field col-12 md:col-6">
                                            <label className="font-medium">Cuota Inicial (S/)</label>
                                            <InputNumber value={inicial} onValueChange={(e) => setInicial(e.value)} mode="currency" currency="PEN" locale="es-PE" className="input-highlight" />
                                        </div>
                                        <div className="field col-12 md:col-6">
                                            <label className="font-medium">N° de Cuotas</label>
                                            <InputNumber value={cuotas} onValueChange={(e) => setCuotas(e.value)} showButtons min={1} max={120} />
                                        </div>
                                        <div className="field col-12 md:col-6">
                                            <label className="font-medium">Día Fijo de Pago</label>
                                            <Calendar value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon />
                                        </div>
                                    </div>

                                    <Divider />

                                    <div className="flex items-center mb-3">
                                        <Checkbox inputId="flexible" checked={isFlexible} onChange={e => setIsFlexible(e.checked)} />
                                        <label htmlFor="flexible" className="ml-2 font-medium text-700 cursor-pointer">Aplicar Cuotas Especiales Fijas</label>
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

                                    <div className="mt-4">
                                        <Button label="Simular Cronograma" icon="pi pi-chart-line" className="btn-primary-custom w-full p-button-lg" onClick={simular} />
                                    </div>
                                </div>

                            </div>

                            {/* PANEL DERECHO: Previsualización de la Simulación */}
                            <div className="col-12 lg:col-7">
                                <div className="custom-card h-full flex flex-column proyeccion-card">
                                    <div className="card-header flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <i className="pi pi-money-bill text-green-500"></i>
                                            <span className="font-bold text-lg ml-2">Proyección Financiera</span>
                                        </div>
                                        {cronograma.length > 0 && (
                                            <Button label="Guardar Cotización" icon="pi pi-save" className="btn-primary-custom p-button-lg" onClick={guardarCotizacion} />
                                        )}
                                    </div>

                                    {cronograma.length === 0 ? (
                                        <div className="flex-grow-1 flex flex-column align-items-center justify-content-center text-500 p-5">
                                            <i className="pi pi-calculator text-6xl mb-3 opacity-30"></i>
                                            <p className="m-0 text-lg">Ajuste los parámetros y haga clic en "Simular"</p>
                                            <p className="m-0 text-sm mt-1">para ver el cronograma de pagos.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-grow-1 flex flex-column fade-in">
                                            {/* Resumen */}
                                            <div className="grid mb-4">
                                                <div className="col-4">
                                                    <div className="summary-box">
                                                        <span className="summary-title">Saldo a Financiar</span>
                                                        <span className="summary-value">S/ {(lotePrecio - inicial).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="summary-box">
                                                        <span className="summary-title">N° Cuotas</span>
                                                        <span className="summary-value">{cuotas}</span>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="summary-box">
                                                        <span className="summary-title">Cuota Base Prom.</span>
                                                        <span className="summary-value">S/ {cronograma[cronograma.length - 1]?.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tabla */}
                                            <div className="proyeccion-tabla">
                                                <DataTable value={cronograma} paginator rows={24} className="p-datatable-sm custom-table" stripedRows>
                                                    <Column field="numero" header="N°" style={{ width: '10%' }}></Column>
                                                    <Column field="fecha" header="Vencimiento" style={{ width: '35%' }} body={(row) => <><i className="pi pi-calendar mr-2 text-400"></i>{row.fecha}</>}></Column>
                                                    <Column field="monto" header="Monto (S/)" body={currencyTemplate} style={{ width: '30%', textAlign: 'right', fontWeight: 'bold' }}></Column>
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

export default Cotizacion;