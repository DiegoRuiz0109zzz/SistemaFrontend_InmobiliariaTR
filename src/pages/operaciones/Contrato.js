import React, { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import PageHeader from '../../components/ui/PageHeader';
import '../Usuario.css';
import './Contrato.css';

const Contrato = () => {
    const [form, setForm] = useState({
        fechaContrato: null,
        cliente: {
            numeroDocumento: '',
            nombres: '',
            apellidos: '',
            telefono: '',
            email: ''
        },
        vendedor: null,
        urbanizacion: null,
        etapa: null,
        manzana: null,
        lote: null,
        precioTotal: null,
        montoInicial: null,
        saldoFinanciar: null,
        cantidadCuotas: null
    });
    const [cuotas, setCuotas] = useState([]);
    const [clienteFromInteresado, setClienteFromInteresado] = useState(false);
    const [selectedLote, setSelectedLote] = useState(null);

    const interesadosOptions = useMemo(
        () => [
            { numeroDocumento: '44556677', nombres: 'Maria', apellidos: 'Paredes', telefono: '987654321', email: 'maria@correo.com' },
            { numeroDocumento: '77889911', nombres: 'Juan', apellidos: 'Soto', telefono: '912345678', email: 'juan@correo.com' }
        ],
        []
    );
    const vendedorOptions = useMemo(
        () => [
            { label: 'Carlos Medina', value: { id: 1, nombres: 'Carlos', apellidos: 'Medina' } },
            { label: 'Lucia Campos', value: { id: 2, nombres: 'Lucia', apellidos: 'Campos' } }
        ],
        []
    );
    const lotesDisponibles = useMemo(
        () => [
            { id: 1, urbanizacion: 'Primavera', etapa: 'Etapa 1', manzana: 'A', numeroLote: '01', area: 120, precio: 75000 },
            { id: 2, urbanizacion: 'Primavera', etapa: 'Etapa 1', manzana: 'A', numeroLote: '02', area: 110, precio: 70000 },
            { id: 3, urbanizacion: 'Los Sauces', etapa: 'Etapa 2', manzana: 'C', numeroLote: '15', area: 140, precio: 82000 }
        ],
        []
    );

    const onInputChange = (value, name) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onClienteChange = (value, name) => {
        setForm((prev) => ({
            ...prev,
            cliente: {
                ...prev.cliente,
                [name]: value
            }
        }));
    };

    const onBuscarCliente = () => {
        const dni = (form.cliente.numeroDocumento || '').trim();
        if (!dni) {
            setClienteFromInteresado(false);
            return;
        }

        const encontrado = interesadosOptions.find((item) => item.numeroDocumento === dni);
        if (encontrado) {
            setForm((prev) => ({
                ...prev,
                cliente: {
                    ...prev.cliente,
                    ...encontrado
                }
            }));
            setClienteFromInteresado(true);
            return;
        }

        setClienteFromInteresado(false);
    };

    const onFinancialChange = (value, name) => {
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            const precioTotal = Number(next.precioTotal || 0);
            const montoInicial = Number(next.montoInicial || 0);
            if (!Number.isNaN(precioTotal) && !Number.isNaN(montoInicial)) {
                next.saldoFinanciar = Math.max(precioTotal - montoInicial, 0);
            }
            return next;
        });
    };

    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return value;
        }
        return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numericValue);
    };

    const formatArea = (rowData) => `${formatNumber(rowData.area)} m2`;

    const formatPrecio = (rowData) => `S/. ${formatNumber(rowData.precio)}`;

    const onSelectLote = (rowData) => {
        setSelectedLote(rowData);
        setForm((prev) => ({
            ...prev,
            lote: {
                ...rowData,
                label: `${rowData.urbanizacion} - ${rowData.etapa} / Mz ${rowData.manzana} - ${rowData.numeroLote}`
            },
            precioTotal: rowData.precio
        }));
    };

    const addMonths = (date, months) => {
        const next = new Date(date);
        next.setMonth(next.getMonth() + months);
        return next;
    };

    const round2 = (value) => Math.round(value * 100) / 100;

    const simularCuotas = () => {
        const total = Number(form.saldoFinanciar || 0);
        const cantidad = Number(form.cantidadCuotas || 0);
        if (!total || !cantidad) {
            setCuotas([]);
            return;
        }

        const baseFecha = form.fechaContrato || new Date();
        const montoBase = round2(total / cantidad);
        const cuotasTemp = [];
        let acumulado = 0;

        for (let i = 1; i <= cantidad; i += 1) {
            const isLast = i === cantidad;
            const monto = isLast ? round2(total - acumulado) : montoBase;
            acumulado = round2(acumulado + monto);
            cuotasTemp.push({
                numeroCuota: i,
                montoTotal: monto,
                fechaVencimiento: addMonths(baseFecha, i),
                estado: 'PENDIENTE'
            });
        }
        setCuotas(cuotasTemp);
    };

    return (
        <div className="usuario-page contrato-page">
            <div className="container">
                <PageHeader
                    title="Nuevo Contrato"
                    description="Registro de venta de lote y condiciones del contrato."
                    icon="pi pi-file-edit"
                />

                <div className="main-content">
                    <div className="contrato-grid">
                        <div className="contrato-column">
                            <div className="content-card contrato-card">
                                <div className="card-header">
                                    <h3>Datos del Contrato</h3>
                                    <p>Informacion general del contrato de venta.</p>
                                </div>

                                <div className="formgrid grid contrato-form">
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="fechaContrato">Fecha</label>
                                        <Calendar
                                            id="fechaContrato"
                                            value={form.fechaContrato}
                                            onChange={(e) => onInputChange(e.value, 'fechaContrato')}
                                            showIcon
                                            dateFormat="dd/mm/yy"
                                        />
                                    </div>
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="vendedor">Vendedor</label>
                                        <Dropdown
                                            id="vendedor"
                                            value={form.vendedor}
                                            options={vendedorOptions}
                                            onChange={(e) => onInputChange(e.value, 'vendedor')}
                                            placeholder="Seleccione vendedor"
                                            className="w-full"
                                            showClear
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="content-card contrato-card">
                                <div className="card-header">
                                    <h3>Cliente</h3>
                                    <p>Busqueda por DNI o registro manual.</p>
                                </div>

                                <div className="formgrid grid contrato-form">
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="numeroDocumento">Documento</label>
                                        <div className="p-inputgroup">
                                            <InputText
                                                id="numeroDocumento"
                                                value={form.cliente.numeroDocumento}
                                                onChange={(e) => onClienteChange(e.target.value, 'numeroDocumento')}
                                                placeholder="Ingrese DNI"
                                            />
                                            <Button icon="pi pi-search" className="p-button-outlined" type="button" onClick={onBuscarCliente} />
                                        </div>
                                        {clienteFromInteresado && (
                                            <small className="cliente-hint">Cliente encontrado como interesado.</small>
                                        )}
                                    </div>
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="telefono">Telefono</label>
                                        <InputText
                                            id="telefono"
                                            value={form.cliente.telefono}
                                            onChange={(e) => onClienteChange(e.target.value, 'telefono')}
                                            placeholder="Ingrese telefono"
                                        />
                                    </div>
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="email">Correo</label>
                                        <InputText
                                            id="email"
                                            value={form.cliente.email}
                                            onChange={(e) => onClienteChange(e.target.value, 'email')}
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>

                                    <div className="field col-12 md:col-6">
                                        <label htmlFor="nombres">Nombres</label>
                                        <InputText
                                            id="nombres"
                                            value={form.cliente.nombres}
                                            onChange={(e) => onClienteChange(e.target.value, 'nombres')}
                                            placeholder="Ingrese nombres"
                                        />
                                    </div>
                                    <div className="field col-12 md:col-6">
                                        <label htmlFor="apellidos">Apellidos</label>
                                        <InputText
                                            id="apellidos"
                                            value={form.cliente.apellidos}
                                            onChange={(e) => onClienteChange(e.target.value, 'apellidos')}
                                            placeholder="Ingrese apellidos"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="content-card contrato-card">
                                <div className="card-header">
                                    <h3>Lote</h3>
                                    <p>Seleccione un lote disponible con su detalle.</p>
                                </div>

                                <div className="contrato-table">
                                    <DataTable
                                        value={lotesDisponibles}
                                        selectionMode="single"
                                        selection={selectedLote}
                                        onSelectionChange={(e) => onSelectLote(e.value)}
                                        dataKey="id"
                                        paginator
                                        rows={6}
                                        emptyMessage="No hay lotes disponibles."
                                    >
                                        <Column field="urbanizacion" header="Urbanizacion" style={{ minWidth: '160px' }} />
                                        <Column field="etapa" header="Etapa" style={{ minWidth: '140px' }} />
                                        <Column field="manzana" header="Manzana" style={{ minWidth: '120px' }} />
                                        <Column field="numeroLote" header="Lote" style={{ minWidth: '100px' }} />
                                        <Column header="Area" body={formatArea} style={{ minWidth: '120px' }} />
                                        <Column header="Precio" body={formatPrecio} style={{ minWidth: '140px' }} />
                                    </DataTable>
                                </div>
                                {selectedLote && (
                                    <div className="lote-detail">
                                        <span className="detail-label">Detalle:</span>
                                        <span>{`${selectedLote.urbanizacion} / ${selectedLote.etapa} / Mz ${selectedLote.manzana} / Lote ${selectedLote.numeroLote}`}</span>
                                    </div>
                                )}
                            </div>

                            <div className="content-card contrato-card">
                                <div className="card-header">
                                    <h3>Financiamiento</h3>
                                    <p>Detalle de montos y cuotas.</p>
                                </div>

                                <div className="formgrid grid contrato-form">
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="precioTotal">Precio total</label>
                                        <InputNumber
                                            id="precioTotal"
                                            value={form.precioTotal}
                                            onValueChange={(e) => onFinancialChange(e.value, 'precioTotal')}
                                            minFractionDigits={0}
                                            maxFractionDigits={2}
                                            placeholder="Precio total"
                                            useGrouping
                                        />
                                    </div>
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="montoInicial">Monto inicial</label>
                                        <InputNumber
                                            id="montoInicial"
                                            value={form.montoInicial}
                                            onValueChange={(e) => onFinancialChange(e.value, 'montoInicial')}
                                            minFractionDigits={0}
                                            maxFractionDigits={2}
                                            placeholder="Monto inicial"
                                            useGrouping
                                        />
                                    </div>
                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="saldoFinanciar">Saldo a financiar</label>
                                        <InputNumber
                                            id="saldoFinanciar"
                                            value={form.saldoFinanciar}
                                            minFractionDigits={0}
                                            maxFractionDigits={2}
                                            placeholder="Saldo"
                                            useGrouping
                                            disabled
                                        />
                                    </div>

                                    <div className="field col-12 md:col-4">
                                        <label htmlFor="cantidadCuotas">Cantidad de cuotas</label>
                                        <InputNumber
                                            id="cantidadCuotas"
                                            value={form.cantidadCuotas}
                                            onValueChange={(e) => onInputChange(e.value, 'cantidadCuotas')}
                                            min={1}
                                            max={120}
                                            placeholder="Cuotas"
                                        />
                                    </div>
                                    <div className="field col-12 md:col-4 contrato-simular">
                                        <label className="helper-label">Simulacion</label>
                                        <Button label="Simular cuotas" icon="pi pi-calculator" onClick={simularCuotas} className="p-button-outlined" />
                                    </div>
                                </div>
                            </div>

                            <div className="content-card contrato-card">
                                <div className="card-header">
                                    <h3>Cuotas generadas</h3>
                                    <p>Montos y fechas de vencimiento.</p>
                                </div>
                                <div className="contrato-table">
                                    <DataTable value={cuotas} dataKey="numeroCuota" rows={6} paginator emptyMessage="Sin cuotas simuladas.">
                                        <Column field="numeroCuota" header="N°" style={{ width: '80px' }} />
                                        <Column header="Monto" body={(row) => `S/. ${formatNumber(row.montoTotal)}`} style={{ minWidth: '140px' }} />
                                        <Column header="Vencimiento" body={(row) => row.fechaVencimiento?.toLocaleDateString('es-PE')} style={{ minWidth: '160px' }} />
                                        <Column field="estado" header="Estado" style={{ minWidth: '140px' }} />
                                    </DataTable>
                                </div>
                            </div>

                            <div className="contrato-actions">
                                <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined" />
                                <Button label="Guardar contrato" icon="pi pi-check" />
                            </div>
                        </div>

                        <div className="contrato-column contrato-summary">
                            <div className="content-card contrato-card summary-card">
                                <div className="card-header">
                                    <h3>Resumen</h3>
                                    <p>Vista previa de la venta.</p>
                                </div>

                                <div className="summary-section">
                                    <span className="summary-label">Cliente</span>
                                    <span className="summary-value">
                                        {`${form.cliente.nombres || 'Nombres'} ${form.cliente.apellidos || 'Apellidos'}`.trim()}
                                    </span>
                                </div>
                                <div className="summary-section">
                                    <span className="summary-label">Vendedor</span>
                                    <span className="summary-value">{form.vendedor?.label || 'Seleccione vendedor'}</span>
                                </div>
                                <div className="summary-section">
                                    <span className="summary-label">Lote</span>
                                    <span className="summary-value">{form.lote?.label || 'Seleccione lote'}</span>
                                </div>
                                <div className="summary-section">
                                    <span className="summary-label">Precio total</span>
                                    <span className="summary-value">{form.precioTotal ? `S/. ${form.precioTotal}` : '---'}</span>
                                </div>
                                <div className="summary-section">
                                    <span className="summary-label">Saldo a financiar</span>
                                    <span className="summary-value">{form.saldoFinanciar ? `S/. ${form.saldoFinanciar}` : '---'}</span>
                                </div>
                            </div>

                            <div className="content-card contrato-card summary-card">
                                <div className="card-header">
                                    <h3>Estado</h3>
                                    <p>Checklist del flujo de venta.</p>
                                </div>
                                <ul className="summary-list">
                                    <li><i className="pi pi-check-circle"></i> Seleccion de cliente</li>
                                    <li><i className="pi pi-check-circle"></i> Lote seleccionado</li>
                                    <li><i className="pi pi-info-circle"></i> Financiamiento</li>
                                    <li><i className="pi pi-info-circle"></i> Confirmacion final</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contrato;
