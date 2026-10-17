import {
  actualizarLibro,
  crearLibro,
  eliminarLibro,
  listarLibros,
  obtenerLibro,
} from "./service.js";

export async function listBooks(request, response, next) {
  try {
    response.json(await listarLibros(request.query));
  } catch (error) {
    next(error);
  }
}

export async function getBook(request, response, next) {
  try {
    response.json(await obtenerLibro(request.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createBook(request, response, next) {
  try {
    response.status(201).json(await crearLibro(request.body));
  } catch (error) {
    next(error);
  }
}

export async function updateBook(request, response, next) {
  try {
    response.json(await actualizarLibro(request.params.id, request.body));
  } catch (error) {
    next(error);
  }
}

export async function deleteBook(request, response, next) {
  try {
    await eliminarLibro(request.params.id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
