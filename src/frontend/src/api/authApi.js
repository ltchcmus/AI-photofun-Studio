import axiosClient from "./axiosClient";

const LOGIN_ENDPOINT = "/api/v1/identity/auth/login";
const REGISTER_ENDPOINT = "/api/v1/identity/users/register";
const LOGOUT_ENDPOINT = "/api/v1/identity/auth/logout";
const INTROSPECT_ENDPOINT = "/api/v1/identity/auth/introspect";

const extractToken = (response) =>
  response?.data?.result?.accessToken ||
  response?.data?.data?.accessToken ||
  response?.data?.accessToken ||
  response?.data?.token;

export const authApi = {
  login: (usernameOrEmail, password) =>
    axiosClient
      .post(LOGIN_ENDPOINT, { usernameOrEmail, password })
      .then((response) => {
        const token = extractToken(response);
        if (token) {
          localStorage.setItem("token", token);
        }
        return response;
      }),

  register: (payload) => axiosClient.post(REGISTER_ENDPOINT, payload),

  logout: () => {
    localStorage.removeItem("token");
    return axiosClient.get(LOGOUT_ENDPOINT);
  },

  introspect: () => axiosClient.get(INTROSPECT_ENDPOINT),
};
