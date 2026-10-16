const API_PREFIX = "/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "No fue posible completar la solicitud");
  }
  return payload;
}