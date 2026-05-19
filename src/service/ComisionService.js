import api from '../pages/util/api';

const RESOURCE = 'comisiones';

const resolveClient = (httpClient) => httpClient || api;

export const ComisionService = {
    listarTodas: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    listarPorContrato: async (contratoId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/contrato/${contratoId}`);
        return response.data;
    },

    cambiarEstadoPago: async (id, payload, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}/cambiar-estado`, payload);
        return response.data;
    }
};

export default ComisionService;
