import { listarHistorial } from "./service.js";

export async function miHistorial(request, response, next) {
  try {
    const prestamos = await listarHistorial(request.user.id, request.query, true);
    response.json({ prestamos });
  } catch (error) {
    next(error);
  }
}

export async function historialSocio(request, response, next) {
  try {
    const prestamos = await listarHistorial(request.params.socioId, request.query);
    response.json({ prestamos });
  } catch (error) {
    next(error);
  }
}
