export async function notImplemented() {
  const error = new Error("No implementado");
  error.status = 501;
  throw error;
}