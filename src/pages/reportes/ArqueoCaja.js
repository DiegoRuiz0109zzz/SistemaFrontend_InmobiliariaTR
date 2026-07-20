import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Tag } from 'primereact/tag';
import { Wallet, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import { useAuth } from '../../context/AuthContext';
import { PagoService } from '../../service/PagoService';
import { ContratoHistorialService } from '../../service/ContratoHistorialService';
import '../Usuario.css';

const bancosOptions = [
    { label: 'BCP', value: 'BCP' },
    { label: 'BBVA', value: 'BBVA' },
    { label: 'Interbank', value: 'Interbank' },
    { label: 'Scotiabank', value: 'Scotiabank' },
    { label: 'Otros', value: 'Otros' }
];

const ArqueoCaja = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [reporte, setReporte] = useState(null);

    const [dialogoFirma, setDialogoFirma] = useState(false);
    const [dialogoConciliar, setDialogoConciliar] = useState(false);
    const [reciboActivo, setReciboActivo] = useState(null);
    const [archivoFirma, setArchivoFirma] = useState(null);
    const [subiendoFirma, setSubiendoFirma] = useState(false);

    const [depositos, setDepositos] = useState([{ banco: '', operacion: '', monto: 0, file: null }]);
    const [conciliando, setConciliando] = useState(false);

    const [rangoFechas, setRangoFechas] = useState(null);
    const [estadoDocumento, setEstadoDocumento] = useState('TODOS');
    const [historialGeneral, setHistorialGeneral] = useState([]);

    const cargarReporte = useCallback(async () => {
        setLoading(true);
        try {
            const [data, hist] = await Promise.all([
                PagoService.obtenerReporteCaja(axiosInstance),
                ContratoHistorialService.listarTodo(axiosInstance).catch(() => [])
            ]);
            setReporte(data || null);
            setHistorialGeneral(hist || []);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reporte de caja.' });
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarReporte();
    }, [cargarReporte]);

    const recibos = useMemo(() => {
        const detalle = reporte?.detalleRecibos || {};
        let lista = Object.keys(detalle).map((numeroRecibo) => {
            const pagos = detalle[numeroRecibo] || [];
            const montoTotal = pagos.reduce((acc, pago) => acc + (Number(pago.montoAbonado || pago.monto || 0)), 0);
            const fechaPago = pagos[0]?.fechaPago || null;

            const documentoSubido = historialGeneral.some(h =>
                (h.rutaDocumentoPdf || h.ruta_documento_pdf || '').includes(numeroRecibo)
            );

            return { numeroRecibo, pagos, montoTotal, fechaPago, documentoSubido };
        });

        if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
            const fd = new Date(rangoFechas[0]);
            fd.setHours(0, 0, 0, 0);
            const fh = new Date(rangoFechas[1]);
            fh.setHours(23, 59, 59, 999);
            lista = lista.filter(r => {
                if (!r.fechaPago) return false;
                const d = new Date(r.fechaPago);
                return d >= fd && d <= fh;
            });
        }

        if (estadoDocumento === 'SUBIDO') {
            lista = lista.filter(r => r.documentoSubido);
        } else if (estadoDocumento === 'NO_SUBIDO') {
            lista = lista.filter(r => !r.documentoSubido);
        }

        return lista;
    }, [reporte, rangoFechas, estadoDocumento]);

    const totalEsperado = useMemo(() => reciboActivo?.montoTotal || 0, [reciboActivo]);

    const sumaDepositos = useMemo(() => {
        return depositos.reduce((acc, dep) => acc + (Number(dep.monto) || 0), 0);
    }, [depositos]);

    const openBlob = (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const handleVerReciboPdf = async (numeroRecibo) => {
        try {
            const blob = await PagoService.descargarReciboIngresoPdf(numeroRecibo, axiosInstance);
            openBlob(blob);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el recibo.' });
        }
    };

    const abrirDialogoFirma = (row) => {
        setReciboActivo(row);
        setArchivoFirma(null);
        setDialogoFirma(true);
    };

    const abrirDialogoConciliar = (row) => {
        setReciboActivo(row);
        setDepositos([{ banco: '', operacion: '', monto: 0, file: null }]);
        setDialogoConciliar(true);
    };

    const subirFirma = async () => {
        if (!reciboActivo?.numeroRecibo || !archivoFirma) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'Seleccione un archivo valido.' });
            return;
        }

        setSubiendoFirma(true);
        try {
            await PagoService.subirReciboFirmado(reciboActivo.numeroRecibo, archivoFirma, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Listo', detail: 'Recibo firmado cargado correctamente.' });
            setDialogoFirma(false);
            await cargarReporte();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el recibo firmado.' });
        } finally {
            setSubiendoFirma(false);
        }
    };

    const agregarDeposito = () => {
        setDepositos((prev) => [...prev, { banco: '', operacion: '', monto: 0, file: null }]);
    };

    const eliminarDeposito = (index) => {
        setDepositos((prev) => prev.filter((_, idx) => idx !== index));
    };

    const actualizarDeposito = (index, campo, valor) => {
        setDepositos((prev) => prev.map((dep, idx) => idx === index ? { ...dep, [campo]: valor } : dep));
    };

    const conciliarRecibo = async () => {
        if (!reciboActivo?.numeroRecibo) return;

        setConciliando(true);
        try {
            const formData = new FormData();
            depositos.forEach((dep) => {
                formData.append('bancos', dep.banco || '');
                formData.append('operaciones', dep.operacion || '');
                formData.append('montos', dep.monto || 0);
                if (dep.file) {
                    formData.append('vouchers', dep.file);
                }
            });

            await PagoService.conciliarCaja(reciboActivo.numeroRecibo, formData, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Conciliado', detail: 'Recibo conciliado y retirado de caja.' });
            setDialogoConciliar(false);
            await cargarReporte();
        } catch (error) {
            const mensaje = error?.response?.data?.message || 'No se pudo conciliar el recibo.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: mensaje });
        } finally {
            setConciliando(false);
        }
    };

    const accionesTemplate = (row) => (
        <div className="flex align-items-center gap-2 justify-content-center">
            <Button
                icon="pi pi-file-pdf"
                className="p-button-rounded p-button-text p-button-danger"
                tooltip="Ver PDF provisional"
                onClick={() => handleVerReciboPdf(row.numeroRecibo)}
                disabled={row.numeroRecibo === 'SIN_RECIBO_ANTIGUO'}
            />
            {!row.documentoSubido && (
                <Button
                    icon="pi pi-upload"
                    className="p-button-rounded p-button-text p-button-warning"
                    tooltip="Subir firma"
                    onClick={() => abrirDialogoFirma(row)}
                    disabled={row.numeroRecibo === 'SIN_RECIBO_ANTIGUO'}
                />
            )}
            <Button
                icon="pi pi-briefcase"
                className="p-button-rounded p-button-text p-button-success"
                tooltip="Conciliar en banco"
                onClick={() => abrirDialogoConciliar(row)}
                disabled={row.numeroRecibo === 'SIN_RECIBO_ANTIGUO'}
            />
        </div>
    );

    return (
        <div className="usuario-page arqueo-caja-page">
            <div className="container">
                <PageHeader
                    title="Arqueo de Caja"
                    description="Controla los recibos en efectivo y concilia los depositos en banco."
                    icon="pi pi-wallet"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <div className="grid mb-4">
                            <div className="col-12 md:col-6">
                                <div className="surface-0 border-round-2xl border-1 surface-border p-4 shadow-1 flex align-items-center gap-3">
                                    <div className="border-circle surface-200 flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                                        <Wallet size={26} />
                                    </div>
                                    <div>
                                        <span className="text-sm text-500 font-bold uppercase block">Efectivo en Caja</span>
                                        <span className="text-2xl font-bold text-900">S/ {(reporte?.totalEfectivoSoles || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        <div className="text-xs text-500">Recibos pendientes: {reporte?.cantidadRecibosPendientes || 0}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 md:col-6">
                                <div className="surface-0 border-round-2xl border-1 surface-border p-4 shadow-1">
                                    <div className="flex align-items-center justify-content-between">
                                        <span className="text-sm text-500 font-bold uppercase">Estado de Caja</span>
                                        <Tag severity={reporte?.cantidadRecibosPendientes ? 'warning' : 'success'} value={reporte?.cantidadRecibosPendientes ? 'Pendiente' : 'Al dia'} />
                                    </div>
                                    <p className="text-sm text-600 mt-3 mb-0">Administra recibos en efectivo y realiza conciliaciones bancarias para liberar las cuotas.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-column md:flex-row gap-3 mb-4 surface-0 p-4 border-round-2xl shadow-1 border-1 surface-border">
                            <div className="flex-1 flex flex-column gap-2">
                                <label className="text-sm font-bold text-700">Rango de Fechas</label>
                                <Calendar
                                    value={rangoFechas}
                                    onChange={(e) => setRangoFechas(e.value)}
                                    selectionMode="range"
                                    readOnlyInput
                                    hideOnRangeSelection
                                    showIcon
                                    placeholder="Seleccione un rango"
                                    className="w-full"
                                />
                            </div>
                            <div className="flex-1 flex flex-column gap-2">
                                <label className="text-sm font-bold text-700">Estado de Documento</label>
                                <Dropdown
                                    value={estadoDocumento}
                                    options={[
                                        { label: 'Todos', value: 'TODOS' },
                                        { label: 'Documento Subido', value: 'SUBIDO' },
                                        { label: 'Falta Subir', value: 'NO_SUBIDO' }
                                    ]}
                                    onChange={(e) => setEstadoDocumento(e.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <ActionToolbar
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar recibo..."
                            extraActions={
                                <Button
                                    icon="pi pi-refresh"
                                    className="p-button-text"
                                    tooltip="Actualizar"
                                    onClick={cargarReporte}
                                />
                            }
                        />

                        <DataTable
                            value={recibos}
                            paginator
                            rows={10}
                            loading={loading}
                            globalFilter={globalFilter}
                            globalFilterFields={['numeroRecibo']}
                            emptyMessage="No hay recibos pendientes en caja."
                            className="p-datatable-sm shadow-1 border-round-lg overflow-hidden mt-3"
                        >
                            <Column field="numeroRecibo" header="Nro Recibo" sortable></Column>
                            <Column header="Fecha" body={(r) => r.fechaPago ? new Date(r.fechaPago).toLocaleDateString('es-PE') : '-'} sortable></Column>
                            <Column header="Documento" body={(r) => <Tag severity={r.documentoSubido ? 'success' : 'warning'} value={r.documentoSubido ? 'Subido' : 'Pendiente'} />} align="center"></Column>
                            <Column header="Monto Total" body={(r) => <span className="font-bold text-green-700">S/ {r.montoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>} align="right" sortable></Column>
                            <Column header="Acciones" body={accionesTemplate} align="center"></Column>
                        </DataTable>
                    </div>
                </div>
            </div>

            <Dialog
                header={`Subir recibo firmado: ${reciboActivo?.numeroRecibo || ''}`}
                visible={dialogoFirma}
                onHide={() => setDialogoFirma(false)}
                style={{ width: '32rem' }}
                modal
            >
                <div className="flex flex-column gap-3">
                    <p className="text-sm text-600 m-0">Adjunta la foto o PDF firmado por el cliente.</p>
                    <FileUpload
                        mode="basic"
                        chooseLabel="Seleccionar archivo"
                        accept="image/*,application/pdf"
                        customUpload
                        auto={false}
                        onSelect={(e) => setArchivoFirma(e.files?.[0] || null)}
                    />
                    {archivoFirma && (
                        <div className="flex align-items-center gap-2 bg-blue-50 p-2 border-round">
                            <i className="pi pi-file text-blue-500"></i>
                            <small className="text-700 font-bold flex-1">{archivoFirma.name}</small>
                            <Button
                                type="button"
                                icon="pi pi-eye"
                                className="p-button-rounded p-button-info p-button-text"
                                tooltip="Ver documento seleccionado"
                                onClick={() => openBlob(archivoFirma)}
                            />
                        </div>
                    )}
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" className="p-button-text" onClick={() => setDialogoFirma(false)} />
                        <Button label="Subir" icon="pi pi-upload" className='text-white' loading={subiendoFirma} onClick={subirFirma} />
                    </div>
                </div>
            </Dialog>

            <Dialog
                header={`Conciliando Recibo: ${reciboActivo?.numeroRecibo || ''}`}
                visible={dialogoConciliar}
                onHide={() => setDialogoConciliar(false)}
                style={{ width: '60rem' }}
                modal
            >
                <div className="flex flex-column gap-3">
                    <div className="surface-50 border-round-lg p-3 border-1 surface-border">
                        <span className="font-bold text-700">Total a cubrir: </span>
                        <span className="font-bold text-800">S/ {totalEsperado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {depositos.map((dep, index) => (
                        <div key={index} className="surface-0 border-round-lg border-1 surface-border p-3">
                            <div className="flex flex-column md:flex-row align-items-end gap-3 w-full">
                                <div className="flex-1 w-full">
                                    <label className="text-sm font-bold text-700 block mb-2">Banco</label>
                                    <Dropdown
                                        value={dep.banco}
                                        options={bancosOptions}
                                        onChange={(e) => actualizarDeposito(index, 'banco', e.value)}
                                        className="w-full"
                                        placeholder="Seleccione"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-sm font-bold text-700 block mb-2">Operacion</label>
                                    <InputText
                                        value={dep.operacion}
                                        onChange={(e) => actualizarDeposito(index, 'operacion', e.target.value)}
                                        className="w-full"
                                        placeholder="Ej: 123456"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-sm font-bold text-700 block mb-2">Monto</label>
                                    <InputNumber
                                        value={dep.monto}
                                        onValueChange={(e) => actualizarDeposito(index, 'monto', e.value || 0)}
                                        mode="currency"
                                        currency="PEN"
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-sm font-bold text-700 block mb-2">Voucher</label>
                                    <div className="flex align-items-center gap-2">
                                        <div className="flex-1 overflow-hidden">
                                            <FileUpload
                                                mode="basic"
                                                chooseLabel={dep.file ? "Cambiar" : "Subir"}
                                                chooseOptions={{ icon: 'pi pi-upload', className: 'p-button-outlined p-button-sm w-full' }}
                                                accept="image/*,application/pdf"
                                                customUpload
                                                auto={false}
                                                onSelect={(e) => actualizarDeposito(index, 'file', e.files?.[0] || null)}
                                            />
                                        </div>
                                        {dep.file && (
                                            <Button
                                                type="button"
                                                icon="pi pi-eye"
                                                className="p-button-rounded p-button-sm p-button-info p-button-text m-0 p-0"
                                                tooltip="Ver voucher"
                                                onClick={() => openBlob(dep.file)}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="flex align-items-center justify-content-center mb-1">
                                    <button
                                        type="button"
                                        className="p-button p-button-danger p-button-rounded p-button-text"
                                        onClick={() => eliminarDeposito(index)}
                                        title="Eliminar deposito"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button
                        icon="pi pi-plus"
                        label="Agregar otro deposito"
                        className="p-button-text p-button-secondary"
                        onClick={agregarDeposito}
                    />

                    <div className="flex justify-content-between align-items-center surface-50 border-round-lg p-3 border-1 surface-border">
                        <span className="font-bold text-700">Suma de depositos actual</span>
                        <span className={`font-bold ${sumaDepositos === totalEsperado ? 'text-green-700' : 'text-orange-600'}`}>
                            S/ {sumaDepositos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" className="p-button-text" onClick={() => setDialogoConciliar(false)} />
                        <Button
                            label="Confirmar Conciliacion"
                            icon="pi pi-check"
                            disabled={sumaDepositos !== totalEsperado || conciliando}
                            loading={conciliando}
                            onClick={conciliarRecibo}
                            className='text-white'
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default ArqueoCaja;
