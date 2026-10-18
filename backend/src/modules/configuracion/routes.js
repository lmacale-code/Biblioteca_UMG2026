import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { actualizar, obtener } from "./controller.js";

const router = Router();
router.get("/", requireAuth, requireRole("admin", "encargado"), obtener);
router.put("/", requireAuth, requireRole("admin"), actualizar);

export default router;
