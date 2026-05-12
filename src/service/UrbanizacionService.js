import api from '../pages/util/api';

const RESOURCE = 'urbanizaciones';

const resolveClient = (httpClient) => httpClient || api;

export const UrbanizacionService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    listarPaginado: async (page = 0, size = 10, search = null, httpClient) => {
        const client = resolveClient(httpClient);
        const params = {
            page,
            size
        };
        if (search && search.trim()) {
            params.search = search.trim();
        }
        const response = await client.get(`${RESOURCE}/page`, { params });
        return response.data;
    },

    crear: async (urbanizacion, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, urbanizacion);
        return response.data;
    },

    actualizar: async (id, urbanizacion, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, urbanizacion);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default UrbanizacionService;
