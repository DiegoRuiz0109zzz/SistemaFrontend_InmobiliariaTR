import api from '../pages/util/api';

const RESOURCE = 'empresa';

const resolveClient = (httpClient) => httpClient || api;

export const EmpresaService = {
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

    crear: async (empresa, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, empresa);
        return response.data;
    },

    actualizar: async (id, empresa, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, empresa);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default EmpresaService;