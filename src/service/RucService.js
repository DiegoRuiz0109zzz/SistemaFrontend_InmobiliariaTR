import api from '../pages/util/api';

const RESOURCE = 'ruc';

const resolveClient = (httpClient) => httpClient || api;

export const RucService = {
    consultarRUC: async (ruc, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/consulta/${ruc}`);
        return response.data;
    }
};

export default RucService;
