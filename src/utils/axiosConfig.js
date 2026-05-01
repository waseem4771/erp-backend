import axios from 'axios';

/**
 * Global API Client Configuration
 * Purpose: Automatically attaches the authenticated User ID to all outgoing requests.
 * Logic: Required for the Backend RBAC (Role-Based Access Control) Middleware.
 */
const api = axios.create({
    // Replace with your production server URL when deploying to Hostinger
    baseURL: 'http://localhost:5000/api'
});

/**
 * Request Interceptor
 * Injects the security headers (x-user-id) from LocalStorage before the request hits the server.
 */
api.interceptors.request.use((config) => {
    // Ensuring code runs only on the client side (browser)
    if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('vimal_user_id');
        
        if (userId) {
            // This header is expected by the 'checkPermission' middleware in the Backend
            config.headers['x-user-id'] = userId;
        }
    }
    return config;
}, (error) => {
    // Handles cases where the request configuration fails
    return Promise.reject(error);
});

export default api;