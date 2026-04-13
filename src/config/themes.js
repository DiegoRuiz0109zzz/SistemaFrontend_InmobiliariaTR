/**
 * TEMAS DEL SISTEMA
 * =================
 * 
 * Solo 3 temas disponibles:
 * - base: Azul profesional (por defecto)
 * - aqua: Verde-agua / Teal
 * - dark: Modo oscuro
 */

// ============================================
// TEMA BASE (Azul profesional - Por defecto)
// ============================================
export const themeBase = {
    id: 'base',
    themeKey: 'base',
    name: "Clásico",
    description: "Tema azul profesional",
    primaryColor: "#357ABD",
    backgroundColor: "#f4f7fa",
    topbarColor: "#357ABD",
    topbarTextColor: "#ffffff",
    cardBackground: "#ffffff",
    textPrimary: "#212529",
    textSecondary: "#6c757d",
    isDark: false,
};

// ============================================
// TEMA AQUA (Verde-agua / Teal)
// ============================================
export const themeAqua = {
    id: 'aqua',
    name: "Aqua",
    description: "Tema verde-agua moderno",
    primaryColor: "#00897b",
    backgroundColor: "#e0f2f1",
    topbarColor: "#00897b",
    topbarTextColor: "#ffffff",
    cardBackground: "#ffffff",
    textPrimary: "#212529",
    textSecondary: "#607d8b",
    isDark: false,
};

// ============================================
// TEMA OSCURO (Dark Mode)
// ============================================
export const themeDark = {
    id: 'dark',
    name: "Oscuro",
    description: "Modo oscuro para reducir fatiga visual",
    primaryColor: "#5c6bc0",
    backgroundColor: "#1a1a2e",
    topbarColor: "#16213e",
    topbarTextColor: "#e8e8e8",
    cardBackground: "#1f1f38",
    textPrimary: "#e8e8e8",
    textSecondary: "#a0a0a0",
    isDark: true,
};

// Lista de todos los temas disponibles
export const availableThemes = [
    themeBase,
    themeAqua,
    themeDark,
];

// Obtener tema por ID
export function getThemeById(id) {
    return availableThemes.find(t => t.id === id) || themeBase;
}

/**
 * Genera un tema oscuro a partir de cualquier tema base
 */
export function generateDarkVariant(theme) {
    if (theme.isDark) return theme;

    return {
        ...theme,
        id: `${theme.id}-dark`,
        name: `${theme.name} (Oscuro)`,
        backgroundColor: "#1a1a2e",
        topbarColor: "#16213e",
        topbarTextColor: "#e8e8e8",
        cardBackground: "#1f1f38",
        textPrimary: "#e8e8e8",
        textSecondary: "#a0a0a0",
        isDark: true,
    };
}

// Tema por defecto
export default themeBase;


