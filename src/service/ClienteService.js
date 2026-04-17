import api from '../pages/util/api';

const RESOURCE = 'clientes';

const resolveClient = (httpClient) => httpClient || api;

export const ClienteService = {
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

    crear: async (cliente, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, cliente);
        return response.data;
    },

    actualizar: async (id, cliente, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, cliente);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default ClienteService;
