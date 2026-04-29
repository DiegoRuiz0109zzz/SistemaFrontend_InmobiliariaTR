export const TipoCuota = {
    INICIAL: 'INICIAL',
    MENSUAL: 'MENSUAL',
    ESPECIAL: 'ESPECIAL'
};

export const TipoCuotaOptions = Object.values(TipoCuota).map((value) => ({
    label: value,
    value
}));
