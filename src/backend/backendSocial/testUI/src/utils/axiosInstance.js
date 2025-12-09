import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const createAxiosInstance = (config, auth, setAuth, logout) => {
  const instance = axios.create({
    baseURL: config.apiGateway,
    withCredentials: true, // Enable cookies
  });

  // Request interceptor: Add Authorization header
  instance.interceptors.request.use(
    (config) => {
      if (auth.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle 401 and refresh token
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Check if error is 401 (HTTP status, not response.data.code)
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue requests while refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call refresh token API (GET request)
          const refreshResponse = await axios.get(
            `${config.apiGateway}/api/v1/identity/auth/refresh-token`,
            { withCredentials: true }
          );

          if (refreshResponse.data.code === 1000) {
            const newAccessToken = refreshResponse.data.result.accessToken;

            // Update auth state with new access token
            setAuth((prevAuth) => ({
              ...prevAuth,
              accessToken: newAccessToken,
            }));

            // Update Authorization header for queued requests
            instance.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Process queued requests
            processQueue(null, newAccessToken);

            // Retry original request with new token
            return instance(originalRequest);
          } else {
            throw new Error("Refresh token failed");
          }
        } catch (refreshError) {
          // If refresh fails, logout user
          processQueue(refreshError, null);
          logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // For other errors, just reject
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createAxiosInstance;
