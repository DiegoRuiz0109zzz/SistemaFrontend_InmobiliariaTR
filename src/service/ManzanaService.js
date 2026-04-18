import api from '../pages/util/api';

const RESOURCE = 'manzanas';

const resolveClient = (httpClient) => httpClient || api;

export const ManzanaService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    listarPorEtapa: async (etapaId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/etapa/${etapaId}`);
        return response.data;
    },

    crear: async (manzana, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, manzana);
        return response.data;
    },

    actualizar: async (id, manzana, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, manzana);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default ManzanaService;
