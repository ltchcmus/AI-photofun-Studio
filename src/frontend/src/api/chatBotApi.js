import axios from "axios";

const USER_ID = "4529e91d-8feb-4078-bf6d-763704af0307";
const BEARER_TOKEN = "4529e91d-8feb-4078-bf6d-763704af0307";

const chatBotClient = axios.create({
  baseURL: "https://agent.lethanhcong.site",
  headers: {
    "x-api-key":
      "SQoX2lB2XEsKgaCKizTT8ALXJgwddJX8ZZANEdoYZRqxIt5SnjgbHcXj825VEvxuwUObe9ArdpAbJandPaSXN9",
    "Authorization": `Bearer ${BEARER_TOKEN}`,
    "userId": USER_ID,
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
