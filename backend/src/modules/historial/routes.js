import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { historialSocio, miHistorial } from "./controller.js";

const router = Router();
router.get("/mi", requireAuth, miHistorial);
router.get("/:socioId", requireAuth, requireRole("admin"), historialSocio);

export default router;
