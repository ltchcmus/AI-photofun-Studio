// In-memory token storage for better security
// Access token is stored here instead of localStorage

let accessToken = null;

export const tokenManager = {
    getToken: () => accessToken,

    setToken: (token) => {
        accessToken = token;
    },

    clearToken: () => {
        accessToken = null;
    },

    hasToken: () => !!accessToken
};

export default tokenManager;
