import { iniciarSesion, obtenerUsuarioActual } from "./service.js";

export async function login(request, response, next) {
  try {
    const email = typeof request.body?.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";
    const password = typeof request.body?.password === "string"
      ? request.body.password
      : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      const error = new Error("Ingresa un correo electrónico y una contraseña válidos");
      error.status = 400;
      throw error;
    }
    response.json(await iniciarSesion(email, password));
  } catch (error) {
    next(error);
  }
}

export async function me(request, response, next) {
  try {
    response.json(await obtenerUsuarioActual(request.user.id));
  } catch (error) {
    next(error);
  }
}