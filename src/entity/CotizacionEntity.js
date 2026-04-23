import { EstadoCotizacion } from './EstadoCotizacion';

export const CotizacionEntity = {
    id: null,
    lote: null,
    interesado: null,
    vendedor: null,
    precioTotal: null,
    montoInicialAcordado: null,
    cantidadCuotas: null,
    cuotasEspeciales: null,
    montoCuotaEspecial: null,
    fechaCotizacion: null,
    fechaValidez: null,
    estado: EstadoCotizacion.VIGENTE,
    enabled: true
};
