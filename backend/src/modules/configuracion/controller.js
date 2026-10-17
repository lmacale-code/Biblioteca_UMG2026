import { guardarConfiguracion, obtenerConfiguracion } from "./service.js";

export async function obtener(_request, response, next) {
  try {
    response.json({ configuracion: await obtenerConfiguracion() });
  } catch (error) {
    next(error);
  }
}

export async function actualizar(request, response, next) {
  try {
    const configuracion = await guardarConfiguracion(request.body);
    response.json({ configuracion, mensaje: "Configuración actualizada correctamente" });
  } catch (error) {
    next(error);
  }
}
