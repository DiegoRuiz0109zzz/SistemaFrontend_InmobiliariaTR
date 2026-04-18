import api from '../pages/util/api';

const RESOURCE = 'lotes';

const resolveClient = (httpClient) => httpClient || api;

export const LoteService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    listarPorManzana: async (manzanaId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/manzana/${manzanaId}`);
        return response.data;
    },

    crear: async (lote, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, lote);
        return response.data;
    },

    actualizar: async (id, lote, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, lote);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default LoteService;
