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

    actualizar: async (id, payload, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}`, payload);
        return response.data;
    },

    completarMedidas: async (id, payload, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}/completar-medidas`, payload);
        return response.data;
    },

    subirDocumentoFirmado: async (id, archivo, motivo, httpClient) => {
        const client = resolveClient(httpClient);
        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('motivo', motivo);
        const response = await client.post(`${RESOURCE}/${id}/subir-documento`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    registrarHitoOficial: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/${id}/registrar-hito-oficial`);
        return response.data;
    },

    generarVistaPreviaPdf: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/${id}/vista-previa`, {
            responseType: 'blob'
        });
        return response.data;
    }
    ,
    obtenerVistaPreviaUrl: (id) => {
        // Devuelve URL completa para abrir la vista previa en nueva pestaña
        return `${window.location.origin}/api/${RESOURCE}/${id}/vista-previa`;
    }
};

export default ContratoService;
