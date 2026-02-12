import axios from "axios";

const LOCAL_BASE_URL = "http://localhost:5000/api";
const REMOTE_BASE_URL = "https://pos-network.onrender.com/api";

const parseBoolean = (value) =>
  typeof value === "string" && value.trim().toLowerCase() === "true";

const resolveBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const forceLocal = parseBoolean(process.env.REACT_APP_USE_LOCAL_API);
  const forceRemote = parseBoolean(process.env.REACT_APP_USE_REMOTE_API);

  if (forceLocal && forceRemote) {
    console.warn(
      "Both REACT_APP_USE_LOCAL_API and REACT_APP_USE_REMOTE_API are set. Defaulting to remote API."
    );
  }

  if (forceLocal && !forceRemote) {
    return LOCAL_BASE_URL;
  }

  if (forceRemote) {
    return REMOTE_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (!["localhost", "127.0.0.1"].includes(hostname)) {
      return `${origin.replace(/\/$/, "")}/api`;
    }
  }

  return REMOTE_BASE_URL;
};

const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
