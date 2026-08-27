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
  return res.data;
}

export default api;