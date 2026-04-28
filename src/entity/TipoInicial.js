export const TipoInicial = {
    CERO: 'CERO',       // Entró sin pagar inicial (financia el 100%)
    PARCIAL: 'PARCIAL', // Dio un abono, pero aún no completa la inicial requerida
    TOTAL: 'TOTAL'      // Pagó la inicial completa
};

export const TipoInicialOptions = Object.values(TipoInicial).map((value) => ({
    label: value,
    value
}));
