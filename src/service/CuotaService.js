import api from '../pages/util/api';

const RESOURCE = 'cuotas';

const resolveClient = (httpClient) => httpClient || api;

export const CuotaService = {
    listarPorContrato: async (contratoId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/contrato/${contratoId}`);
        return response.data;
    },

    actualizar: async (id, cuota, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, cuota);
        return response.data;
    }
};

export default CuotaService;
