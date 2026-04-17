import { EstadoLote } from './EstadoLote';
import { ManzanaEntity } from './ManzanaEntity';

export const LoteEntity = {
    id: null,
    numero: '',
    area: null,
    precio: null,
    estadoVenta: EstadoLote.DISPONIBLE,
    manzana: { ...ManzanaEntity },
    enabled: true
};