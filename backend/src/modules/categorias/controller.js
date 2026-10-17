import { crearCategoria, listarCategorias } from "./service.js";

export async function listCategories(_request, response, next) {
  try {
    response.json(await listarCategorias());
  } catch (error) {
    next(error);
  }
}

export async function createCategory(request, response, next) {
  try {
    response.status(201).json(await crearCategoria(request.body));
  } catch (error) {
    next(error);
  }
}
