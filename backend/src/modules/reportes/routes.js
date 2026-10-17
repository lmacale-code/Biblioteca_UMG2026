import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { prestamosActivosPdf } from "./controller.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.get("/prestamos-activos.pdf", prestamosActivosPdf);

export default router;
