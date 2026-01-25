import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth hook

// Simple in-memory cache
const cache = {};

const useApi = (url) => {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            // Check if data exists in cache
            if (cache[url]) {
                setData(cache[url]);
                setLoading(false);
            }

            // Only fetch if a token exists
            if (!token) {
                setLoading(false);
                setError('Authentication token not found.');
                return;
            }

            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const result = await response.json();
                
                // Update state and cache with new data
                setData(result);
                cache[url] = result;
            } catch (err) {
                setError(err.message);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url, token]);

    return { data, loading, error };
};

export default useApi;