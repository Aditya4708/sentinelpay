import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  upiId: string;
  preferredBank?: string;
  preferredApp?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload) {
  const res = await api.post("/auth/register", payload);
  return res.data;
}

export async function loginUser(payload: LoginPayload) {
  const res = await api.post("/auth/login", payload);
  return res.data;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  preferredBank?: string;
  preferredApp?: string;
}

export async function updateProfile(payload: UpdateProfilePayload, token: string) {
  const res = await api.put("/auth/me", payload, {
    headers: { Authorization: "Bearer " + token },
  });
  invalidateMe();
  return res.data;
}

// One shared GET /auth/me. The route guard, the shell and the page all ask for the
// current user when a page mounts; they now share a single request. The result is kept
// briefly, so values that change (like the risk score) are re-read on the next visit.
const ME_TTL_MS = 5000;
let meCache: { token: string; at: number; promise: Promise<{ user: any }> } | null = null;

export function fetchMe(): Promise<{ user: any }> {
  const token = localStorage.getItem("accessToken") || "";
  if (meCache && meCache.token === token && Date.now() - meCache.at < ME_TTL_MS) {
    return meCache.promise;
  }
  const promise = api
    .get("/auth/me", { headers: { Authorization: "Bearer " + token } })
    .then((res) => res.data)
    .catch((err) => {
      if (meCache && meCache.promise === promise) meCache = null;
      throw err;
    });
  meCache = { token, at: Date.now(), promise };
  return promise;
}

export function invalidateMe() {
  meCache = null;
}

export default api;