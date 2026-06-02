import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';

import PageHeader from '../../components/ui/PageHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import DialogHeader from '../../components/ui/DialogHeader';
import { useAuth } from '../../context/AuthContext';
import { ComisionService } from '../../service/ComisionService';
import '../Usuario.css';

const ReporteComisiones = () => {
    const { axiosInstance } = useAuth();
    const [comisiones, setComisiones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

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

                        <ActionToolbar
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar comisión..."
                            extraActions={
                                <Button
                                    icon="pi pi-download"
                                    className="btn-export"
                                    tooltip="Exportar a CSV"
                                    tooltipOptions={{ position: 'bottom' }}
                                    onClick={exportCSV}
                                />
                            }
                        />

                        <DataTable
                            ref={dt}
                            value={comisiones}
                            dataKey="id"
                            paginator
                            rows={15}
                            rowsPerPageOptions={[15, 25, 50]}
                            loading={loading}
                            globalFilter={globalFilter}
                            globalFilterFields={['contratoCodigo', 'beneficiarioNombre', 'rolBeneficiario', 'estadoPago', 'clienteNombre', 'loteDescripcion']}
                            emptyMessage="No se encontraron comisiones."
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
