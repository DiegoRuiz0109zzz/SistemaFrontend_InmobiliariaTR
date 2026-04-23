import { EstadoLote } from './EstadoLote';
import { ManzanaEntity } from './ManzanaEntity';

export const LoteEntity = {
	id: null,
	numero: '',
	area: null,
	precioMetroCuadrado: null,
	precioCosto: null,
	precioVenta: null,
	estadoVenta: EstadoLote.DISPONIBLE,
	manzana: { ...ManzanaEntity },
	enabled: true
};
