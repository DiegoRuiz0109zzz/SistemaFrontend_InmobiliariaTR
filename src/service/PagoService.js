import api from '../pages/util/api';

const RESOURCE = 'pagos';

const resolveClient = (httpClient) => httpClient || api;

export const PagoService = {
    listarPorCuota: async (cuotaId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/cuota/${cuotaId}`);
        return response.data;
    },

    registrar: async (pagoRequest, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, pagoRequest);
        return response.data;
    },

    anular: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    }
};

export default PagoService;
