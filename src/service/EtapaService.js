import api from '../pages/util/api';

const RESOURCE = 'etapas';

const resolveClient = (httpClient) => httpClient || api;

export const EtapaService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    listarPorUrbanizacion: async (urbanizacionId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/urbanizacion/${urbanizacionId}`);
        return response.data;
    },

    crear: async (etapa, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, etapa);
        return response.data;
    },

    actualizar: async (id, etapa, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, etapa);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default EtapaService;
