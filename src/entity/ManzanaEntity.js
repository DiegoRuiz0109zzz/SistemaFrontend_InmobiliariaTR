import { EtapaEntity } from './EtapaEntity';

export const ManzanaEntity = {
    id: null,
    nombre: '',
    etapa: { ...EtapaEntity },
    enabled: true
};