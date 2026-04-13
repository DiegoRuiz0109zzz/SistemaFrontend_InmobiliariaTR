import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { environment } from "../pages/util/baseUrl.js";

const axiosInstance = axios.create({
    baseURL: environment.baseUrl,
    withCredentials: true // Permite el envío automático de cookies HttpOnly
});

// Ya no necesitamos el interceptor de Authorization porque el navegador envía la cookie automáticamente
const AuthContext = createContext(null);

let authContextState = { user: null, loading: true };

export const getAuthContext = () => authContextState;

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        authContextState = { user, loading };
    }, [user, loading]);

    const login = async (username, password) => {
        try {
            const response = await axiosInstance.post("auth/authenticate", { username, password });
            if (response.status === 200) {
                // El token ya no viene en el cuerpo, está seguro en la cookie HttpOnly
                const userData = {
                    username: username,
                    id: response.data.id || 'Rumpelz',
                    role: response.data.role || 'USER',
                    permissions: response.data.permissions || [],
                    profileImage: response.data.profileImage || null,
                };

                setUser(userData);
                sessionStorage.setItem('user', JSON.stringify(userData));

                return userData;
            } else {
                throw new Error('Error en la autenticación.');
            }
        } catch (error) {
            console.error("Error en la autenticación:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post("auth/logout");
        } catch (error) {
            console.error("Error al cerrar sesión en el servidor:", error);
        } finally {
            setUser(null);
            sessionStorage.removeItem('user');
        }
    };

    // Actualizar datos del usuario (ej: cuando se cambia la imagen de perfil)
    const updateUserProfile = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUserProfile,
        axiosInstance
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
