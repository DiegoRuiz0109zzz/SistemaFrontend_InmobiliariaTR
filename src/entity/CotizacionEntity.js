import { EstadoCotizacion } from './EstadoCotizacion';

export const CotizacionEntity = {
    id: null,

    // Relaciones
    lote: null,
    interesado: null,
    coComprador: null,
    coCompradorId: null,
    vendedor: null,

    // Tipo de inicial: 'SEPARACION' | 'VENTA'
    tipoInicial: null,

    // Financiamiento
    precioTotal: null,
    montoInicialAcordado: null,
    cantidadCuotas: null,

    detalleTramos: '',
    montoCuotaCotizacion: null,
    saldoFinanciar: null,
    cuotasFlexibles: false,

    // Fechas
    fechaCotizacion: null,
    fechaValidez: null,

    // Estado: VIGENTE | CONVERTIDA | VENCIDA
    estado: EstadoCotizacion.VIGENTE,

    enabled: true
};
