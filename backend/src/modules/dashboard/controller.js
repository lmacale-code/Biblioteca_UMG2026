import { notImplemented as notImplementedService } from "./service.js";

export async function notImplemented(_request, _response, next) {
  try {
    await notImplementedService();
  } catch (error) {
    next(error);
  }
}