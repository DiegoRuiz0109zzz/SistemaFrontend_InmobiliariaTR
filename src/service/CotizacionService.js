import api from '../pages/util/api';

const RESOURCE = 'cotizaciones';

const resolveClient = (httpClient) => httpClient || api;

export const CotizacionService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    buscarPorDni: async (dni, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/buscar`, {
            params: { dni }
        });
        return response.data;
    },

    crear: async (payload, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, payload);
        return response.data;
    },

    convertir: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}/convertir`);
        return response.data;
    }
};

export default CotizacionService;
