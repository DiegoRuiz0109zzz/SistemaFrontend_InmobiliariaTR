import api from '../pages/util/api';

const RESOURCE = 'reniec';

const resolveClient = (httpClient) => httpClient || api;

export const ReniecService = {
    consultarDNI: async (dni, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/consulta/${dni}`);
        return response.data;
    }
};

export default ReniecService;
