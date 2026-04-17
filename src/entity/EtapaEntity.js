import { UrbanizacionEntity } from './UrbanizacionEntity';

export const EtapaEntity = {
    id: null,
    nombre: '',
    urbanizacion: { ...UrbanizacionEntity },
    enabled: true
};