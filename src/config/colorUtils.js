/**
 * Utilidades de Color para Sistema de Temas
 * ==========================================
 * 
 * Funciones para calcular variantes de color y contraste automático.
 */

/**
 * Convierte color HEX a RGB
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Convierte RGB a HEX
 */
export function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

/**
 * Calcula la luminosidad relativa de un color (0-1)
 * Según WCAG 2.0
 */
export function getLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determina si el texto debe ser blanco o negro para máximo contraste
 */
export function getContrastText(backgroundColor) {
    const luminance = getLuminance(backgroundColor);
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

/**
 * Oscurece un color en un porcentaje dado
 */
export function darkenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const factor = 1 - (percent / 100);
    return rgbToHex(
        rgb.r * factor,
        rgb.g * factor,
        rgb.b * factor
    );
}

/**
 * Aclara un color en un porcentaje dado
 */
export function lightenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const factor = percent / 100;
    return rgbToHex(
        rgb.r + (255 - rgb.r) * factor,
        rgb.g + (255 - rgb.g) * factor,
        rgb.b + (255 - rgb.b) * factor
    );
}

/**
 * Genera todas las variantes de un color principal
 */
export function generateColorVariants(primaryColor) {
    return {
        primary: primaryColor,
        primaryDark: darkenColor(primaryColor, 20),
        primaryLight: lightenColor(primaryColor, 85),
        primaryHover: darkenColor(primaryColor, 10),
        textOnPrimary: getContrastText(primaryColor),
        // Variante para fondos de hover suaves
        primarySoft: lightenColor(primaryColor, 90),
    };
}

/**
 * Genera el objeto completo de variables CSS para un tema
 */
export function generateThemeVariables(theme) {
    const variants = generateColorVariants(theme.primaryColor || '#3B82F6');

    return {
        // Colores del tema
        '--theme-primary': variants.primary,
        '--theme-primary-dark': variants.primaryDark,
        '--theme-primary-light': variants.primaryLight,
        '--theme-primary-hover': variants.primaryHover,
        '--theme-primary-soft': variants.primarySoft,
        '--text-on-primary': variants.textOnPrimary,

        // Fondos
        '--bg-page': theme.backgroundColor || '#f5f5f5',
        '--bg-card': theme.cardBackground || '#ffffff',
        '--bg-header': variants.primary,

        // Textos
        '--text-primary': theme.textPrimary || '#212529',
        '--text-secondary': theme.textSecondary || '#6c757d',
        '--text-muted': '#9ca3af',

        // Topbar
        '--topbar-bg': theme.topbarColor || variants.primary,
        '--topbar-text': theme.topbarTextColor || variants.textOnPrimary,

        // Estados
        '--state-success': theme.successColor || '#28a745',
        '--state-warning': theme.warningColor || '#ffc107',
        '--state-danger': theme.dangerColor || '#dc3545',

        // Bordes
        '--border-color': theme.isDark ? '#3a3a5a' : '#e3e9f0',
        '--border-light': theme.isDark ? '#2a2a4a' : '#f0f0f0',

        // Sombras
        '--shadow-sm': theme.isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        '--shadow-md': theme.isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',

        // Compatibilidad con variables antiguas
        '--primary-color': variants.primary,
        '--secondary-color': theme.textSecondary || '#6c757d',
        '--accent-color': variants.primary,
        '--background-color': theme.backgroundColor || '#f5f5f5',
    };
}

/**
 * Aplica las variables CSS al documento
 */
export function applyThemeVariables(theme) {
    const variables = generateThemeVariables(theme);
    const root = document.documentElement;

    Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

/**
 * Genera un tema oscuro a partir de cualquier tema base
 */
export function generateDarkVariant(theme) {
    if (theme.isDark) return theme;

    return {
        ...theme,
        themeKey: `${theme.themeKey || theme.id || 'base'}-dark`,
        name: `${theme.name} (Oscuro)`,
        backgroundColor: "#0f172a", // Midnight Sky
        topbarColor: "#1e293b",     // Slate 800
        topbarTextColor: "#ffffff",
        cardBackground: "#1e293b",  // Slate 800
        textPrimary: "#f3f4f6",     // Gray 100
        textSecondary: "#9ca3af",   // Gray 400
        isDark: true,
    };
}
