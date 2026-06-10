import api from '../pages/util/api';

const RESOURCE = 'pagos';

const resolveClient = (httpClient) => httpClient || api;

export const PagoService = {
    listarPorCuota: async (cuotaId, httpClient) => {
        const client = resolveClient(httpClient);
        const response = await client.get(`${RESOURCE}/cuota/${cuotaId}`);
        return response.data;
    },

    listarPagosPaginados: async (page = 0, size = 10, filtros = {}, httpClient) => {
        const client = resolveClient(httpClient);
        let url = `${RESOURCE}/?page=${page}&size=${size}`;
        
        if (filtros.metodoPago) url += `&metodoPago=${encodeURIComponent(filtros.metodoPago)}`;
        if (filtros.tipoComprobante) url += `&tipoComprobante=${encodeURIComponent(filtros.tipoComprobante)}`;
        if (filtros.estado) url += `&estado=${encodeURIComponent(filtros.estado)}`;
        if (filtros.fechaDesde) url += `&fechaDesde=${encodeURIComponent(filtros.fechaDesde)}`;
        if (filtros.fechaHasta) url += `&fechaHasta=${encodeURIComponent(filtros.fechaHasta)}`;
        
        const response = await client.get(url);
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
