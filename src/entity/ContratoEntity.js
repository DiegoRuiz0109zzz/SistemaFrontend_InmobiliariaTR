export const ContratoEntity = {
    id: null,

    // Relaciones
    lote: null,
    cliente: null,
    coCompradorId: null,
    vendedor: null,
    cotizacionOrigen: null,

    // Datos del contrato
    precioTotal: null,

    // Gestión de inicial
    montoInicial: null,
    montoAbonadoIncial: null,   // abono real pagado al momento del contrato
    saldoFinanciar: null,

    cantidadCuotas: null,
    descripcion: '',
    observacion: '',

    // Tipo de inicial: 'SEPARACION' | 'VENTA'
    tipoInicial: null,

    // Cuotas flexibles
    cuotasFlexibles: false,

    // Fechas
    fechaInicioCronograma: null,
    fechaContrato: null,
    fechaRegistro: null,

    // Estado: 'ACTIVO' | 'TERMINADO' | 'CANCELADO'
    estadoContrato: 'ACTIVO',

    enabled: true
};
