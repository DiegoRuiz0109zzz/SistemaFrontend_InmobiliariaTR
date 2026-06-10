import { CuotaEntity } from './CuotaEntity';

export const PagoEntity = {
    id: null,
    cuota: { ...CuotaEntity },
    montoAbonado: null,
    numeroComprobante: '',
    tipoComprobante: '',
    fotoVoucherUrl: '',
    metodoPago: '',
    numeroOperacion: '',
    descripcion: '',
    estado: 'PROCESADO',
    fechaPago: null,
    enabled: true
};
