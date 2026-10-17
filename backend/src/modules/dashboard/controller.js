import { obtenerDashboard } from "./service.js";

export async function dashboard(_request, response, next) {
  try {
    response.json(await obtenerDashboard());
  } catch (error) {
    next(error);
  }
}
