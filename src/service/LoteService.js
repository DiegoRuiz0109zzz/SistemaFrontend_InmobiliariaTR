import api from '../pages/util/api';

const RESOURCE = 'lotes';

const resolveClient = (httpClient) => httpClient || api;

export const LoteService = {
	listar: async (httpClient) => {
		const client = resolveClient(httpClient);
		const response = await client.get(`${RESOURCE}/`);
		return response.data;
	},

	listarPorManzana: async (manzanaId, httpClient) => {
		const client = resolveClient(httpClient);
		const response = await client.get(`${RESOURCE}/manzana/${manzanaId}`);
		return response.data;
	},

	listarPaginado: async (page = 0, size = 10, search = null, manzanaId = null, httpClient) => {
		const client = resolveClient(httpClient);
		const params = {
			page,
			size
		};
		if (search && search.trim()) {
			params.search = search.trim();
		}
		if (manzanaId) {
			params.manzanaId = manzanaId;
		}
		const response = await client.get(`${RESOURCE}/page`, { params });
		return response.data;
	},

	calcularCosto: async (area, precioMetroCuadrado, httpClient) => {
		const client = resolveClient(httpClient);
		const response = await client.get(`${RESOURCE}/calcular-costo`, {
			params: { area, precioMetroCuadrado }
		});
		return response.data;
	},

	crear: async (lote, httpClient) => {
		const client = resolveClient(httpClient);
		const response = await client.post(`${RESOURCE}/`, lote);
		return response.data;
	},

	actualizar: async (id, lote, httpClient) => {
		const client = resolveClient(httpClient);
		const response = await client.put(`${RESOURCE}/${id}`, lote);
		return response.data;
	},

	eliminar: async (id, httpClient) => {
		const client = resolveClient(httpClient);
		await client.delete(`${RESOURCE}/${id}`);
	}
};

export default LoteService;
