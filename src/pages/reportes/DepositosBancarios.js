import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/ui/PageHeader';
import ActionToolbar from '../../components/ui/ActionToolbar';
import { useAuth } from '../../context/AuthContext';
import { DepositoBancarioService } from '../../service/DepositoBancarioService';
import { environment } from '../util/baseUrl';
import '../Usuario.css';

const DepositosBancarios = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    const [loading, setLoading] = useState(false);
    const [depositos, setDepositos] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const cargarDepositos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await DepositoBancarioService.listarTodos(axiosInstance);
            setDepositos(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los depositos.' });
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarDepositos();
    }, [cargarDepositos]);

    const formatCurrency = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDate = (value) => {
        if (!value) return '-';
        if (value.includes('T')) {
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('es-PE');
        }
        const [anio, mes, dia] = value.split('-');
        return anio && mes && dia ? `${dia}/${mes}/${anio}` : value;
    };

    const buildVoucherUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const base = environment.baseUrl.replace(/\/api\/?$/, '/');
        return `${base}${path.replace(/^\/+/, '')}`;
    };

    const verVoucher = (path) => {
        const url = buildVoucherUrl(path);
        if (url) window.open(url, '_blank');
    };

    return (
        <div className="usuario-page depositos-bancarios-page">
            <div className="container">
                <PageHeader
                    title="Historial de Depositos Bancarios"
                    description="Consulta las conciliaciones bancarias y vouchers registrados."
                    icon="pi pi-database"
                />

                <div className="main-content">
                    <div className="content-card">
                        <Toast ref={toast} />

                        <ActionToolbar
                            onSearch={setGlobalFilter}
                            searchValue={globalFilter}
                            searchPlaceholder="Buscar por recibo o banco..."
                            extraActions={
                                <Button
                                    icon="pi pi-refresh"
                                    className="p-button-text"
                                    tooltip="Actualizar"
                                    onClick={cargarDepositos}
                                />
                            }
                        />

                        <DataTable
                            value={depositos}
                            paginator
                            rows={12}
                            loading={loading}
                            globalFilter={globalFilter}
                            globalFilterFields={['numeroReciboCaja', 'banco', 'numeroOperacion']}
                            emptyMessage="No hay depositos registrados."
                            className="p-datatable-sm shadow-1 border-round-lg overflow-hidden mt-3"
                        >
                            <Column field="fechaDeposito" header="Fecha" body={(r) => formatDate(r.fechaDeposito)} sortable></Column>
                            <Column field="numeroReciboCaja" header="Recibo Origen" sortable></Column>
                            <Column field="banco" header="Banco" sortable></Column>
                            <Column field="numeroOperacion" header="Nro Operacion" sortable></Column>
                            <Column field="monto" header="Monto" body={(r) => <span className="font-bold text-green-700">{formatCurrency(r.monto)}</span>} align="right" sortable></Column>
                            <Column
                                header="Voucher"
                                body={(r) => r.fotoVoucherUrl ? (
                                    <Button
                                        icon="pi pi-external-link"
                                        className="p-button-text p-button-secondary"
                                        label="Ver"
                                        onClick={() => verVoucher(r.fotoVoucherUrl)}
                                    />
                                ) : '-'}
                                align="center"
                            ></Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositosBancarios;
