import { EstadoCotizacion } from './EstadoCotizacion';

export const CotizacionEntity = {
    id: null,

    // Relaciones
    lote: null,
    interesado: null,
    vendedor: null,

    // Tipo de inicial: 'SEPARACION' | 'VENTA'
    tipoInicial: null,

    // Financiamiento
    precioTotal: null,
    montoInicialAcordado: null,
    cantidadCuotas: null,

    // Cuotas especiales (flexibles)
    cuotasEspeciales: null,
    montoCuotaEspecial: null,
    cuotasFlexibles: false,

    montoCuotaCotizacion:null,
    saldoFinanciar: null,

    // Fechas
    fechaCotizacion: null,
    fechaValidez: null,

    // Estado: VIGENTE | CONVERTIDA | VENCIDA
    estado: EstadoCotizacion.VIGENTE,

    enabled: true
};
