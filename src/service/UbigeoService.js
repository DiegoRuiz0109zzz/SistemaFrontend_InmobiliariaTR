import api from '../pages/util/api';

const RESOURCE = 'ubigeos';

const resolveClient = (httpClient) => httpClient || api;

export const UbigeoService = {
    listarDepartamentos: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/departamentos`);
        return response.data;
    },

    listarProvincias: async (departamento, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/provincias/${encodeURIComponent(departamento)}`);
        return response.data;
    },

    listarDistritos: async (departamento, provincia, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/distritos/${encodeURIComponent(departamento)}/${encodeURIComponent(provincia)}`);
        return response.data;
    }
};

export default UbigeoService;