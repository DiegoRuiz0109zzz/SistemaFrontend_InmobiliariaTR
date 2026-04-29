/**
 * Utilidades para validación y manejo del campo N° de documento
 * según tipo: DNI (8 dígitos numéricos) | CE (9 dígitos numéricos) | RUC (11 dígitos numéricos)
 */

/** Configuración por tipo de documento */
export const DOCUMENTO_CONFIG = {
    DNI: { maxLength: 8,  soloNumeros: true,  label: 'DNI' },
    CE:  { maxLength: 9,  soloNumeros: true,  label: 'Carnet de Extranjería' },
    RUC: { maxLength: 11, soloNumeros: true,  label: 'RUC' },
};

/**
 * Filtra el valor ingresado según las reglas del tipo de documento.
 * Devuelve el valor limpio (solo números, con maxLength aplicado).
 * Si el tipo no está en la config, permite cualquier valor hasta 20 chars.
 *
 * @param {string} value - Valor crudo del input
 * @param {string} tipoDocumento - 'DNI' | 'CE' | 'RUC'
 * @returns {string} Valor filtrado y truncado
 */
export const filtrarDocumento = (value, tipoDocumento) => {
    const config = DOCUMENTO_CONFIG[tipoDocumento];
    if (!config) return value.slice(0, 20);

    // Solo números si aplica
    const cleaned = config.soloNumeros ? value.replace(/\D/g, '') : value;

    // Aplicar maxLength
    return cleaned.slice(0, config.maxLength);
};

/**
 * Valida si un número de documento cumple con las reglas del tipo.
 * @param {string} value - Valor a validar
 * @param {string} tipoDocumento - 'DNI' | 'CE' | 'RUC'
 * @returns {{ valid: boolean, message: string }}
 */
export const validarDocumento = (value, tipoDocumento) => {
    const config = DOCUMENTO_CONFIG[tipoDocumento];
    const trimmed = (value || '').trim();

    if (!trimmed) {
        return { valid: false, message: 'El número de documento es obligatorio.' };
    }

    if (!config) {
        return { valid: true, message: '' };
    }

    if (config.soloNumeros && /\D/.test(trimmed)) {
        return { valid: false, message: `El ${config.label} solo debe contener números.` };
    }

    if (trimmed.length !== config.maxLength) {
        return { valid: false, message: `El ${config.label} debe tener exactamente ${config.maxLength} dígitos.` };
    }

    return { valid: true, message: '' };
};

/**
 * Placeholder dinámico según tipo de documento.
 */
export const placeholderDocumento = (tipoDocumento) => {
    const config = DOCUMENTO_CONFIG[tipoDocumento];
    if (!config) return 'Ingrese documento';
    return `Ingrese ${config.maxLength} dígitos`;
};

/**
 * maxLength dinámico según tipo de documento.
 */
export const maxLengthDocumento = (tipoDocumento) => {
    return DOCUMENTO_CONFIG[tipoDocumento]?.maxLength || 20;
};
