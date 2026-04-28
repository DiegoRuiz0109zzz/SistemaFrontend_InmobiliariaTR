export const EstadoCuota = {
    PENDIENTE: 'PENDIENTE',
    PAGADO_PARCIAL: 'PAGADO_PARCIAL',
    PAGADO_TOTAL: 'PAGADO_TOTAL',
    VENCIDO: 'VENCIDO'
};

export const EstadoCuotaOptions = Object.values(EstadoCuota).map((value) => ({
    label: value.replace('_', ' '),
    value
}));
