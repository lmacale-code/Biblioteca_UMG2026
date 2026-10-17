import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { obtener } from "./controller.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "encargado"));
router.get("/", obtener);

export default router;
