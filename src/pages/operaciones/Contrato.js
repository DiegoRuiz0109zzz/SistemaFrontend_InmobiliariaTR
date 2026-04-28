import React, { useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { SelectButton } from 'primereact/selectbutton';
import { useAuth } from '../../context/AuthContext';
import { CotizacionService } from '../../service/CotizacionService';
import { ContratoService } from '../../service/ContratoService';
import PageHeader from '../../components/ui/PageHeader';

import './Contrato.css';
const Contrato = ({ embedded = false }) => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    const [criterioBusqueda, setCriterioBusqueda] = useState('');
    const [cotizaciones, setCotizaciones] = useState([]);
    const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
    const [isEditFinanciamiento, setIsEditFinanciamiento] = useState(false);

    const [precioTotal, setPrecioTotal] = useState(0);
    const [montoInicial, setMontoInicial] = useState(0);
    const [cuotas, setCuotas] = useState(36);
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    const [isFlexible, setIsFlexible] = useState(false);
    const [cuotasEspeciales, setCuotasEspeciales] = useState(0);
    const [montoEspecial, setMontoEspecial] = useState(0);
    const [tipoInicial, setTipoInicial] = useState('PARCIAL');
    const [cronograma, setCronograma] = useState([]);

    const cotizacionesOrdenadas = useMemo(() => {
        const base = Array.isArray(cotizaciones) ? [...cotizaciones] : [];
        return base.sort((a, b) => {
            const aDate = new Date(a.fechaCotizacion || a.createdAt || 0).getTime();
            const bDate = new Date(b.fechaCotizacion || b.createdAt || 0).getTime();
            return bDate - aDate;
        });
    }, [cotizaciones]);

    const limpiar = () => {
        setCotizaciones([]);
        setCotizacionSeleccionada(null);
        setCronograma([]);
        setPrecioTotal(0);
        setMontoInicial(0);
        setCuotas(36);
        setFechaInicio(new Date(new Date().setMonth(new Date().getMonth() + 1)));
        setIsFlexible(false);
        setCuotasEspeciales(0);
        setMontoEspecial(0);
        setTipoInicial('PARCIAL');
        setIsEditFinanciamiento(false);
    };

    const cargarFinanciamiento = (cotizacion) => {
        if (!cotizacion) return;
        setPrecioTotal(cotizacion.precioTotal ?? 0);
        setMontoInicial(cotizacion.montoInicialAcordado ?? 0);
        setCuotas(cotizacion.cantidadCuotas || 36);
        setTipoInicial(cotizacion.tipoInicial || 'PARCIAL');
        const flex = !!(cotizacion.cuotasFlexibles || cotizacion.cuotasEspeciales || cotizacion.montoCuotaEspecial);
        setIsFlexible(flex);
        setCuotasEspeciales(cotizacion.cuotasEspeciales || 0);
        setMontoEspecial(cotizacion.montoCuotaEspecial || 0);
        if (cotizacion.fechaInicioPago) {
            setFechaInicio(new Date(cotizacion.fechaInicioPago));
        }
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
                limpiar();
                return;
            }

            setCotizaciones(filtrado);
            const seleccion = [...filtrado].sort((a, b) => {
                const aDate = new Date(a.fechaCotizacion || a.createdAt || 0).getTime();
                const bDate = new Date(b.fechaCotizacion || b.createdAt || 0).getTime();
                return bDate - aDate;
            })[0];
            setCotizacionSeleccionada(seleccion);
            cargarFinanciamiento(seleccion);
            setCronograma([]);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo buscar la cotización.' });
        }
    };

    const simular = async () => {
        const montoInicialEfectivo = tipoInicial === 'CERO' ? 0 : montoInicial;
        const saldoFinanciar = precioTotal - montoInicialEfectivo;
        if (saldoFinanciar <= 0 || cuotas <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Revise el saldo y las cuotas.' });
            return;
        }

        const payload = {
            precioTotal: precioTotal,
            montoInicial: montoInicialEfectivo,
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

    const formatDate = (value) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('es-PE');
    };

    const interesado = cotizacionSeleccionada?.interesado || {};
    const vendedor = cotizacionSeleccionada?.vendedor || {};
    const lote = cotizacionSeleccionada?.lote || {};
    const loteUbicacion = `${lote?.manzana?.etapa?.urbanizacion?.nombre || ''} / ${lote?.manzana?.etapa?.nombre || ''} / Mz ${lote?.manzana?.nombre || ''} - Lote ${lote?.numero || ''}`.trim();

    const contenido = (
        <div className="grid mt-3">
            <div className="col-12 lg:col-4">
                <div className="custom-card mb-4">
                    <div className="card-header">
                        <i className="pi pi-id-card text-primary"></i>
                        <span className="font-bold text-lg ml-2">Buscar Cotización</span>
                    </div>
                    <div className="p-fluid mt-3">
                        <label className="font-medium text-sm mb-2 block">Documento del interesado o N° cotización</label>
                        <div className="p-inputgroup">
                            <InputText
                                value={criterioBusqueda}
                                onChange={(e) => setCriterioBusqueda(e.target.value)}
                                placeholder="Ej: 72384732 o COT-102"
                            />
                            <Button icon="pi pi-search" className="btn-primary-custom" onClick={buscarCotizaciones} />
                            <Button icon="pi pi-times" className="p-button-outlined" onClick={limpiar} />
                        </div>
                    </div>
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
                            onSelectionChange={(e) => {
                                setCotizacionSeleccionada(e.value);
                                cargarFinanciamiento(e.value);
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
                    <div className="custom-card fade-in">
                        <div className="flex justify-content-between align-items-start mb-3">
                            <div>
                                <span className="text-xs font-bold text-500 uppercase">Cotización activa</span>
                                <h3 className="m-0 text-xl font-black text-800">{cotizacionSeleccionada.id || '-'}</h3>
                            </div>
                            <span className="status-badge vigente">{cotizacionSeleccionada.estado || 'VIGENTE'}</span>
                        </div>

                        <div className="info-box mb-3">
                            <div className="font-bold text-800 flex align-items-center">
                                <i className="pi pi-user mr-2 text-primary"></i> {`${interesado.nombres || ''} ${interesado.apellidos || ''}`.trim()}
                            </div>
                            <div className="text-sm text-600 mt-1 ml-4">{loteUbicacion || '-'}</div>
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
            </div>

            <div className="col-12 lg:col-8">
                {!cotizacionSeleccionada ? (
                    <div className="custom-card h-full flex flex-column align-items-center justify-content-center text-400 p-5">
                        <i className="pi pi-file-excel text-7xl mb-4 opacity-30 text-primary"></i>
                        <p className="m-0 text-xl font-medium text-600">Ninguna cotización seleccionada</p>
                        <p className="m-0 mt-2 text-sm">Busque un cliente y seleccione una cotización para continuar.</p>
                    </div>
                ) : (
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <div className="custom-card mb-4">
                                <div className="card-header">
                                    <i className="pi pi-user text-primary"></i>
                                    <span className="font-bold text-lg ml-2">Cliente</span>
                                </div>
                                <div className="mt-3">
                                    <div className="mb-2"><strong>Nombre:</strong> {`${interesado.nombres || ''} ${interesado.apellidos || ''}`.trim()}</div>
                                    <div className="mb-2"><strong>Documento:</strong> {`${interesado.tipoDocumento || 'DNI'} ${interesado.numeroDocumento || ''}`.trim()}</div>
                                    <div className="mb-2"><strong>Teléfono:</strong> {interesado.telefono || '-'}</div>
                                    <div><strong>Correo:</strong> {interesado.email || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-4">
                            <div className="custom-card mb-4">
                                <div className="card-header">
                                    <i className="pi pi-id-card text-primary"></i>
                                    <span className="font-bold text-lg ml-2">Vendedor</span>
                                </div>
                                <div className="mt-3">
                                    <div className="mb-2"><strong>Nombre:</strong> {`${vendedor.nombres || ''} ${vendedor.apellidos || ''}`.trim() || '-'}</div>
                                    <div className="mb-2"><strong>Documento:</strong> {vendedor.numeroDocumento || '-'}</div>
                                    <div><strong>Teléfono:</strong> {vendedor.telefono || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-4">
                            <div className="custom-card mb-4">
                                <div className="card-header">
                                    <i className="pi pi-map-marker text-primary"></i>
                                    <span className="font-bold text-lg ml-2">Lote</span>
                                </div>
                                <div className="mt-3">
                                    <div className="mb-2"><strong>Ubicación:</strong> {loteUbicacion || '-'}</div>
                                    <div className="mb-2"><strong>Área:</strong> {lote.area ? `${lote.area} m2` : '-'}</div>
                                    <div><strong>Precio:</strong> {lote.precioVenta != null ? `S/ ${lote.precioVenta.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="custom-card mb-4">
                                <div className="card-header">
                                    <i className="pi pi-wallet text-primary"></i>
                                    <span className="font-bold text-lg ml-2">Financiamiento</span>
                                </div>

                                <div className="flex justify-content-end mt-2">
                                    <Button
                                        label={isEditFinanciamiento ? 'Bloquear edición' : 'Editar financiamiento'}
                                        icon={isEditFinanciamiento ? 'pi pi-lock' : 'pi pi-pencil'}
                                        className="p-button-outlined"
                                        onClick={() => setIsEditFinanciamiento((prev) => !prev)}
                                    />
                                </div>

                                <div className="p-fluid grid mt-3">
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium">Precio Total (S/)</label>
                                        <InputNumber value={precioTotal} onValueChange={(e) => setPrecioTotal(e.value)} mode="currency" currency="PEN" disabled={!isEditFinanciamiento} />
                                    </div>
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium">Inicial (S/)</label>
                                        <InputNumber value={montoInicial} onValueChange={(e) => setMontoInicial(e.value)} mode="currency" currency="PEN" disabled={!isEditFinanciamiento} />
                                    </div>
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium">N° Cuotas</label>
                                        <InputNumber value={cuotas} onValueChange={(e) => setCuotas(e.value)} showButtons min={1} max={120} disabled={!isEditFinanciamiento} />
                                    </div>
                                    <div className="field col-12 md:col-3">
                                        <label className="font-medium">Inicio Pago</label>
                                        <Calendar value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon disabled={!isEditFinanciamiento} />
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <label className="font-medium block mb-2">Tipo de Inicial</label>
                                    <SelectButton
                                        value={tipoInicial}
                                        onChange={(e) => e.value && setTipoInicial(e.value)}
                                        options={[
                                            { label: 'CERO', value: 'CERO' },
                                            { label: 'PARCIAL', value: 'PARCIAL' },
                                            { label: 'TOTAL', value: 'TOTAL' }
                                        ]}
                                        className="w-full"
                                        disabled={!isEditFinanciamiento}
                                    />
                                </div>

                                <Divider />
                                <div className="flex items-center mb-3">
                                    <Checkbox inputId="flexible" checked={isFlexible} onChange={e => setIsFlexible(e.checked)} disabled={!isEditFinanciamiento} />
                                    <label htmlFor="flexible" className="ml-2 font-medium text-700 cursor-pointer">Cuotas especiales</label>
                                </div>

                                {isFlexible && (
                                    <div className="p-fluid grid flexible-box fade-in">
                                        <div className="field col-12 md:col-6 mb-0">
                                            <label className="text-sm font-bold text-orange-800">Primeras N Cuotas</label>
                                            <InputNumber value={cuotasEspeciales} onValueChange={(e) => setCuotasEspeciales(e.value)} disabled={!isEditFinanciamiento} />
                                        </div>
                                        <div className="field col-12 md:col-6 mb-0">
                                            <label className="text-sm font-bold text-orange-800">Monto Fijo (S/)</label>
                                            <InputNumber value={montoEspecial} onValueChange={(e) => setMontoEspecial(e.value)} mode="currency" currency="PEN" disabled={!isEditFinanciamiento} />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Button label="Simular" icon="pi pi-chart-line" className="btn-primary-custom" onClick={simular} />
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="custom-card">
                                <div className="card-header">
                                    <i className="pi pi-calendar text-primary"></i>
                                    <span className="font-bold text-lg ml-2">Cronograma</span>
                                </div>
                                <div className="mt-3">
                                    {cronograma.length === 0 ? (
                                        <div className="text-500">Sin simulación. Ajuste financiamiento y simule.</div>
                                    ) : (
                                        <DataTable value={cronograma} paginator rows={12} className="p-datatable-sm custom-table">
                                            <Column field="numero" header="N°" style={{ width: '10%' }}></Column>
                                            <Column field="fecha" header="Vencimiento" style={{ width: '40%' }}></Column>
                                            <Column field="monto" header="Monto (S/)" style={{ width: '25%', textAlign: 'right' }} body={(row) => `S/ ${row.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}></Column>
                                        </DataTable>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="contrato-page">
            <Toast ref={toast} />
            {!embedded && (
                <PageHeader
                    title="Contrato desde Cotización"
                    description="Busca al cliente, revisa la cotización y ajusta el financiamiento."
                    icon="pi pi-search"
                />
            )}

            {embedded ? contenido : <div className="main-content">{contenido}</div>}
        </div>
    );
};

export default Contrato;