import axios from "axios";

const resolveBaseUrl = () => {
  const envUrl = process.env.REACT_APP_WHATSAPP_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  // Fallback to production API if env var is missing, or keep localhost only for dev if needed.
  // Better to use window.location logic or a safe default.
  return "https://pos-network.onrender.com";
};

const whatsappApi = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export default whatsappApi;
