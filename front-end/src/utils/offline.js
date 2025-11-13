const isBrowser = typeof window !== "undefined";

const CACHE_KEY = "payflow:debts-cache";
const QUEUE_KEY = "payflow:pending-mutations";

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("Failed to parse offline storage payload:", err);
    return fallback;
  }
};

export const readCache = () => {
  if (!isBrowser) return { data: [], savedAt: null };
  return safeParse(localStorage.getItem(CACHE_KEY), { data: [], savedAt: null });
};

export const writeCache = (debts) => {
  if (!isBrowser) return;
  const payload = {
    data: debts,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

export const updateCache = (updater) => {
  if (!isBrowser) return;
  const snapshot = readCache();
  const current = Array.isArray(snapshot?.data) ? snapshot.data : [];
  const next = updater(current.slice());
  writeCache(next);
  return next;
};

export const readQueue = () => {
  if (!isBrowser) return [];
  return safeParse(localStorage.getItem(QUEUE_KEY), []);
};

export const writeQueue = (queue) => {
  if (!isBrowser) return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const enqueueMutation = (mutation) => {
  if (!isBrowser) return;
  const queue = readQueue();
  queue.push({
    ...mutation,
    queuedAt: new Date().toISOString(),
  });
  writeQueue(queue);
};

export const isLikelyNetworkError = (error) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (!error) return false;
  if (error.code === "ERR_NETWORK") return true;
  if (error.message && /Network Error/i.test(error.message)) return true;
  if (error.request && !error.response) return true;
  return false;
};

export const onOnline = (cb) => {
  if (!isBrowser || typeof cb !== "function") return;
  window.addEventListener("online", cb);
};
