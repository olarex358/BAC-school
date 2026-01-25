import { useState, useEffect, useContext, createContext } from 'react';

// 1. Create the Auth Context with a default value of null
const AuthContext = createContext(null);

// Function to safely get user/token from localStorage
const getInitialState = () => {
    try {
        const token = localStorage.getItem('token');
        // Safely parse user data
        const user = localStorage.getItem('user');
        return { 
            token: token, 
            user: user ? JSON.parse(user) : null 
        };
    } catch (e) {
        console.error("Error reading from localStorage:", e);
        return { token: null, user: null };
    }
};

// 2. Create the Auth Provider component
export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(getInitialState);

    // Function to handle login (saves token and user to state and local storage)
    const login = (data) => {
        const { token, user } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setAuthState({ token, user });
    };

    // Function to handle logout (clears token and user from state and local storage)
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({ token: null, user: null });
    };
    
    // The value provided to components that use this hook
    const contextValue = {
        user: authState.user,
        token: authState.token,
        login,
        logout,
        isAuthenticated: !!authState.token,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Create the Custom Hook for easy consumption
export default function useAuth() {
    const context = useContext(AuthContext); 
    
    // 💥 CORRECTED CHECK: Checks if the context is null, which happens if not wrapped by Provider.
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
}