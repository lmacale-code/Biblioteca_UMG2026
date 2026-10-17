import { listarHistorial } from "./service.js";

export async function miHistorial(request, response, next) {
  try {
    response.json({
      prestamos: await listarHistorial(request.user.id, request.query.estado),
    });
  } catch (error) {
    next(error);
  }
}

export async function historialSocio(request, response, next) {
  try {
    response.json({
      prestamos: await listarHistorial(request.params.socioId, request.query.estado),
    });
  } catch (error) {
    next(error);
  }
}
