import axios from 'axios';
import { getAuthContext } from '../context/AuthContext';
import { environment } from './baseUrl';

const api = axios.create({
    baseURL: environment.baseUrl,
});

api.interceptors.request.use(
    (config) => {
        const authContext = getAuthContext();
        const user = authContext.user;
        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
