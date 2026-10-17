import {
  crearPrestamo,
  devolverPrestamo,
  listarPrestamos,
  pagarMulta,
} from "./service.js";

export async function listar(request, response, next) {
  try {
    response.json({ prestamos: await listarPrestamos(request.query) });
  } catch (error) {
    next(error);
  }
}

export async function crear(request, response, next) {
  try {
    const prestamo = await crearPrestamo(request.body, request.user.id);
    response.status(201).json({ prestamo, mensaje: "Préstamo registrado correctamente" });
  } catch (error) {
    next(error);
  }
}

export async function devolver(request, response, next) {
  try {
    const prestamo = await devolverPrestamo(request.params.id);
    response.json({ prestamo, mensaje: "Libro devuelto correctamente" });
  } catch (error) {
    next(error);
  }
}

export async function pagar(request, response, next) {
  try {
    const prestamo = await pagarMulta(request.params.id);
    response.json({ prestamo, mensaje: "Multa pagada correctamente" });
  } catch (error) {
    next(error);
  }
}
