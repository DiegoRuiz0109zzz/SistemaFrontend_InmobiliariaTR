import { CuotaEntity } from './CuotaEntity';

export const PagoEntity = {
    id: null,
    cuota: { ...CuotaEntity },
    montoAbonado: null,
    fotoVoucherUrl: '',
    fechaPago: null,
    enabled: true
};
