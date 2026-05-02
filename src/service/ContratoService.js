import api from '../pages/util/api';

const RESOURCE = 'contratos';

const resolveClient = (httpClient) => httpClient || api;

export const ContratoService = {
    listar: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    obtener: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/${id}`);
        return response.data;
    },

    simular: async (payload, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/simular`, payload);
        return response.data;
    },

    crear: async (payload, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, payload);
        return response.data;
    },

    generarDocumento: async (id, nuevoEstado, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/${id}/generar-documento`, null, {
            params: { nuevoEstado }
        });
        return response.data;
    }
};

export default ContratoService;
