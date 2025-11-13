import api from "./api";
import {
  readCache,
  writeCache,
  updateCache,
  readQueue,
  writeQueue,
  enqueueMutation,
  isLikelyNetworkError,
  onOnline,
} from "./offline";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizePayload = (payload = {}) => {
  const normalized = { ...payload };
  if (normalized.amount !== undefined && normalized.amount !== null) {
    const parsed = Number(normalized.amount);
    if (!Number.isNaN(parsed)) {
      normalized.amount = parsed;
    }
  }
  return normalized;
};

let isFlushing = false;
let initialized = false;

const flushQueue = async () => {
  if (isFlushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const queue = readQueue();
  if (!queue.length) return;

  isFlushing = true;
  const remaining = [];

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    try {
      let response;
      if (item.method === "post") {
        response = await api.post(item.url, item.payload);
      } else if (item.method === "put") {
        response = await api.put(item.url, item.payload);
      } else if (item.method === "delete") {
        response = await api.delete(item.url);
      } else {
        throw new Error(`Unsupported method queued: ${item.method}`);
      }

      if (item.kind === "create" && item.tempId && response?.data) {
        updateCache((draft) =>
          draft.map((entry) =>
            entry._id === item.tempId ? { ...response.data } : entry
          )
        );
      }

      if (item.kind === "update" && response?.data) {
        updateCache((draft) =>
          draft.map((entry) =>
            entry._id === response.data._id ? { ...response.data } : entry
          )
        );
      }

      if (item.kind === "delete") {
        updateCache((draft) => draft.filter((entry) => entry._id !== item.id));
      }
    } catch (error) {
      console.warn("Failed to flush queued mutation. Will retry later.", error);
      remaining.push(item, ...queue.slice(index + 1));
      break;
    }
  }

  if (remaining.length) {
    writeQueue(remaining);
  } else {
    writeQueue([]);
    try {
      const res = await api.get("/debts");
      const data = ensureArray(res.data);
      writeCache(data);
    } catch (syncErr) {
      console.warn("Failed to refresh cache after flush:", syncErr);
    }
  }
  isFlushing = false;
};

const ensureInitialized = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  onOnline(() => {
    flushQueue();
  });
  flushQueue();
};

const updateCacheAfterCreate = (payload, tempId) => {
  updateCache((draft) => [
    {
      _id: tempId,
      paid: false,
      ...payload,
      __optimistic: true,
    },
    ...draft,
  ]);
};

const updateCacheAfterUpdate = (id, payload) => {
  updateCache((draft) =>
    draft.map((entry) =>
      entry._id === id
        ? {
            ...entry,
            ...payload,
            _id: id,
            __optimistic: true,
          }
        : entry
    )
  );
};

const updateCacheAfterDelete = (id) => {
  updateCache((draft) => draft.filter((entry) => entry._id !== id));
};

export const fetchDebtsList = async () => {
  ensureInitialized();
  try {
    const response = await api.get("/debts");
    const data = ensureArray(response.data);
    writeCache(data);
    return { data, source: "network" };
  } catch (error) {
    const snapshot = readCache();
    const cachedData = ensureArray(snapshot?.data);
    if (cachedData.length) {
      console.warn("Using cached debts due to network issue.", error);
      return { data: cachedData, source: "cache", error };
    }
    throw error;
  }
};

export const createDebt = async (payload) => {
  ensureInitialized();
  const body = normalizePayload(payload);
  try {
    const response = await api.post("/debts", body);
    await fetchDebtsList();
    return { queued: false, data: response.data };
  } catch (error) {
    if (!isLikelyNetworkError(error)) throw error;
    const tempId = `offline-${Date.now()}`;
    updateCacheAfterCreate(body, tempId);
    enqueueMutation({
      kind: "create",
      method: "post",
      url: "/debts",
      payload: body,
      tempId,
    });
    flushQueue();
    return { queued: true, tempId };
  }
};

export const updateDebt = async (id, payload) => {
  ensureInitialized();
  const body = normalizePayload(payload);
  try {
    const response = await api.put(`/debts/${id}`, body);
    await fetchDebtsList();
    return { queued: false, data: response.data };
  } catch (error) {
    if (!isLikelyNetworkError(error)) throw error;
    updateCacheAfterUpdate(id, body);
    enqueueMutation({
      kind: "update",
      method: "put",
      url: `/debts/${id}`,
      payload: body,
      id,
    });
    flushQueue();
    return { queued: true };
  }
};

export const deleteDebt = async (id) => {
  ensureInitialized();
  try {
    await api.delete(`/debts/${id}`);
    await fetchDebtsList();
    return { queued: false };
  } catch (error) {
    if (!isLikelyNetworkError(error)) throw error;
    updateCacheAfterDelete(id);
    enqueueMutation({
      kind: "delete",
      method: "delete",
      url: `/debts/${id}`,
      id,
    });
    flushQueue();
    return { queued: true };
  }
};
