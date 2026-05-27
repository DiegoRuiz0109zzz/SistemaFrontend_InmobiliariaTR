export const TipoComprobante = {
    NOTA_VENTA: 'NOTA_VENTA',
    BOLETA: 'BOLETA',
    FACTURA: 'FACTURA',
    NOTA_CREDITO: 'NOTA_CREDITO',
    NOTA_DEBITO: 'NOTA_DEBITO',
    RECIBO_INGRESO: 'RECIBO_INGRESO'
};

export const TipoComprobanteOptions = [
    { label: 'Nota de Venta', value: TipoComprobante.NOTA_VENTA },
    { label: 'Boleta', value: TipoComprobante.BOLETA },
    { label: 'Factura', value: TipoComprobante.FACTURA },
    { label: 'Nota de Crédito', value: TipoComprobante.NOTA_CREDITO },
    { label: 'Nota de Débito', value: TipoComprobante.NOTA_DEBITO },
    { label: 'Recibo de Ingreso', value: TipoComprobante.RECIBO_INGRESO }
];
