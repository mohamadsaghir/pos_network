import axios from "axios";

const resolveBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isLocalhost = ["localhost", "127.0.0.1"].includes(hostname);
    const port = isLocalhost ? ":5000" : "";
    return `${protocol}//${hostname}${port}/api`;
  }

  return "http://localhost:5000/api";
};

const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
