import { obtenerDashboard } from "./service.js";

export async function obtener(_request, response, next) {
  try {
    response.json(await obtenerDashboard());
  } catch (error) {
    next(error);
  }
}
