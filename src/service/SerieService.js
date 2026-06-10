import api from '../pages/util/api';

const RESOURCE = 'series';

const resolveClient = (httpClient) => httpClient || api;

export const SerieService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    obtenerPorId: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/${id}`);
        return response.data;
    },

    crear: async (serie, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, serie);
        return response.data;
    },

    actualizar: async (id, serie, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, serie);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    },

    toggleActivo: async (id, activo, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.patch(`${RESOURCE}/${id}/toggle-activo`, null, { params: { activo } });
        return response.data;
    }
};

export default SerieService;
