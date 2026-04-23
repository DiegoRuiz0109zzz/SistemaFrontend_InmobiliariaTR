export const EstadoCotizacion = {
    VIGENTE: 'VIGENTE',
    CONVERTIDA: 'CONVERTIDA',
    VENCIDA: 'VENCIDA'
};

export const EstadoCotizacionOptions = Object.values(EstadoCotizacion).map((value) => ({
    label: value,
    value
}));
