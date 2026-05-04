import api from '../pages/util/api';

const RESOURCE = 'dashboard';

const resolveClient = (httpClient) => httpClient || api;

export const DashboardService = {
    getDashboardData: async (urbanizacionId, etapaId, manzanaId, anio, axiosInstance) => {
        // Validación de seguridad para asegurar que el token viaja
        if (!axiosInstance) {
            console.error("Crítico: No se proporcionó axiosInstance a DashboardService");
            throw new Error("axiosInstance es requerido para la autenticación.");
        }

        // Usamos URLSearchParams para armar la URL de forma limpia y segura
        const params = new URLSearchParams();
        if (urbanizacionId) params.append('urbanizacionId', urbanizacionId);
        if (etapaId) params.append('etapaId', etapaId);
        if (manzanaId) params.append('manzanaId', manzanaId);
        if (anio) params.append('anio', anio);
        
        try {
            // Nota: En tu proyecto, axiosInstance ya tiene configurado el baseURL (ej: /api)
            // por lo que solo llamamos a 'dashboard'
            const response = await axiosInstance.get('dashboard', { params });
            return response.data;
        } catch (error) {
            console.error("Error al obtener los datos del dashboard:", error);
            throw error;
        }
    }
};

export default DashboardService;
