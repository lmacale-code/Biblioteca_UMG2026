import { apiRequest } from "../../api/client.js";

export async function getBooks(filters = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(key, value);
    }
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest(`/libros${suffix}`);
}

export function getCategories() {
  return apiRequest("/categorias");
}

export function saveBook(id, book) {
  return apiRequest(id ? `/libros/${id}` : "/libros", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(book),
  });
}

export function removeBook(id) {
  return apiRequest(`/libros/${id}`, { method: "DELETE" });
}

export function saveCategory(nombre) {
  return apiRequest("/categorias", {
    method: "POST",
    body: JSON.stringify({ nombre }),
  });
}

export function getUserRole() {
  const token = localStorage.getItem("token");
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return JSON.parse(decoded).rol ?? null;
  } catch {
    return null;
  }
}
