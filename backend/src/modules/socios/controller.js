import {
  actualizarSocio,
  crearSocio,
  desactivarSocio,
  listarSocios,
  obtenerSocio,
} from "./service.js";

export async function listar(request, response, next) {
  try {
    const socios = await listarSocios({ q: request.query.q, tipo: request.query.tipo });
    response.json({ socios });
  } catch (error) {
    next(error);
  }
}

export async function obtener(request, response, next) {
  try {
    response.json({ socio: await obtenerSocio(request.params.id) });
  } catch (error) {
    next(error);
  }
}

export async function crear(request, response, next) {
  try {
    response.status(201).json({ socio: await crearSocio(request.body) });
  } catch (error) {
    next(error);
  }
}

export async function actualizar(request, response, next) {
  try {
    response.json({ socio: await actualizarSocio(request.params.id, request.body) });
  } catch (error) {
    next(error);
  }
}

export async function desactivar(request, response, next) {
  try {
    await desactivarSocio(request.params.id);
    response.json({ mensaje: "Socio desactivado correctamente" });
  } catch (error) {
    next(error);
  }
}