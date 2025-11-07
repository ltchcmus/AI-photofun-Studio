import axios from "axios";

const API_URL = "http://localhost:8888/api/v1";

export const authService = {
  login: async (usernameOrEmail, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/identity/auth/login`,
        {
          usernameOrEmail,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // To allow cookies to be sent/received
        }
      );

      // Store the token if needed
      if (response.data?.result?.accessToken) {
        localStorage.setItem("token", response.data.result.accessToken);
      }

      return response.data;
    } catch (error) {
      throw error?.response?.data || error.message;
    }
  },

  register: async (username, password, confirmPass, email) => {
    try {
      const response = await axios.post(
        `${API_URL}/identity/users/register`,
        {
          username,
          password,
          confirmPass,
          email,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      throw error?.response?.data || error.message;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },
};
