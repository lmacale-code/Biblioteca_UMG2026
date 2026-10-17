import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { descargarPrestamosActivos } from "./controller.js";

const router = Router();

router.get(
  "/prestamos-activos.pdf",
  requireAuth,
  requireRole("admin"),
  descargarPrestamosActivos,
);

export default router;
