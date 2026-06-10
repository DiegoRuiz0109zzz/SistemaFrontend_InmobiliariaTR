import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';

import PageHeader from '../../components/ui/PageHeader';
import DialogHeader from '../../components/ui/DialogHeader';
import { useAuth } from '../../context/AuthContext';
import { ComisionService } from '../../service/ComisionService';
import '../Usuario.css';

const ReporteComisiones = () => {
    const { axiosInstance } = useAuth();
    const [comisiones, setComisiones] = useState([]);
    const [filteredComisiones, setFilteredComisiones] = useState(null);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const [fechasGeneracion, setFechasGeneracion] = useState(null);
    const [filters, setFilters] = useState({
        beneficiarioNombre: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedComision, setSelectedComision] = useState(null);
    const [estadoPago, setEstadoPago] = useState('');
    const [observacion, setObservacion] = useState('');

    const toast = useRef(null);
    const dt = useRef(null);

    const estadosPago = [
        { label: 'PENDIENTE', value: 'PENDIENTE' },
        { label: 'PAGADO', value: 'PAGADO' },
        { label: 'ANULADO', value: 'ANULADO' }
    ];

    const cargarComisiones = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ComisionService.listarTodas(axiosInstance);

            // Map data for global filter text searching
            let mappedData = data.map(c => {
                let beneficiarioNombre = '';
                if (c.rolBeneficiario === 'VENDEDOR' && c.vendedor) {
                    beneficiarioNombre = `${c.vendedor.nombres || ''} ${c.vendedor.apellidos || ''}`.trim();
                } else if (c.rolBeneficiario === 'JEFE_VENTAS' && c.jefeVentas) {
                    beneficiarioNombre = `${c.jefeVentas.nombres || ''} ${c.jefeVentas.apellidos || ''}`.trim();
                }

                const ubz = c.contrato?.lote?.manzana?.etapa?.urbanizacion?.nombre || '';
                const numLote = c.contrato?.lote?.numero || '';
                const loteDesc = c.contrato?.lote ? `${ubz} - Lt. ${numLote}`.trim() : '-';

                return {
                    ...c,
                    beneficiarioNombre,
                    contratoCodigo: c.contrato ? `CRT-${c.contrato.id}` : 'N/A',
                    loteDescripcion: loteDesc,
                    clienteNombre: c.contrato?.cliente ? `${c.contrato.cliente.nombres || ''} ${c.contrato.cliente.apellidos || ''}`.trim() : '-',
                    documentoCliente: c.contrato?.cliente?.numeroDocumento || '-',
                    documentoVendedor: c.vendedor?.numeroDocumento || c.jefeVentas?.numeroDocumento || '-',
                    fechaIngreso: c.contrato?.fechaContrato || c.contrato?.fechaRegistro || null,
                    totalAbonado: c.contrato?.montoAbonadoIncial || 0
                };
            });

            const contratoCounts = mappedData.reduce((acc, item) => {
                if (!item.contratoCodigo) return acc;
                acc[item.contratoCodigo] = (acc[item.contratoCodigo] || 0) + 1;
                return acc;
            }, {});

            mappedData = mappedData.map(item => ({
                ...item,
                contratoDuplicado: (contratoCounts[item.contratoCodigo] || 0) > 1
            }));

            // Ordenar por fecha de generacion descendente
            mappedData.sort((a, b) => {
                const fechaA = a?.fechaGeneracion ? new Date(a.fechaGeneracion).getTime() : 0;
                const fechaB = b?.fechaGeneracion ? new Date(b.fechaGeneracion).getTime() : 0;
                return fechaB - fechaA;
            });

            setComisiones(mappedData);
        } catch (error) {
            console.error('Error cargando comisiones', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las comisiones.', life: 3500 });
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarComisiones();
    }, [cargarComisiones]);

    const vendedoresList = useMemo(() => {
        return [...new Set(comisiones.map(c => c.beneficiarioNombre).filter(v => v && v !== '-'))].map(v => ({ label: v, value: v }));
    }, [comisiones]);

    const comisionesFiltradasPorFecha = useMemo(() => {
        if (!fechasGeneracion || (!fechasGeneracion[0] && !fechasGeneracion[1])) return comisiones;

        const [fechaDesde, fechaHasta] = fechasGeneracion;

        return comisiones.filter(c => {
            if (!c.fechaGeneracion) return false;
            const fecha = new Date(c.fechaGeneracion);
            if (isNaN(fecha.getTime())) return false;
            if (fechaDesde) {
                const desde = new Date(fechaDesde);
                desde.setHours(0, 0, 0, 0);
                if (fecha < desde) return false;
            }
            if (fechaHasta) {
                const hasta = new Date(fechaHasta);
                hasta.setHours(23, 59, 59, 999);
                if (fecha > hasta) return false;
            }
            return true;
        });
    }, [comisiones, fechasGeneracion]);

    const onFilterChange = (field, value) => {
        let _filters = { ...filters };
        _filters[field].value = value;
        setFilters(_filters);
    };

    const limpiarFiltros = () => {
        setFechasGeneracion(null);
        setFilters({
            beneficiarioNombre: { value: null, matchMode: FilterMatchMode.EQUALS }
        });
        setGlobalFilter('');
    };

    const openDialog = (comision) => {
        setSelectedComision(comision);
        setEstadoPago(comision.estadoPago || 'PENDIENTE');
        setObservacion(comision.observacionPago || '');
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setSelectedComision(null);
        setEstadoPago('');
        setObservacion('');
    };

    const saveCambioEstado = async () => {
        if (!selectedComision) return;

        setSaving(true);
        try {
            const payload = {
                estadoPago: estadoPago,
                observacionPago: observacion
            };
            await ComisionService.cambiarEstadoPago(selectedComision.id, payload, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Estado de comisión actualizado.', life: 3000 });
            hideDialog();
            cargarComisiones();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Error al actualizar el estado de pago.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    // Formatter functions
    const formatCurrency = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatMonthYear = (dateString) => {
        if (!dateString) return '-';
        const [year, month] = dateString.split('-');
        if (!year || !month) return dateString;
        const date = new Date(year, month - 1, 1);
        const str = date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Body Templates
    const estadoObsBodyTemplate = (rowData) => {
        let severity = 'info';
        switch (rowData.estadoPago) {
            case 'PAGADO':
                severity = 'success';
                break;
            case 'PENDIENTE':
                severity = 'warning';
                break;
            case 'ANULADO':
                severity = 'danger';
                break;
            default:
                break;
        }
        return (
            <div className="flex flex-column gap-1">
                <Tag value={rowData.estadoPago} severity={severity} style={{ width: 'fit-content' }} />
                {rowData.observacionPago && (
                    <span className="text-xs text-500 line-height-2" style={{ maxWidth: '180px', whiteSpace: 'normal', display: 'block' }}>
                        {rowData.observacionPago}
                    </span>
                )}
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="action-buttons">
                <Button
                    icon="pi pi-check-square"
                    className="btn-edit"
                    tooltip="Actualizar Pago"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => openDialog(rowData)}
                />
            </div>
        );
    };

    const renderFooter = () => {
        const dataToSum = filteredComisiones || comisionesFiltradasPorFecha;
        const total = dataToSum.reduce((sum, c) => sum + (c.totalComision || 0), 0);
        return (
            <div className="flex justify-content-between align-items-center">
                <span>Mostrando {dataToSum.length} comisiones.</span>
                {filters.beneficiarioNombre.value ? (
                    <span className="font-bold text-xl">Total Comisión ({filters.beneficiarioNombre.value}): <span className="text-primary">{formatCurrency(total)}</span></span>
                ) : (
                    <span className="font-bold text-xl">Total General de Comisiones: <span className="text-primary">{formatCurrency(total)}</span></span>
                )}
            </div>
        );
    };

    const renderHeader = () => {
        return (
            <div className="flex flex-column gap-3">
                <div style={{ padding: '0.5rem 0 1rem 0' }}>
                    <h3 className="text-lg font-bold mb-4 mt-0" style={{ color: 'var(--text-primary)' }}>Filtros de Búsqueda</h3>
                    <div className="formgrid grid">
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-sm block mb-2 text-700">Rango de Fecha de Activación</label>
                            <Calendar
                                value={fechasGeneracion}
                                onChange={(e) => setFechasGeneracion(e.value)}
                                selectionMode="range"
                                readOnlyInput
                                hideOnRangeSelection
                                dateFormat="dd/mm/yy"
                                placeholder="dd/mm/aaaa - dd/mm/aaaa"
                                showClear
                                showIcon
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-sm block mb-2 text-700">Vendedor / Jefe de Ventas</label>
                            <Dropdown
                                value={filters.beneficiarioNombre.value}
                                options={vendedoresList}
                                onChange={(e) => onFilterChange('beneficiarioNombre', e.value)}
                                placeholder="Seleccione vendedor"
                                showClear
                                filter
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div className="flex align-items-center gap-3">
                        <div className="bg-primary-reverse text-primary border-round px-4 py-2 flex align-items-center gap-2">
                            <i className="pi pi-check-square text-xl" />
                            <div>
                                <span className="block text-sm">Total Mostrados</span>
                                <span className="block font-bold text-xl">{(filteredComisiones || comisionesFiltradasPorFecha).length} comisiones</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <div className="p-input-icon-left" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                            <i className="pi pi-search" style={{ position: 'absolute', left: '0.85rem', zIndex: 1, color: 'var(--theme-primary)', pointerEvents: 'none' }} />
                            <InputText
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                placeholder="Buscar en todos los campos..."
                                style={{ borderRadius: '8px', minWidth: '300px', paddingLeft: '2.5rem' }}
                            />
                        </div>
                        <Button icon="pi pi-filter-slash" className="p-button-outlined p-button-secondary" tooltip="Limpiar todos los filtros" tooltipOptions={{ position: 'bottom' }} onClick={limpiarFiltros} style={{ borderRadius: '8px' }} />
                        <Button icon="pi pi-download" className="btn-export" tooltip="Exportar a CSV" tooltipOptions={{ position: 'bottom' }} onClick={exportCSV} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="usuario-page reporte-comisiones-page">
            <div className="container">
                <PageHeader
                    title="Reporte de Comisiones"
                    description="Visualiza y gestiona las comisiones de vendedores y jefes de ventas."
                    icon="pi pi-percentage"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <DataTable
                            ref={dt}
                            value={comisionesFiltradasPorFecha}
                            onValueChange={(e) => setFilteredComisiones(e)}
                            dataKey="id"
                            paginator
                            rows={15}
                            rowsPerPageOptions={[15, 25, 50]}
                            loading={loading}
                            filters={filters}
                            globalFilter={globalFilter}
                            globalFilterFields={['contratoCodigo', 'beneficiarioNombre', 'rolBeneficiario', 'estadoPago', 'clienteNombre', 'documentoCliente', 'documentoVendedor', 'loteDescripcion']}
                            emptyMessage="No se encontraron comisiones."
                            header={renderHeader()}
                            footer={renderFooter()}
                            sortField="fechaGeneracion"
                            sortOrder={-1}
                            exportFilename="Reporte_Comisiones"
                            rowGroupMode="rowspan"
                            groupRowsBy="contratoCodigo"
                            rowClassName={(rowData) => (rowData.contratoDuplicado ? 'row-contrato-duplicado' : '')}
                        >
                            <Column field="fechaGeneracion" header="Mes de Activación" body={(row) => formatMonthYear(row.fechaGeneracion)} style={{ minWidth: '140px' }} />
                            <Column field="contratoCodigo" header="Contrato" style={{ minWidth: '100px', fontWeight: 'bold' }} />
                            <Column field="loteDescripcion" header="Lote" style={{ minWidth: '180px' }} />
                            <Column field="clienteNombre" header="Cliente" style={{ minWidth: '200px' }} />
                            <Column field="totalAbonado" header="Total Abonado" body={(row) => <span className="font-bold text-orange-600">{formatCurrency(row.totalAbonado)}</span>} style={{ minWidth: '130px' }} />
                            <Column field="precioOficinaLote" header="Precio Lote" body={(row) => formatCurrency(row.precioOficinaLote)} style={{ minWidth: '120px' }} />
                            <Column field="precioVentaContrato" header="Precio Total" body={(row) => formatCurrency(row.precioVentaContrato)} style={{ minWidth: '120px' }} />
                            <Column field="diferenciaPrecio" header="Diferencia" body={(row) => <span className="font-bold text-green-600">{formatCurrency(row.diferenciaPrecio)}</span>} style={{ minWidth: '120px' }} />
                            
                            <Column
                                field="rolBeneficiario"
                                header="Rol"
                                body={(row) => (
                                    <span
                                        className={row.rolBeneficiario === 'JEFE_VENTAS' ? 'font-bold' : ''}
                                        style={row.rolBeneficiario === 'JEFE_VENTAS' ? { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px' } : undefined}
                                    >
                                        {row.rolBeneficiario}
                                    </span>
                                )}
                                style={{ minWidth: '120px' }}
                            />
                            <Column field="beneficiarioNombre" header="Vendedor/Jefe" style={{ minWidth: '200px' }} />
                            
                            <Column field="montoBase" header="Comision Base" body={(row) => formatCurrency(row.montoBase)} style={{ minWidth: '130px' }} />
                            <Column field="montoBonoGlobal" header="Bono Global" body={(row) => formatCurrency(row.montoBonoGlobal)} style={{ minWidth: '120px' }} />
                            <Column header="Bono 35%" body={(row) => row.porcentajeBonoDiferencia === 35 ? formatCurrency(row.montoBonoDiferencia) : '-'} style={{ minWidth: '110px', textAlign: 'center' }} />
                            <Column header="Bono 15%" body={(row) => row.porcentajeBonoDiferencia === 15 ? formatCurrency(row.montoBonoDiferencia) : '-'} style={{ minWidth: '110px', textAlign: 'center' }} />
                            <Column field="totalComision" header="Total Comision" body={(row) => formatCurrency(row.totalComision)} style={{ minWidth: '140px' }} className="font-bold text-primary" />
                            <Column field="estadoPago" header="Estado y Obs." body={estadoObsBodyTemplate} style={{ minWidth: '200px' }} />
                            <Column header="Acciones" body={actionBodyTemplate} align="center" style={{ minWidth: '80px' }} />
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={dialogVisible}
                    style={{ width: '450px' }}
                    header={
                        <DialogHeader
                            title="Actualizar Pago"
                            subtitle={`Comisión de ${selectedComision?.beneficiarioNombre || ''}`}
                            icon="pi pi-wallet"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    onHide={hideDialog}
                    footer={
                        <div className="dialog-footer-buttons">
                            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary btn-cancel-dialog" onClick={hideDialog} />
                            <Button label="Guardar" icon="pi pi-check" className="btn-save-dialog" onClick={saveCambioEstado} loading={saving} />
                        </div>
                    }
                >
                    <div className="formgrid grid mt-3 dialog-content-specific">
                        <div className="field col-12">
                            <label htmlFor="estadoPago" className="font-bold">Estado de Pago</label>
                            <Dropdown
                                id="estadoPago"
                                value={estadoPago}
                                options={estadosPago}
                                onChange={(e) => setEstadoPago(e.value)}
                                placeholder="Seleccione el estado"
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="observacion" className="font-bold">Observación</label>
                            <InputTextarea
                                id="observacion"
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                rows={4}
                                placeholder="Añade detalles sobre el pago o anulación (Opcional)"
                                className="w-full"
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default ReporteComisiones;
