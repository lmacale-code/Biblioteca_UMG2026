import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { historialSocio, miHistorial } from "./controller.js";

const router = Router();
router.use(requireAuth);
router.get("/mi", miHistorial);
router.get("/:socioId", requireRole("admin"), historialSocio);

export default router;
