import axios from 'axios';
import store from '../store/store';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});
let alreadyHandled401 = false;

axiosInstance.interceptors.request.use(
    (config) => { return config; },
    (error) => { return Promise.reject(error); }
);

axiosInstance.interceptors.response.use(
    (response) => { 
        alreadyHandled401 = false;
        return response; 
    },
    (error) => { 
        const status = error.response?.status;

        if (status === 401) {
            console.log('Unauthorized access (401) — forcing client logout');
            if (!alreadyHandled401) {
                alreadyHandled401 = true;
                store.dispatch({ type: 'auth/forceLogout' });
            }
        }
        if (error.response?.status === 403) {console.log('Forbidden access');}
        if (error.response?.status === 404) {console.log('Not found');}
        if (error.response?.status === 500) {console.log('Server error');}
        return Promise.reject(error);
    }
)

export default axiosInstance;
