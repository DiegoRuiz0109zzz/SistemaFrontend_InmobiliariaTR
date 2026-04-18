import api from '../pages/util/api';

const RESOURCE = 'vendedores';

const resolveClient = (httpClient) => httpClient || api;

export const VendedorService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    crear: async (vendedor, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, vendedor);
        return response.data;
    },

    actualizar: async (id, vendedor, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, vendedor);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default VendedorService;
