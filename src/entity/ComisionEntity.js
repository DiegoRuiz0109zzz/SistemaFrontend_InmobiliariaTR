import { EstadoComision } from './EstadoComision';
import { RolComision } from './RolComision';
import { ContratoEntity } from './ContratoEntity';
import { VendedorEntity } from './VendedorEntity';
import { UsuarioEntity } from './UsuarioEntity';

export const ComisionEntity = {
    id: null,
    contrato: { ...ContratoEntity },
    rolBeneficiario: RolComision.VENDEDOR,
    vendedor: { ...VendedorEntity },
    jefeVentas: { ...UsuarioEntity },
    montoBase: 0.0,
    montoBonoDiferencia: 0.0,
    totalComision: 0.0,
    estadoPago: EstadoComision.PENDIENTE,
    observacionPago: '',
    fechaPago: null,
    fechaGeneracion: null
};
