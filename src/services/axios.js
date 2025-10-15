import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    (config) => { return config; },
    (error) => { return Promise.reject(error); }
);

axiosInstance.interceptors.response.use(
    (response) => { return response; },
    (error) => { 
        if (error.response?.status === 401) {console.log('Unauthorized access');}
        if (error.response?.status === 403) {console.log('Forbidden access');}
        if (error.response?.status === 404) {console.log('Not found');}
        if (error.response?.status === 500) {console.log('Server error');}
        return Promise.reject(error);
    }
)

export default axiosInstance;
