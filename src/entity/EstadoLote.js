export const EstadoLote = {
    DISPONIBLE: 'DISPONIBLE',
    RESERVADO: 'RESERVADO',
    VENDIDO: 'VENDIDO'
};

export const EstadoLoteOptions = Object.values(EstadoLote).map((value) => ({
    label: value,
    value
}));