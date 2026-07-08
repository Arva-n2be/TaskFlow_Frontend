import axios from 'axios';

const api = axios.create({
    baseURL: 'https://taskflow-backend-sooty.vercel.app',
});

// Interceptor: Otomatis sisipkan Token ke setiap request ke backend
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;