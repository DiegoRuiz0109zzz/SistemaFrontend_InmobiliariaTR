import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { environment } from "../pages/util/baseUrl.js";
import { applyThemeVariables, generateDarkVariant } from "../config/colorUtils";
import { themeBase } from "../config/themes";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [institutionalTheme, setInstitutionalTheme] = useState(themeBase);
    const [darkMode, setDarkMode] = useState(sessionStorage.getItem('darkMode') === 'true');
    const [loading, setLoading] = useState(true);

    const applyCurrentTheme = useCallback((theme, isDark) => {
        let themeToApply = theme;
        if (isDark) {
            themeToApply = generateDarkVariant(theme);
        }
        applyThemeVariables(themeToApply);
    }, []);

    const loadThemeFromServer = useCallback(async () => {
        try {
            const response = await fetch(`${environment.baseUrl}config/theme`);
            if (response.ok) {
                const theme = await response.json();
                if (theme && theme.primaryColor) {
                    setInstitutionalTheme(theme);
                    applyCurrentTheme(theme, darkMode);
                }
            } else {
                applyCurrentTheme(themeBase, darkMode);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            applyCurrentTheme(themeBase, darkMode);
        } finally {
            setLoading(false);
        }
    }, [darkMode, applyCurrentTheme]);

    const toggleDarkMode = useCallback(() => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        sessionStorage.setItem('darkMode', String(newDarkMode));
        applyCurrentTheme(institutionalTheme, newDarkMode);
    }, [darkMode, institutionalTheme, applyCurrentTheme]);

    const refreshTheme = useCallback((newTheme) => {
        if (newTheme) {
            setInstitutionalTheme(newTheme);
            applyCurrentTheme(newTheme, darkMode);
        } else {
            loadThemeFromServer();
        }
    }, [darkMode, loadThemeFromServer, applyCurrentTheme]);

    useEffect(() => {
        // Carga inicial
        loadThemeFromServer();
    }, [loadThemeFromServer]);

    const value = React.useMemo(() => ({
        institutionalTheme,
        darkMode,
        toggleDarkMode,
        refreshTheme,
        loading
    }), [institutionalTheme, darkMode, toggleDarkMode, refreshTheme, loading]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
