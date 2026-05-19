export const EstadoComision = {
    PENDIENTE: 'PENDIENTE',
    PAGADO: 'PAGADO',
    ANULADO: 'ANULADO'
};

export const EstadoComisionOptions = Object.values(EstadoComision).map((value) => ({
    label: value.replace('_', ' '),
    value
}));
