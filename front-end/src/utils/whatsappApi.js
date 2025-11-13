import axios from "axios";

const resolveBaseUrl = () => {
  const envUrl = process.env.REACT_APP_WHATSAPP_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  return "http://localhost:8000";
};

const whatsappApi = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export default whatsappApi;
