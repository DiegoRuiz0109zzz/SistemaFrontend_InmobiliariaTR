import { EtapaEntity } from './EtapaEntity';

export const ManzanaEntity = {
    id: null,
    nombre: '',
    etapa: { ...EtapaEntity },
    areaTotal: 0,
    enabled: true
};