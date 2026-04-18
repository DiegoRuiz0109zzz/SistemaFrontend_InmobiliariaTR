import React, { useMemo } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';

const Dashboard = () => {
    const formatCurrency = (value) => `S/ ${new Intl.NumberFormat('es-PE').format(value)}`;

    const kpis = [
        {
            title: 'Ingresos del Mes',
            value: 'S/ 45,500',
            subtitle: '+15% vs mes anterior',
            icon: 'pi pi-wallet',
            color: '#2E7D32',
            bg: 'rgba(46, 125, 50, 0.12)'
        },
        {
            title: 'Cuentas por Cobrar',
            value: 'S/ 12,800',
            subtitle: 'De 8 cuotas atrasadas',
            icon: 'pi pi-exclamation-triangle',
            color: '#C62828',
            bg: 'rgba(198, 40, 40, 0.12)'
        },
        {
            title: 'Ventas del Mes',
            value: 'S/ 350,000',
            subtitle: '5 lotes vendidos',
            icon: 'pi pi-file',
            color: '#1565C0',
            bg: 'rgba(21, 101, 192, 0.12)'
        },
        {
            title: 'Nuevos Interesados',
            value: '42',
            subtitle: 'En los ultimos 30 dias',
            icon: 'pi pi-users',
            color: '#EF6C00',
            bg: 'rgba(239, 108, 0, 0.12)'
        }
    ];

    const lineData = useMemo(
        () => ({
            labels: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
            datasets: [
                {
                    label: 'Proyectado (Cuotas a vencer)',
                    data: [48000, 52000, 61000, 58000, 64000, 72000],
                    borderColor: '#1565C0',
                    backgroundColor: 'rgba(21, 101, 192, 0.15)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Cobrado (Amortizaciones reales)',
                    data: [42000, 47000, 53000, 51000, 59000, 66000],
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(46, 125, 50, 0.15)',
                    tension: 0.4,
                    fill: true
                }
            ]
        }),
        []
    );

    const lineOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#475569' }
            }
        },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148, 163, 184, 0.2)' } },
            y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148, 163, 184, 0.2)' } }
        }
    };

    const doughnutData = useMemo(
        () => ({
            labels: ['Disponibles', 'Separados', 'Vendidos'],
            datasets: [
                {
                    data: [60, 15, 25],
                    backgroundColor: ['#2E7D32', '#F9A825', '#C62828'],
                    hoverBackgroundColor: ['#1B5E20', '#F57F17', '#B71C1C']
                }
            ]
        }),
        []
    );

    const doughnutOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#475569' }
            }
        },
        cutout: '65%'
    };

    const cuotasVencidas = [
        { id: 1, cliente: 'Rosa Figueroa', telefono: '987654321', monto: 3800, dias: 18 },
        { id: 2, cliente: 'Luis Ortega', telefono: '934512879', monto: 4200, dias: 25 },
        { id: 3, cliente: 'Karla Ponce', telefono: '966778812', monto: 3150, dias: 12 },
        { id: 4, cliente: 'Marco Reyes', telefono: '955441221', monto: 5100, dias: 34 },
        { id: 5, cliente: 'Elena Castro', telefono: '944223110', monto: 2750, dias: 9 }
    ];

    const ultimosPagos = [
        { id: 1, cliente: 'Juan Perez', lote: 'Mz A / Lote 01', monto: 6200, fecha: '12/04/2026' },
        { id: 2, cliente: 'Maria Torres', lote: 'Mz B / Lote 08', monto: 4800, fecha: '11/04/2026' },
        { id: 3, cliente: 'Carlos Mena', lote: 'Mz C / Lote 03', monto: 5300, fecha: '10/04/2026' },
        { id: 4, cliente: 'Patricia Ruiz', lote: 'Mz A / Lote 05', monto: 3900, fecha: '09/04/2026' },
        { id: 5, cliente: 'Diego Romero', lote: 'Mz D / Lote 12', monto: 7100, fecha: '08/04/2026' }
    ];

    const vencidoBody = () => <Badge value="VENCIDO" severity="danger" />;
    const voucherBody = () => (
        <Button icon="pi pi-eye" className="p-button-rounded p-button-text" tooltip="Ver Voucher" tooltipOptions={{ position: 'top' }} />
    );

    return (
        <div className="p-3">
            <div className="grid">
                {kpis.map((kpi) => (
                    <div key={kpi.title} className="col-12 md:col-6 lg:col-3">
                        <Card className="shadow-2">
                            <div className="flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-600 text-sm m-0">{kpi.title}</p>
                                    <h3 className="mt-2 mb-1 text-900">{kpi.value}</h3>
                                    <span className="text-500 text-sm">{kpi.subtitle}</span>
                                </div>
                                <div className="flex align-items-center justify-content-center border-round" style={{ width: '48px', height: '48px', background: kpi.bg, color: kpi.color }}>
                                    <i className={`${kpi.icon} text-xl`}></i>
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            <div className="grid">
                <div className="col-12 lg:col-6">
                    <Card className="shadow-2">
                        <div className="flex justify-content-between align-items-center mb-3">
                            <div>
                                <h4 className="m-0 text-900">Flujo de Caja</h4>
                                <span className="text-500 text-sm">Ultimos 6 meses</span>
                            </div>
                        </div>
                        <Chart type="line" data={lineData} options={lineOptions} />
                    </Card>
                </div>
                <div className="col-12 lg:col-6">
                    <Card className="shadow-2">
                        <div className="flex justify-content-between align-items-center mb-3">
                            <div>
                                <h4 className="m-0 text-900">Disponibilidad Etapa 1</h4>
                                <span className="text-500 text-sm">Estado del proyecto</span>
                            </div>
                        </div>
                        <Chart type="doughnut" data={doughnutData} options={doughnutOptions} />
                    </Card>
                </div>
            </div>

            <div className="grid">
                <div className="col-12 lg:col-6">
                    <Card className="shadow-2">
                        <div className="flex justify-content-between align-items-center mb-3">
                            <div>
                                <h4 className="m-0 text-900">Top 5 Cuotas Vencidas</h4>
                                <span className="text-500 text-sm">Clientes con atrasos</span>
                            </div>
                        </div>
                        <DataTable value={cuotasVencidas} dataKey="id" rows={5} paginator={false}>
                            <Column field="cliente" header="Cliente" style={{ minWidth: '180px' }} />
                            <Column field="telefono" header="Telefono" style={{ minWidth: '120px' }} />
                            <Column header="Monto" body={(row) => formatCurrency(row.monto)} style={{ minWidth: '120px' }} />
                            <Column field="dias" header="Dias Atraso" style={{ minWidth: '120px' }} />
                            <Column header="Estado" body={vencidoBody} style={{ minWidth: '120px' }} />
                        </DataTable>
                    </Card>
                </div>
                <div className="col-12 lg:col-6">
                    <Card className="shadow-2">
                        <div className="flex justify-content-between align-items-center mb-3">
                            <div>
                                <h4 className="m-0 text-900">Ultimos Pagos</h4>
                                <span className="text-500 text-sm">Amortizaciones recientes</span>
                            </div>
                        </div>
                        <DataTable value={ultimosPagos} dataKey="id" rows={5} paginator={false}>
                            <Column field="cliente" header="Cliente" style={{ minWidth: '180px' }} />
                            <Column field="lote" header="Lote" style={{ minWidth: '150px' }} />
                            <Column header="Monto Pagado" body={(row) => formatCurrency(row.monto)} style={{ minWidth: '130px' }} />
                            <Column field="fecha" header="Fecha" style={{ minWidth: '120px' }} />
                            <Column header="Voucher" body={voucherBody} style={{ width: '90px', textAlign: 'center' }} />
                        </DataTable>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
