import axios from "axios";

const resolveWhatsappBaseUrl = () => {
  const envUrl = process.env.REACT_APP_WHATSAPP_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  return "http://localhost:8000";
};

const whatsappApi = axios.create({
  baseURL: resolveWhatsappBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export default whatsappApi;
