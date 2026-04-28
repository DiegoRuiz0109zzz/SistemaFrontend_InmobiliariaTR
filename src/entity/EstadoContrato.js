export const EstadoContrato = {
    SEPARADO: 'SEPARADO',     // Abono parcial de inicial
    ACTIVO: 'ACTIVO',         // Venta Final concretada
    RESUELTO: 'RESUELTO',     // Contrato anulado por falta de pago
    FINALIZADO: 'FINALIZADO'  // Todo pagado al 100%
};

export const EstadoContratoOptions = Object.values(EstadoContrato).map((value) => ({
    label: value,
    value
}));
