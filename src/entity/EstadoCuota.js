export const EstadoCuota = {
    PENDIENTE: 'PENDIENTE',
    PAGADA: 'PAGADA',
    VENCIDA: 'VENCIDA'
};

export const EstadoCuotaOptions = Object.values(EstadoCuota).map((value) => ({
    label: value,
    value
}));
