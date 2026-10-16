export default function errorHandler(error, _request, response, _next) {
  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;
  const message = status === 500
    ? "Error interno del servidor"
    : (typeof error.message === "string" ? error.message : "Solicitud no válida");

  response.status(status).json({ error: message });
}