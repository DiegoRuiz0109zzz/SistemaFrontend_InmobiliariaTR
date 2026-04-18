import { EstadoCuota } from './EstadoCuota';

export const CuotaEntity = {
    id: null,
    contrato: null,
    numeroCuota: null,
    montoTotal: null,
    montoPagado: 0,
    fechaVencimiento: null,
    estado: EstadoCuota.PENDIENTE,
    enabled: true
};
