export const RolComision = {
    VENDEDOR: 'VENDEDOR',
    JEFE_VENTAS: 'JEFE_VENTAS'
};

export const RolComisionOptions = Object.values(RolComision).map((value) => ({
    label: value.replace('_', ' '),
    value
}));
