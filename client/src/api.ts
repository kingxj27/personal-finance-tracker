export const API_BASE_URL = "http://localhost:4000";

export type AuthToken = string | null;

export function authHeaders(token: AuthToken): HeadersInit {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    base.Authorization = `Bearer ${token}`;
  }
  return base;
}

