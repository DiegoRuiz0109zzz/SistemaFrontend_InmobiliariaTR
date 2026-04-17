import api from '../pages/util/api';

const RESOURCE = 'interesados';

const resolveClient = (httpClient) => httpClient || api;

export const InteresadoService = {
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

    crear: async (interesado, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, interesado);
        return response.data;
    },

    actualizar: async (id, interesado, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, interesado);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default InteresadoService;
