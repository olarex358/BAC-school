// --- You can put this in a new file, e.g., src/utils/api.js ---

import { useAuth } from '../hooks/AuthContext'; // Or '../AuthContext' if path is different

// Custom hook for making authenticated API calls
export const useAuthenticatedApi = () => {
    const { token, logout } = useAuth(); // Get the current token and logout function

    const fetchWithAuth = async (endpoint, options = {}) => {
        // 1. Get the token
        if (!token) {
            // No token means user is not authenticated.
            logout(); 
            throw new Error("Authentication token is missing.");
        }

        // 2. Prepare the headers, including the Authorization header
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // CRITICAL: Attaches the token
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        // 3. Make the fetch request
        const response = await fetch(`http://localhost:5000${endpoint}`, config);

        if (response.status === 401) {
            // If the server explicitly says the token is invalid or expired
            console.error("Token invalid or expired. Logging out.");
            logout(); // Force logout
            throw new Error("Unauthorized access. Please log in again.");
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API request failed.');
        }

        return response.json();
    };

    return { fetchWithAuth };
};