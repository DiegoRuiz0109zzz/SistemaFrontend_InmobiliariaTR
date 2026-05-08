import api from '../pages/util/api';

const RESOURCE = 'contrato-historial';

const resolveClient = (httpClient) => httpClient || api;

export const ContratoHistorialService = {
    listarPorContrato: async (contratoId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/contrato/${contratoId}`);
        return response.data;
    },

    obtener: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/${id}`);
        return response.data;
    },

    eliminar: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    },

    subirPdf: async (contratoId, tipoRegistro, observacion, archivo, httpClient) => {
        const client = resolveClient(httpClient);
        const formData = new FormData();
        formData.append('tipoRegistro', tipoRegistro);
        formData.append('observacion', observacion);
        formData.append('archivo', archivo);

        const response = await client.post(`${RESOURCE}/${contratoId}/subir-pdf`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    descargarPdf: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/${id}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export default ContratoHistorialService;
