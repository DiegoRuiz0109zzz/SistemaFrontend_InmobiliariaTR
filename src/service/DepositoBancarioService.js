import api from '../pages/util/api';

const RESOURCE = 'depositos-bancarios';

const resolveClient = (httpClient) => httpClient || api;

export const DepositoBancarioService = {
    listarTodos: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/`);
        return response.data;
    },

    listarPorRecibo: async (numeroRecibo, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/recibo/${numeroRecibo}`);
        return response.data;
    },

    obtenerPorId: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/${id}`);
        return response.data;
    }
};

export default DepositoBancarioService;
