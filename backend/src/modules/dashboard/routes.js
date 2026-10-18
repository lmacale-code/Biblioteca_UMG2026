import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { obtener } from "./controller.js";

const router = Router();
router.get("/", requireAuth, requireRole("admin", "encargado"), obtener);

export default router;
