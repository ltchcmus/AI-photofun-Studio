import axios from "axios";

const USER_ID =
  import.meta.env.VITE_CHATBOT_USER_ID ||
  "4529e91d-8feb-4078-bf6d-763704af0307";
const BEARER_TOKEN =
  import.meta.env.VITE_CHATBOT_BEARER_TOKEN ||
  "4529e91d-8feb-4078-bf6d-763704af0307";
const CHATBOT_API_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "https://agent.lethanhcong.site";
const CHATBOT_X_API_KEY =
  import.meta.env.VITE_CHATBOT_X_API_KEY ||
  "SQoX2lB2XEsKgaCKizTT8ALXJgwddJX8ZZANEdoYZRqxIt5SnjgbHcXj825VEvxuwUObe9ArdpAbJandPaSXN9";

const chatBotClient = axios.create({
  baseURL: CHATBOT_API_URL,
  headers: {
    "x-api-key": CHATBOT_X_API_KEY,
    Authorization: `Bearer ${BEARER_TOKEN}`,
    userId: USER_ID,
  },
});

chatBotClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("ChatBot API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const chatBotApi = {
  sendMessage: async (message) => {
    const formData = new FormData();
    formData.append("message", message);

    const response = await chatBotClient.post("/chat-bot/chat", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default chatBotClient;
