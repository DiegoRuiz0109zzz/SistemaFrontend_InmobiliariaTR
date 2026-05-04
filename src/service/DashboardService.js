import api from '../pages/util/api';

const RESOURCE = 'dashboard';

const resolveClient = (httpClient) => httpClient || api;

export const DashboardService = {
    getDashboardData: async (urbanizacionId, etapaId, manzanaId, anio, httpClient) => {
        const client = resolveClient(httpClient);
        let url = `${RESOURCE}?`;
        if (urbanizacionId) url += `urbanizacionId=${urbanizacionId}&`;
        if (etapaId) url += `etapaId=${etapaId}&`;
        if (manzanaId) url += `manzanaId=${manzanaId}&`;
        if (anio) url += `anio=${anio}&`;
        
        try {
            const response = await client.get(url);
            return response.data;
        } catch (error) {
            console.error("Error fetching dashboard data", error);
            throw error;
        }
    }
};

export default DashboardService;
