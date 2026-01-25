import { useNavigate } from 'react-router-dom'; // NOTE: This import is not used inside the function but often appears in this utility's context.

// Base URL for the backend API
// You should update this if your backend is not running on localhost:5000
const API_BASE_URL = 'http://localhost:5000'; 

/**
 * A secure wrapper around the native fetch API that automatically adds authentication headers.
 * It handles token retrieval, JSON parsing, and custom error messaging.
 *
 * @param {string} endpoint The API endpoint (e.g., '/api/students').
 * @param {Object} options Standard fetch options (method, headers, body, etc.).
 * @returns {Promise<Object>} The parsed JSON data from the API response.
 * @throws {Error} Throws an error with a custom message if the request fails or is unauthorized.
 */
export async function secureFetch(endpoint, options = {}) {
  // 1. Check for token
  const token = localStorage.getItem('authToken');

  // 2. Clear token and redirect if no token is present for a protected resource
  // Note: /api/hello is often a public route, but we treat it as protected here 
  // because the error message explicitly says "No token provided".
  if (!token) {
    // If a request is made without a token, and the server rejects it, 
    // we should let the calling component handle the unauthorized state.
    const error = new Error('HTTP Error 403: No token provided. Please log in.');
    error.status = 403;
    throw error;
  }
  
  // 3. Construct the request URL
  const url = `${API_BASE_URL}${endpoint}`;

  // 4. Set headers, prioritizing user-provided headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    // 💡 IMPORTANT: Add the Authorization header
    'Authorization': `Bearer ${token}`, 
  };

  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  // Remove body for GET or HEAD requests to prevent fetch errors
  if (finalOptions.method === 'GET' || finalOptions.method === 'HEAD') {
    delete finalOptions.body;
  }

  let response;
  try {
    response = await fetch(url, finalOptions);
  } catch (networkError) {
    // This catches network failures (e.g., server offline)
    throw new Error(`Network connection failed: ${networkError.message}`);
  }

  // 5. Handle response status codes
  if (!response.ok) {
    let errorDetail = `HTTP Error ${response.status}`;
    
    // Attempt to read error message from the response body
    try {
      // Clone response to safely read body without affecting subsequent reads
      const errorBody = await response.clone().json();
      if (errorBody.message) {
        errorDetail += `: ${errorBody.message}`;
      } else {
        errorDetail += `: ${response.statusText}`;
      }
    } catch (e) {
      // If reading the body fails, fall back to status text
      errorDetail += `: ${response.statusText}`;
    }

    // 6. Special handling for 401/403 (Unauthorized/Forbidden)
    if (response.status === 401 || response.status === 403) {
      console.warn('Authentication failed. Clearing stale token.');
      localStorage.removeItem('authToken'); // Clean up the bad token
      // Throw error to be caught by the component
      const authError = new Error(errorDetail);
      authError.status = response.status;
      throw authError; 
    }
    
    // Throw error for other HTTP failures (e.g., 400 Bad Request, 500 Server Error)
    const generalError = new Error(errorDetail);
    generalError.status = response.status;
    throw generalError;
  }

  // 7. Return the parsed JSON data
  return response.json();
}
