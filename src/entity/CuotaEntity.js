import { EstadoCuota } from './EstadoCuota';

export const CuotaEntity = {
    id: null,

    // Relación
    contrato: null,

    // Número de cuota: 0 = Inicial, 1..N = Mensual, 99 = Especial
    numeroCuota: null,

    // Tipo de cuota: 'INICIAL' | 'MENSUAL' | 'ESPECIAL'
    tipoCuota: 'MENSUAL',

    // Importes
    montoTotal: null,
    montoPagado: 0.0,

    // Fecha de vencimiento
    fechaVencimiento: null,

    // Estado: PENDIENTE | PAGADO_PARCIAL | PAGADO_TOTAL | VENCIDO
    estado: EstadoCuota.PENDIENTE,

    enabled: true
};
