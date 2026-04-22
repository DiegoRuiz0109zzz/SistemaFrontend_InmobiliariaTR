import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { CotizacionService } from '../../service/CotizacionService';

import './Cotizacion.css';

const ListaCotizaciones = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);
    const [historialCotizaciones, setHistorialCotizaciones] = useState([]);

    const cargarHistorial = async () => {
        try {
            const res = await CotizacionService.listar(axiosInstance);
            setHistorialCotizaciones(res || []);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.' });
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const convertirCotizacion = async (rowData) => {
        try {
            await CotizacionService.convertir(rowData.id, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Conversión', detail: 'Cotización convertida a contrato.' });
            cargarHistorial();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Conversión', detail: 'No se pudo convertir la cotización.' });
        }
    };

    return (
        <div className="cotizacion-page">
            <Toast ref={toast} />
            <PageHeader title="Gestión Comercial" subtitle="Historial de Cotizaciones" icon="pi pi-history" />

            <div className="main-content">
                <div className="custom-card mt-3">
                    <DataTable
                        value={historialCotizaciones}
                        paginator
                        rows={10}
                        emptyMessage="No se encontraron cotizaciones guardadas."
                        className="p-datatable-sm"
                    >
                        <Column field="id" header="N° Doc" style={{ minWidth: '80px' }} />
                        <Column header="Prospecto" body={(row) => `${row.interesado?.nombres} ${row.interesado?.apellidos}`} style={{ minWidth: '150px' }} />
                        <Column header="Lote" body={(row) => row.lote?.descripcion} style={{ minWidth: '150px' }} />
                        <Column header="Total" body={(row) => `S/ ${row?.precioTotal?.toLocaleString()}`} style={{ minWidth: '120px' }} />
                        <Column header="Estado" field="estado" body={(row) => <span className={`status-badge ${row.estado?.toLowerCase()}`}>{row.estado}</span>} style={{ minWidth: '120px' }} />
                        <Column header="Validez" field="fechaValidez" style={{ minWidth: '120px' }} />
                        <Column
                            header="Acción"
                            body={(row) => (
                                <Button
                                    label="Convertir a Contrato"
                                    icon="pi pi-check-circle"
                                    className="p-button-outlined p-button-sm"
                                    disabled={row.estado !== 'VIGENTE'}
                                    onClick={() => convertirCotizacion(row)}
                                />
                            )}
                            style={{ minWidth: '180px' }}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ListaCotizaciones;
