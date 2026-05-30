import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import PageHeader from '../../components/ui/PageHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import { useAuth } from '../../context/AuthContext';
import { ContratoService } from '../../service/ContratoService';
import { CuotaService } from '../../service/CuotaService';
import { PagoService } from '../../service/PagoService';
import '../Usuario.css';

const ReportePagos = () => {
    const { axiosInstance } = useAuth();
    const dt = useRef(null);
    const toast = useRef(null);

    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expandedRows, setExpandedRows] = useState(null);
    const [pagosMap, setPagosMap] = useState({}); // { contratoId: [pagos] }
    const [loadingPagos, setLoadingPagos] = useState({}); // { contratoId: boolean }

    const cargarContratos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ContratoService.listar(axiosInstance);
            
            // Format data
            const formatted = (data || []).map(c => ({
                ...c,
                clienteNombre: c.cliente ? `${c.cliente.nombres} ${c.cliente.apellidos}`.trim() : 'N/A',
                loteDescripcion: c.lote ? c.lote.descripcion || (c.lote.numero ? `Lote ${c.lote.numero}` : 'N/A') : 'N/A',
                precioTotal: c.precioTotal || 0
            }));
            
            setContratos(formatted);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los contratos.' });
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarContratos();
    }, [cargarContratos]);

    const onRowExpand = async (e) => {
        const contrato = e.data;
        if (pagosMap[contrato.id]) return; // Already loaded

        setLoadingPagos(prev => ({ ...prev, [contrato.id]: true }));
        try {
            const cuotas = await CuotaService.listarPorContrato(contrato.id, axiosInstance);
            const pagosTotales = [];
            
            await Promise.all((cuotas || []).map(async (cuota) => {
                const pagos = await PagoService.listarPorCuota(cuota.id, axiosInstance);
                if (pagos && pagos.length > 0) {
                    pagos.forEach(p => {
                        pagosTotales.push({
                            ...p,
                            cuotaNumero: cuota.numeroCuota !== undefined ? cuota.numeroCuota : cuota.numero,
                            cuotaId: cuota.id
                        });
                    });
                }
            }));
            
            // Sort by date descending
            pagosTotales.sort((a, b) => new Date(b.fechaPago || 0) - new Date(a.fechaPago || 0));
            
            setPagosMap(prev => ({ ...prev, [contrato.id]: pagosTotales }));
        } catch (error) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: `No se pudieron cargar los pagos del contrato ${contrato.nroContrato}` });
            setPagosMap(prev => ({ ...prev, [contrato.id]: [] }));
        } finally {
            setLoadingPagos(prev => ({ ...prev, [contrato.id]: false }));
        }
    };

    const formatCurrency = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        if (dateString.includes('T')) {
            const d = new Date(dateString);
            if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('es-PE');
        }
        const [anio, mes, dia] = dateString.split('-');
        if(anio && mes && dia) return `${dia}/${mes}/${anio}`;
        return dateString;
    };

    const estadoBodyTemplate = (rowData) => {
        const st = (rowData.estado || rowData.estadoPago || '').toUpperCase();
        let severity = 'info';
        if (st === 'PROCESADO') severity = 'success';
        else if (st === 'PENDIENTE' || st === 'POR_VALIDAR') severity = 'warning';
        else if (st === 'ANULADO') severity = 'danger';
        return <Tag value={st} severity={severity} className="font-bold px-2 py-1" />;
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
            } else if (pago?.id) {
                blob = await PagoService.descargarNotaVenta(pago.id, axiosInstance);
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

    const rowExpansionTemplate = (contrato) => {
        const pagos = pagosMap[contrato.id];
        const isLoading = loadingPagos[contrato.id];

        if (isLoading) {
            return <div className="p-3 text-center text-500"><i className="pi pi-spin pi-spinner mr-2"></i>Cargando pagos efectuados...</div>;
        }

        if (!pagos || pagos.length === 0) {
            return <div className="p-3 text-center text-500">No hay pagos efectuados registrados para este contrato.</div>;
        }

        return (
            <div className="p-3 bg-blue-50 border-round">
                <h5 className="mt-0 mb-3 text-blue-800"><i className="pi pi-history mr-2"></i>Historial de Pagos Efectuados</h5>
                <DataTable value={pagos} responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="Sin pagos">
                    <Column field="id" header="Recibo / Comprobante" body={(r) => (
                        <div className="flex flex-column">
                            <span className="font-bold text-800">{r.numeroComprobante || `REC-${r.id}`}</span>
                        </div>
                    )} style={{width: '15%'}}></Column>
                    <Column field="fechaPago" header="Fecha de Pago" body={(r) => formatDate(r.fechaPago)}></Column>
                    <Column field="cuotaNumero" header="Cuota N°" body={(r) => r.cuotaNumero === 0 ? 'Inicial' : r.cuotaNumero} align="center"></Column>
                    <Column header="Método y Operación" body={(r) => (
                        <div className="flex flex-column">
                            <span>{r.metodoPago}</span>
                            {r.numeroOperacion && <small className="text-500">Op: {r.numeroOperacion}</small>}
                        </div>
                    )}></Column>
                    <Column field="descripcion" header="Descripción" body={(r) => r.descripcion ? <span className="text-sm text-600">{r.descripcion}</span> : '-'}></Column>
                    <Column field="montoAbonado" header="Monto (S/)" body={(r) => <span className="font-bold text-green-700">{formatCurrency(r.montoAbonado)}</span>} align="right"></Column>
                    <Column field="estado" header="Estado" body={estadoBodyTemplate} align="center"></Column>
                    <Column header="Acciones" body={(r) => (
                        <div className="flex align-items-center justify-content-center">
                            {r.numeroComprobante && (
                                <Button
                                    icon="pi pi-file-pdf"
                                    className="p-button-rounded p-button-danger p-button-text"
                                    tooltip={`Descargar ${getEtiquetaComprobante(r.tipoComprobante)}`}
                                    onClick={() => handleDescargarComprobante(r)}
                                />
                            )}
                        </div>
                    )} align="center"></Column>
                </DataTable>
            </div>
        );
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    return (
        <div className="usuario-page reporte-pagos-page">
            <div className="container">
                <PageHeader
                    title="Reporte de Pagos Efectuados"
                    description="Visualiza los contratos y explora el historial de pagos efectuados por cada uno."
                    icon="pi pi-money-bill"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <ActionToolbar
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar por cliente o Nro. de contrato..."
                            extraActions={
                                <Button
                                    icon="pi pi-download"
                                    tooltip="Exportar a Excel (CSV)"
                                    tooltipOptions={{ position: 'bottom' }}
                                    className="btn-export"
                                    onClick={exportCSV}
                                />
                            }
                        />

                        <DataTable
                            ref={dt}
                            value={contratos}
                            expandedRows={expandedRows}
                            onRowToggle={(e) => setExpandedRows(e.data)}
                            onRowExpand={onRowExpand}
                            rowExpansionTemplate={rowExpansionTemplate}
                            dataKey="id"
                            paginator
                            rows={15}
                            loading={loading}
                            globalFilter={globalFilter}
                            globalFilterFields={['nroContrato', 'clienteNombre', 'loteDescripcion']}
                            emptyMessage="No se encontraron contratos."
                            exportFilename="Reporte_Pagos_Efectuados"
                            className="p-datatable-sm shadow-1 border-round-lg overflow-hidden mt-3"
                        >
                            <Column expander style={{ width: '3em' }} />
                            <Column field="nroContrato" header="N° Contrato" sortable body={(r) => <span className="font-bold text-blue-700">{r.nroContrato || `C-${r.id}`}</span>}></Column>
                            <Column field="clienteNombre" header="Cliente" sortable></Column>
                            <Column field="loteDescripcion" header="Inmueble" sortable></Column>
                            <Column field="precioTotal" header="Precio Total" sortable align="right" body={(r) => formatCurrency(r.precioTotal)}></Column>
                            <Column field="estadoContrato" header="Estado Contrato" sortable align="center" body={(r) => <Tag value={r.estadoContrato || r.estado} severity={r.estadoContrato === 'ACTIVO' ? 'success' : 'warning'} />}></Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportePagos;

