import axiosClient from "./axiosClient";
import tokenManager from "./tokenManager";

const LOGIN_ENDPOINT = "/api/v1/identity/auth/login";
const REGISTER_ENDPOINT = "/api/v1/identity/users/register";
const LOGOUT_ENDPOINT = "/api/v1/identity/auth/logout";
const INTROSPECT_ENDPOINT = "/api/v1/identity/auth/introspect";
const REFRESH_ENDPOINT = "/api/v1/identity/auth/refresh-token";

const extractToken = (response) =>
  response?.data?.result?.accessToken ||
  response?.data?.data?.accessToken ||
  response?.data?.accessToken ||
  response?.data?.token ||
  // For refresh endpoint which returns token directly in result
  (typeof response?.data?.result === 'string' ? response?.data?.result : null);

export const authApi = {
  login: (usernameOrEmail, password) =>
    axiosClient
      .post(LOGIN_ENDPOINT, { usernameOrEmail, password })
      .then((response) => {
        const token = extractToken(response);
        if (token) {
          // Store in memory instead of localStorage
          tokenManager.setToken(token);
        }
        return response;
      }),

  register: (payload) => axiosClient.post(REGISTER_ENDPOINT, payload),

  logout: () => {
    // Clear token from memory
    tokenManager.clearToken();
    return axiosClient.get(LOGOUT_ENDPOINT);
  },

  introspect: () => axiosClient.get(INTROSPECT_ENDPOINT),

  // Refresh token - get new access token using HttpOnly cookie
  refreshToken: () =>
    axiosClient
      .get(REFRESH_ENDPOINT)
      .then((response) => {
        const token = extractToken(response);
        if (token) {
          tokenManager.setToken(token);
        }
        return response;
      }),
};
