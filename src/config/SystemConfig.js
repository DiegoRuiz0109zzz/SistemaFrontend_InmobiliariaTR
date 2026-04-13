/**
 * CONFIGURACIÓN GLOBAL DEL SISTEMA
 * ==================================
 * 
 * Para cambiar el tema institucional:
 * 1. Modifica el ID del tema en CURRENT_THEME_ID
 * 2. O usa la página de Temas (solo superadmin)
 * 
 * Temas disponibles: base, educacion, salud, gobierno, corporativo, creativo, naranja, rojo
 */

import { getThemeById } from './themes';

// ▼▼▼ CAMBIA AQUÍ EL TEMA (por ID) ▼▼▼
const CURRENT_THEME_ID = 'salud';
// ▲▲▲ CAMBIA AQUÍ EL TEMA ▲▲▲

// Obtener tema actual (desde sessionStorage si existe, sino del config)
const savedThemeId = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('currentThemeId')
    : null;
const currentTheme = getThemeById(savedThemeId || CURRENT_THEME_ID);

export const SystemConfig = {

    // ============================================
    // CONFIGURACIÓN DEL NAVEGADOR
    // ============================================
    browserTitle: "Sistema Gestión",

    // ============================================
    // INFORMACIÓN DEL SISTEMA
    // ============================================
    appName: "Sistema Base",
    appDescription: "Sistema de Gestión de Usuarios",

    // ============================================
    // RECURSOS (logos, imágenes)
    // ============================================
    logoPath: "/logo.png", // Archivo en carpeta public/

    // ============================================
    // FOOTER
    // ============================================
    footerText: "Sistema Base - © {year}",

    // ============================================
    // TEMA ACTUAL (objeto completo)
    // ============================================
    theme: currentTheme,

    // ID del tema por defecto (para reset)
    defaultThemeId: CURRENT_THEME_ID,
};
