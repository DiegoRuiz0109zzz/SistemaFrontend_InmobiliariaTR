import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ContratoService } from '../../service/ContratoService';
import { CuotaService } from '../../service/CuotaService';

import './ListaContratos.css';

const ListaContratos = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);
    const navigate = useNavigate();

    const [contratos, setContratos] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarContratos();
    }, []);

    const cargarContratos = async () => {
        setLoading(true);
        try {
            const response = await ContratoService.listar(axiosInstance);
            const contratosList = Array.isArray(response) ? response : [];
            
            const listaFormateada = await Promise.all(contratosList.map(async (item) => {
                // Cálculo de progreso guiado por GestionCuotasPagos.js
                let totalPagadoReal = item.abonoInicialReal || item.montoInicial || 0;
                let precioTotalCalculado = item.precioTotal || 1;
                
                try {
                    const cuotasRaw = await CuotaService.listarPorContrato(item.id, axiosInstance);
                    const cuotasList = Array.isArray(cuotasRaw) ? cuotasRaw : [];
                    
                    if (cuotasList.length > 0) {
                        // Exactamente como en GestionCuotasPagos: sumar todo lo pagado en TODAS las cuotas
                        totalPagadoReal = cuotasList.reduce((acc, cuota) => acc + (cuota.montoPagado || 0), 0);
                        precioTotalCalculado = item.precioTotal || cuotasList.reduce((acc, cuota) => acc + (cuota.montoTotal || cuota.monto || 0), 0);
                    }
                } catch (error) {
                    console.warn(`No se pudieron cargar las cuotas del contrato ${item.id}`, error);
                }

                const progresoReal = Math.min(100, Math.round((totalPagadoReal / precioTotalCalculado) * 100));

                return {
                    ...item,
                    id: item.id,
                    codigo: `C-${item.id?.toString().padStart(4, '0')}`,
                    cliente: item.cliente || { nombres: 'Desconocido', apellidos: '', numeroDocumento: 'N/A' },
                    lote: item.lote || { descripcion: 'No asignado' },
                    precioTotal: precioTotalCalculado,
                    totalPagado: totalPagadoReal,
                    estadoLote: item.lote?.estadoVenta || (totalPagadoReal < (item.montoInicialAcordado || 0) ? 'SEPARADO' : 'VENDIDO'),
                    fechaEmision: item.fechaRegistro ? new Date(item.fechaRegistro).toLocaleDateString() : 'N/A',
                    progreso: progresoReal
                };
            }));
            
            // Ordenar por ID descendente (más recientes primero)
            listaFormateada.sort((a, b) => b.id - a.id);
            setContratos(listaFormateada);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los contratos.' });
        } finally {
            setLoading(false);
        }
    };

    const verDetalle = (contrato) => {
        navigate(`/detalle_contrato/${contrato.id}`);
    };

    // ==========================================
    // TEMPLATES DEL MAESTRO (CONTRATOS)
    // ==========================================
    const renderHeader = () => {
        return (
            <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
                <div className="p-inputgroup max-w-20rem shadow-1 border-round-xl overflow-hidden">
                    <span className="p-inputgroup-addon bg-white border-none"><i className="pi pi-search text-primary" /></span>
                    <InputText type="search" className="border-none" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar por DNI o Contrato..." />
                </div>
                <Button label="Exportar Listado" icon="pi pi-file-excel" className="btn-success-custom p-button-sm shadow-2 border-round-xl" />
            </div>
        );
    };

    const clienteTemplate = (rowData) => (
        <div>
            <span className="font-bold text-800">{rowData.cliente.nombres} {rowData.cliente.apellidos}</span><br/>
            <span className="text-xs text-500">DNI: {rowData.cliente.numeroDocumento}</span>
        </div>
    );

    const progresoTemplate = (rowData) => {
        return (
            <div className="flex align-items-center justify-content-center">
                <span className="text-xs font-bold mr-2 w-2rem text-right">{rowData.progreso}%</span>
                <ProgressBar value={rowData.progreso} displayValueTemplate={() => ''} style={{ height: '6px', width: '80px' }} color={rowData.progreso === 100 ? 'var(--green-500)' : 'var(--blue-500)'}></ProgressBar>
            </div>
        );
    };

    const estadoLoteTemplate = (rowData) => <Tag severity={rowData.estadoLote === 'VENDIDO' ? 'success' : 'warning'} value={rowData.estadoLote} />;

    const accionesTemplate = (rowData) => (
        <Button label="Ver Detalle" icon="pi pi-eye" className="btn-primary-custom p-button-sm font-bold shadow-2 border-round-xl" onClick={() => verDetalle(rowData)} />
    );

    return (
        <div className="listacontratos-page">
            <Toast ref={toast} />
            <PageHeader title="Contratos Emitidos" subtitle="Búsqueda y seguimiento detallado de ventas" icon="pi pi-folder-open" />

            <div className="main-content pt-3">
                <div className="card surface-card border-round shadow-1 p-0 overflow-hidden">
                    <DataTable 
                        value={contratos} 
                        header={renderHeader()} 
                        globalFilter={globalFilter} 
                        emptyMessage="No se encontraron contratos."
                        paginator rows={10}
                        loading={loading}
                        className="p-datatable-sm custom-master-table"
                        stripedRows
                    >
                        <Column field="codigo" header="ID Contrato" style={{ minWidth: '120px', fontWeight: 'bold', color: 'var(--primary-color)' }} />
                        <Column header="Cliente" body={clienteTemplate} style={{ minWidth: '220px' }} />
                        <Column header="Lote Asignado" body={(row) => <span>{row.lote?.numero ? `Mza ${row.lote?.manzana?.nombre || ''} - Lote ${row.lote?.numero}` : row.lote?.descripcion}</span>} style={{ minWidth: '180px' }} />
                        <Column header="Precio Total" body={(row) => <span className="font-bold">S/ {row.precioTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span>} style={{ minWidth: '120px', textAlign: 'right' }} />
                        <Column header="Progreso" body={progresoTemplate} style={{ minWidth: '150px', textAlign: 'center' }} />
                        <Column header="Estado Lote" body={estadoLoteTemplate} style={{ minWidth: '120px', textAlign: 'center' }} />
                        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ListaContratos;