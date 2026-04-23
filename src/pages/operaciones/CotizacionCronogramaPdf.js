import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return value;
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numericValue);
};

const formatDate = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-PE');
};

export const generarCronogramaPdf = ({ cotizacion, cuotas }) => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Cronograma de Cotizacion', 14, 18);

    doc.setFontSize(10);
    const interesado = cotizacion?.interesado || {};
    const vendedor = cotizacion?.vendedor || {};
    const lote = cotizacion?.lote || {};
    const urbanizacion = lote?.manzana?.etapa?.urbanizacion?.nombre || '';
    const etapa = lote?.manzana?.etapa?.nombre || '';
    const manzana = lote?.manzana?.nombre || '';
    const numero = lote?.numero || '';

    const headerLines = [
        `Interesado: ${`${interesado.nombres || ''} ${interesado.apellidos || ''}`.trim()}`,
        `Documento: ${interesado.tipoDocumento || ''} ${interesado.numeroDocumento || ''}`,
        `Vendedor: ${`${vendedor.nombres || ''} ${vendedor.apellidos || ''}`.trim()}`,
        `Lote: ${`${urbanizacion} / ${etapa} / Mz ${manzana} - Lote ${numero}`.trim()}`,
        `Precio total: S/. ${formatNumber(cotizacion?.precioTotal)}`,
        `Monto inicial: S/. ${formatNumber(cotizacion?.montoInicialAcordado)}`,
        `Cantidad de cuotas: ${cotizacion?.cantidadCuotas || ''}`,
        `Fecha cotizacion: ${formatDate(cotizacion?.fechaCotizacion)}`,
        `Fecha validez: ${formatDate(cotizacion?.fechaValidez)}`
    ];

    headerLines.forEach((line, index) => {
        doc.text(line, 14, 28 + index * 6);
    });

    const tableRows = (cuotas || []).map((cuota) => [
        cuota?.numeroCuota ?? '',
        `S/. ${formatNumber(cuota?.monto)}`,
        formatDate(cuota?.fechaVencimiento)
    ]);

    autoTable(doc, {
        startY: 90,
        head: [['N°', 'Monto', 'Fecha vencimiento']],
        body: tableRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243] }
    });

    doc.save('cronograma-cotizacion.pdf');
};
