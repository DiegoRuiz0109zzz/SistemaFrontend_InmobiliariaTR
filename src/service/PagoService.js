import api from '../pages/util/api';

const RESOURCE = 'pagos';

const resolveClient = (httpClient) => httpClient || api;

export const PagoService = {
    listarPorCuota: async (cuotaId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/cuota/${cuotaId}`);
        return response.data;
    },

    listarReportePagos: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/reporte`);
        return response.data;
    },

    registrar: async (formData, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    procesarPendiente: async (id, formData, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.put(`${RESOURCE}/${id}/procesar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    anular: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        await client.delete(`${RESOURCE}/${id}`);
    },

    descargarNotaVenta: async (id, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/${id}/nota-venta`, {
            responseType: 'blob'
        });
        return response.data;
    },

    descargarComprobantePdf: async (numeroComprobante, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/comprobante/${numeroComprobante}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    descargarReciboIngresoPdf: async (numeroComprobante, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/recibo/${numeroComprobante}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    conciliarCaja: async (numeroRecibo, formData, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.post(`${RESOURCE}/conciliar/${numeroRecibo}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    subirReciboFirmado: async (numeroRecibo, archivoFirmado, httpClient) => {
        const client = resolveClient(httpClient);
        const formData = new FormData();
        formData.append('archivo', archivoFirmado);

        const response = await client.post(`${RESOURCE}/recibo/${numeroRecibo}/firmado`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    obtenerReporteCaja: async (httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/reporte-caja`);
        return response.data;
    }
};

export default PagoService;
