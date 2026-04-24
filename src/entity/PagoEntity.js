import { CuotaEntity } from './CuotaEntity';

export const PagoEntity = {
    id: null,
    cuota: { ...CuotaEntity },
    montoAbonado: null,
    fotoVoucherUrl: '',
    metodoPago: '',
    numeroOperacion: '',
    estado: 'PROCESADO',
    fechaPago: null,
    enabled: true
};
