import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ContratoService } from '../../service/ContratoService';

import '../Usuario.css';
import './Contrato.css';

const ListaContratos = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);
    const [historialContratos, setHistorialContratos] = useState([]);

    const cargarHistorial = async () => {
        try {
            const res = await ContratoService.listar(axiosInstance);
            const listado = res || [];
            const mapped = listado.map((item) => ({
                id: item.id,
                cliente: `${item?.cliente?.nombres || ''} ${item?.cliente?.apellidos || ''}`.trim(),
                lote: item?.lote?.numero ? `Mz ${item?.lote?.manzana?.nombre || ''} - L ${item.lote.numero}` : '',
                precio: item?.precioTotal,
                fecha: item?.fechaContrato || item?.createdAt,
                estado: item?.lote?.estadoVenta || ''
            }));
            setHistorialContratos(mapped);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.' });
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    return (
        <div className="contrato-page">
            <Toast ref={toast} />
            <PageHeader title="Gestión Comercial" subtitle="Historial de Contratos" icon="pi pi-list" />

            <div className="main-content">
                <div className="custom-card mt-3">
                    <DataTable
                        value={historialContratos}
                        paginator
                        rows={10}
                        emptyMessage="No se encontraron contratos."
                        className="p-datatable-sm shadow-1"
                    >
                        <Column field="id" header="N° Contrato" style={{ minWidth: '100px' }} />
                        <Column field="cliente" header="Cliente" style={{ minWidth: '180px' }} />
                        <Column field="lote" header="Lote Asignado" style={{ minWidth: '150px' }} />
                        <Column header="Total" body={(row) => `S/ ${row.precio?.toLocaleString()}`} style={{ minWidth: '120px' }} />
                        <Column field="fecha" header="Fecha Emisión" style={{ minWidth: '120px' }} />
                        <Column header="Estado Lote" body={(row) => (
                            <Tag severity={row.estado === 'VENDIDO' ? 'success' : 'warning'} value={row.estado} />
                        )} style={{ minWidth: '120px', textAlign: 'center' }} />
                        <Column body={() => <Button icon="pi pi-eye" className="p-button-rounded p-button-text p-button-info" tooltip="Ver Detalles" />} style={{ width: '4rem' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ListaContratos;
