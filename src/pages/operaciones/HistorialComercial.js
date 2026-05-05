import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { CotizacionService } from '../../service/CotizacionService';
import { ContratoService } from '../../service/ContratoService';

import './Cotizacion.css';

const TIPO_TODOS = 'TODOS';
const TIPO_COTIZACION = 'COTIZACION';
const TIPO_CONTRATO = 'CONTRATO';

const HistorialComercial = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);
    const navigate = useNavigate();

    const [historial, setHistorial] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState(TIPO_TODOS);
    const [loading, setLoading] = useState(true);

    // Estado para el Modal de Detalle de Cotizacion
    const [cotizacionDetalle, setCotizacionDetalle] = useState(null);

    const tipoOptions = [
        { label: 'Todos', value: TIPO_TODOS },
        { label: 'Cotizaciones', value: TIPO_COTIZACION },
        { label: 'Contratos', value: TIPO_CONTRATO }
    ];

    const toTime = (value) => {
        const time = new Date(value || 0).getTime();
        return Number.isNaN(time) ? 0 : time;
    };

    const buildLoteLabel = (lote) => {
        if (!lote) return 'No asignado';
        if (lote.numero || lote.manzana?.nombre) {
            const manzana = lote.manzana?.nombre ? `Mz ${lote.manzana.nombre}` : '';
            const numero = lote.numero ? `Lote ${lote.numero}` : '';
            return `${manzana}${manzana && numero ? ' - ' : ''}${numero}`.trim();
        }
        return lote.descripcion || 'No asignado';
    };

    const mapCotizacion = (item) => {
        const nombre = `${item?.interesado?.nombres || ''} ${item?.interesado?.apellidos || ''}`.trim();
        return {
            id: item?.id,
            tipo: TIPO_COTIZACION,
            codigo: `Q-${item?.id?.toString().padStart(4, '0')}`,
            clienteNombre: nombre || 'Sin nombre',
            clienteDocumento: item?.interesado?.numeroDocumento || 'N/A',
            loteDescripcion: buildLoteLabel(item?.lote),
            total: item?.precioTotal || 0,
            estado: item?.estado || 'N/A',
            fecha: item?.fechaCotizacion || item?.createdAt || '',
            fechaOrden: toTime(item?.fechaCotizacion || item?.createdAt),
            raw: item
        };
    };

    const mapContrato = (item) => {
        const nombre = `${item?.cliente?.nombres || ''} ${item?.cliente?.apellidos || ''}`.trim();
        const estadoLote = item?.lote?.estadoVenta;
        return {
            id: item?.id,
            tipo: TIPO_CONTRATO,
            codigo: `C-${item?.id?.toString().padStart(4, '0')}`,
            clienteNombre: nombre || 'Sin nombre',
            clienteDocumento: item?.cliente?.numeroDocumento || 'N/A',
            loteDescripcion: buildLoteLabel(item?.lote),
            total: item?.precioTotal || 0,
            estado: estadoLote || 'CONTRATO',
            fecha: item?.fechaRegistro || item?.createdAt || '',
            fechaOrden: toTime(item?.fechaRegistro || item?.createdAt),
            raw: item
        };
    };

    const cargarHistorial = async () => {
        setLoading(true);
        try {
            const [cotizacionesRes, contratosRes] = await Promise.all([
                CotizacionService.listar(axiosInstance),
                ContratoService.listar(axiosInstance)
            ]);

            const cotizaciones = Array.isArray(cotizacionesRes) ? cotizacionesRes : [];
            const contratos = Array.isArray(contratosRes) ? contratosRes : [];

            const combinado = [
                ...cotizaciones.map(mapCotizacion),
                ...contratos.map(mapContrato)
            ].sort((a, b) => b.fechaOrden - a.fechaOrden);

            setHistorial(combinado);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const convertirCotizacion = async (cotizacion) => {
        try {
            await CotizacionService.convertir(cotizacion.id, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Conversion Exitosa', detail: 'Cotizacion convertida a contrato.' });
            setCotizacionDetalle(null);
            cargarHistorial();
            setTimeout(() => {
                navigate('/contrato/nuevo');
            }, 800);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error de Conversion', detail: 'No se pudo convertir la cotizacion.' });
        }
    };

    const filteredHistorial = useMemo(() => {
        if (tipoFiltro === TIPO_TODOS) return historial;
        return historial.filter((item) => item.tipo === tipoFiltro);
    }, [historial, tipoFiltro]);

    const renderHeader = () => {
        return (
            <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
                <div className="flex align-items-center gap-2">
                    <span className="text-sm text-600">Tipo:</span>
                    <SelectButton value={tipoFiltro} options={tipoOptions} onChange={(e) => setTipoFiltro(e.value)} />
                </div>
                <div className="p-inputgroup max-w-20rem">
                    <span className="p-inputgroup-addon"><i className="pi pi-search" /></span>
                    <InputText
                        type="search"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Buscar por cliente o lote..."
                    />
                </div>
                <Button label="Actualizar" icon="pi pi-refresh" className="btn-primary-custom p-button-sm shadow-2 border-round-xl" onClick={cargarHistorial} />
            </div>
        );
    };

    const clienteTemplate = (rowData) => (
        <div>
            <span className="font-bold text-800">{rowData.clienteNombre}</span><br />
            <span className="text-xs text-500">Doc: {rowData.clienteDocumento}</span>
        </div>
    );

    const tipoTemplate = (rowData) => {
        const severity = rowData.tipo === TIPO_CONTRATO ? 'success' : 'info';
        const label = rowData.tipo === TIPO_CONTRATO ? 'CONTRATO' : 'COTIZACION';
        return <Tag severity={severity} value={label} />;
    };

    const estadoCotizacionTemplate = (rowData) => {
        if (rowData.estado === 'VIGENTE') return <Tag severity="success" value="VIGENTE" icon="pi pi-check" />;
        if (rowData.estado === 'EXPIRADA') return <Tag severity="danger" value="EXPIRADA" icon="pi pi-times" />;
        if (rowData.estado === 'CONVERTIDA_A_CONTRATO') return <Tag severity="info" value="CONVERTIDA" icon="pi pi-file" />;
        return <Tag value={rowData.estado} />;
    };

    const estadoTemplate = (rowData) => {
        if (rowData.tipo === TIPO_COTIZACION) return estadoCotizacionTemplate(rowData.raw || {});
        const estado = rowData.estado || 'CONTRATO';
        const severity = estado === 'VENDIDO' ? 'success' : estado === 'SEPARADO' ? 'warning' : 'info';
        return <Tag severity={severity} value={estado} />;
    };

    const abrirDetalle = (rowData) => {
        if (rowData.tipo === TIPO_COTIZACION) {
            setCotizacionDetalle(rowData.raw || null);
            return;
        }
        if (rowData.id != null) navigate(`/detalle_contrato/${rowData.id}`);
    };

    const editarRegistro = (rowData) => {
        if (!rowData) return;
        toast.current?.show({ severity: 'info', summary: 'Edicion', detail: 'Funcion en desarrollo.' });
    };

    const accionesTemplate = (rowData) => (
        <div className="flex gap-2 justify-content-center">
            <Button
                label="Detalle"
                icon="pi pi-eye"
                className="btn-primary-custom p-button-sm font-bold shadow-2 border-round-xl"
                onClick={() => abrirDetalle(rowData)}
            />
            <Button
                label="Editar"
                icon="pi pi-pencil"
                className="p-button-outlined p-button-sm border-round-xl"
                onClick={() => editarRegistro(rowData)}
            />
        </div>
    );

    const renderFooterModal = () => {
        return (
            <div className="flex justify-content-between align-items-center mt-3 pt-3 border-top-1 surface-border">
                <span className="text-500 text-sm">
                    {cotizacionDetalle?.estado === 'VIGENTE'
                        ? `Valida hasta: ${cotizacionDetalle?.fechaValidez}`
                        : 'Esta cotizacion ya no puede ser procesada.'}
                </span>
                <div>
                    <Button label="Cerrar" icon="pi pi-times" onClick={() => setCotizacionDetalle(null)} className="p-button-text text-600 hover:text-800 transition-colors mr-2 border-round-xl" />
                    <Button
                        label="Convertir a Contrato"
                        icon="pi pi-file-edit"
                        className="btn-success-custom shadow-3 border-round-xl px-4 py-2 font-bold"
                        disabled={cotizacionDetalle?.estado !== 'VIGENTE'}
                        onClick={() => convertirCotizacion(cotizacionDetalle)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="cotizacion-page">
            <Toast ref={toast} />
            <PageHeader title="Historial Comercial" subtitle="Cotizaciones y contratos en un solo listado" icon="pi pi-history" />

            <div className="main-content">
                <div className="card surface-card border-round shadow-1 p-0 overflow-hidden mt-3">
                    <DataTable
                        value={filteredHistorial}
                        paginator
                        rows={10}
                        header={renderHeader()}
                        globalFilter={globalFilter}
                        globalFilterFields={['clienteDocumento', 'clienteNombre', 'loteDescripcion', 'codigo', 'tipo']}
                        loading={loading}
                        emptyMessage="No se encontraron registros."
                        className="p-datatable-sm custom-master-table"
                        stripedRows
                    >
                        <Column field="codigo" header="N Doc" style={{ minWidth: '110px', fontWeight: 'bold', color: 'var(--primary-color)' }} />
                        <Column header="Cliente" body={clienteTemplate} style={{ minWidth: '220px' }} />
                        <Column field="loteDescripcion" header="Lote" style={{ minWidth: '180px' }} />
                        <Column header="Total" body={(row) => <span className="font-bold text-700">S/ {row?.total?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>} style={{ minWidth: '120px', textAlign: 'right' }} />
                        <Column header="Tipo" body={tipoTemplate} style={{ minWidth: '120px', textAlign: 'center' }} />
                        <Column header="Estado" body={estadoTemplate} style={{ minWidth: '130px', textAlign: 'center' }} />
                        <Column field="fecha" header="Fecha" style={{ minWidth: '120px', textAlign: 'center' }} />
                        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: '180px', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>

            <Dialog
                header={<><i className="pi pi-file-pdf text-primary mr-2 text-xl"></i> Detalles de Cotizacion N {cotizacionDetalle?.id}</>}
                visible={!!cotizacionDetalle}
                style={{ width: '95vw', maxWidth: '1200px' }}
                footer={renderFooterModal()}
                onHide={() => setCotizacionDetalle(null)}
            >
                {cotizacionDetalle && (
                    <div className="flex flex-column gap-4 pt-2">

                        <div className={`p-4 border-round flex align-items-center justify-content-between ${
                            cotizacionDetalle.estado === 'VIGENTE' ? 'bg-green-50 border-1 border-green-200' :
                            cotizacionDetalle.estado === 'CONVERTIDA_A_CONTRATO' ? 'bg-blue-50 border-1 border-blue-200' :
                            'bg-red-50 border-1 border-red-200'
                        }`}>
                            <div>
                                <span className="font-bold block text-800 text-lg mb-1">Estado de la Oferta</span>
                                <span className="text-md text-700">Generada el <strong>{cotizacionDetalle.fechaCotizacion}</strong> por el vendedor <strong>{cotizacionDetalle.vendedor?.nombres}</strong></span>
                            </div>
                            <div className="text-xl">
                                {estadoCotizacionTemplate(cotizacionDetalle)}
                            </div>
                        </div>

                        <div className="grid">
                            <div className="col-12 lg:col-4">
                                <div className="p-4 surface-50 border-round h-full border-1 surface-border shadow-1">
                                    <div className="text-sm font-bold text-500 uppercase tracking-wide mb-4 flex align-items-center border-bottom-1 surface-border pb-2">
                                        <i className="pi pi-user mr-2 text-primary text-xl"></i> Datos del Prospecto
                                    </div>
                                    <h3 className="m-0 text-2xl font-bold text-800 mb-4">{cotizacionDetalle.interesado?.nombres} <br /> {cotizacionDetalle.interesado?.apellidos}</h3>
                                    <div className="text-700 text-base flex flex-column gap-3">
                                        <div className="flex align-items-center"><i className="pi pi-id-card mr-3 text-500 text-xl"></i> <span><strong>{cotizacionDetalle.interesado?.tipoDocumento}:</strong> <br /> {cotizacionDetalle.interesado?.numeroDocumento}</span></div>
                                        <div className="flex align-items-center"><i className="pi pi-phone mr-3 text-500 text-xl"></i> <span><strong>Telefono:</strong> <br /> {cotizacionDetalle.interesado?.telefono || 'No registrado'}</span></div>
                                        <div className="flex align-items-center"><i className="pi pi-envelope mr-3 text-500 text-xl"></i> <span className="word-break"><strong>Correo:</strong> <br /> {cotizacionDetalle.interesado?.email || 'No registrado'}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 lg:col-4">
                                <div className="p-4 surface-0 border-round h-full border-2 border-green-200 shadow-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <i className="pi pi-map text-8xl text-green-500"></i>
                                    </div>
                                    <div className="text-sm font-bold text-green-600 uppercase tracking-wide mb-4 flex align-items-center border-bottom-1 border-green-100 pb-2 relative z-1">
                                        <i className="pi pi-map-marker mr-2 text-xl"></i> Lote Cotizado
                                    </div>

                                    <div className="bg-green-50 border-round p-4 text-center mb-4 relative z-1 border-1 border-green-100">
                                        <div className="text-5xl font-extrabold text-green-700 mb-2">
                                            {cotizacionDetalle.lote?.numero ? `Lote ${cotizacionDetalle.lote.numero}` : (cotizacionDetalle.lote?.descripcion || 'Lote N/A')}
                                        </div>
                                        {cotizacionDetalle.lote?.manzana?.nombre && (
                                            <div className="text-2xl font-bold text-green-600">Mz. {cotizacionDetalle.lote.manzana.nombre}</div>
                                        )}
                                    </div>

                                    <ul className="list-none p-0 m-0 text-700 text-lg relative z-1">
                                        <li className="flex justify-content-between mb-3 pb-3 border-bottom-1 surface-border">
                                            <span className="font-semibold text-500"><i className="pi pi-arrows-alt mr-2"></i> Area:</span>
                                            <span className="font-bold">{cotizacionDetalle.lote?.area ? `${cotizacionDetalle.lote.area} m2` : 'N/A'}</span>
                                        </li>
                                        <li className="flex justify-content-between mb-3 pb-3 border-bottom-1 surface-border">
                                            <span className="font-semibold text-500"><i className="pi pi-clone mr-2"></i> Etapa:</span>
                                            <span className="text-right font-semibold text-800">{cotizacionDetalle.lote?.manzana?.etapa?.nombre || 'N/A'}</span>
                                        </li>
                                        <li className="flex justify-content-between">
                                            <span className="font-semibold text-500"><i className="pi pi-home mr-2"></i> Urbanizacion:</span>
                                            <span className="text-right font-semibold text-800">{cotizacionDetalle.lote?.manzana?.etapa?.urbanizacion?.nombre || 'N/A'}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="col-12 lg:col-4">
                                <div className="p-4 surface-50 border-round h-full border-1 surface-border shadow-1">
                                    <div className="text-sm font-bold text-500 uppercase tracking-wide mb-4 flex align-items-center border-bottom-1 surface-border pb-2">
                                        <i className="pi pi-calculator mr-2 text-orange-500 text-xl"></i> Resumen Financiero
                                    </div>

                                    <div className="flex flex-column gap-4">
                                        <div className="surface-0 p-3 border-round border-1 surface-border">
                                            <span className="block text-sm text-600 mb-1">Precio Total Ofertado</span>
                                            <span className="block font-bold text-800 text-3xl">S/ {cotizacionDetalle.precioTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="surface-0 p-3 border-round border-1 surface-border border-left-3 border-primary">
                                            <span className="block text-sm text-600 mb-1">Cuota Inicial Acordada</span>
                                            <span className="block font-bold text-primary text-2xl">S/ {cotizacionDetalle.montoInicialAcordado?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="surface-0 p-3 border-round border-1 surface-border border-left-3 border-orange-500">
                                            <span className="block text-sm text-600 mb-1">Financiamiento Restante</span>
                                            <span className="block font-bold text-orange-600 text-2xl">{cotizacionDetalle.cantidadCuotas} <span className="text-lg">Cuotas Mensuales</span></span>
                                        </div>
                                    </div>

                                    {cotizacionDetalle.cuotasEspeciales > 0 && (
                                        <div className="mt-4 bg-orange-50 p-3 border-round border-1 border-orange-200 text-sm text-orange-800 shadow-1">
                                            <div className="flex align-items-center font-bold mb-2">
                                                <i className="pi pi-star-fill mr-2 text-orange-500 text-lg"></i>
                                                Condicion Especial
                                            </div>
                                            <div>Las primeras <strong>{cotizacionDetalle.cuotasEspeciales} cuotas</strong> seran fijas por un monto de <strong>S/ {cotizacionDetalle.montoCuotaEspecial?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>.</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 p-3 bg-bluegray-50 border-round text-base text-700 text-center border-1 border-bluegray-100 font-medium">
                            <i className="pi pi-info-circle mr-2 text-bluegray-500"></i> Esta cotizacion es valida por <strong>7 dias calendario</strong> a partir de su fecha de emision.
                        </div>

                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default HistorialComercial;
