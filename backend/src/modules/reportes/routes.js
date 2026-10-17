import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { prestamosActivosPdf } from "./controller.js";

const router = Router();
router.get(
  "/prestamos-activos.pdf",
  requireAuth,
  requireRole("admin"),
  prestamosActivosPdf,
);

export default router;
