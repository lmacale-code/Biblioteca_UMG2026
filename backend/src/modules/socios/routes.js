import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { actualizar, crear, desactivar, listar, obtener } from "./controller.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "encargado"));
router.get("/", listar);
router.post("/", crear);
router.get("/:id", obtener);
router.put("/:id", actualizar);
router.delete("/:id", desactivar);

export default router;