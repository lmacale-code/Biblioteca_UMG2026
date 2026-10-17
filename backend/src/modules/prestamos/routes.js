import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { crear, devolver, listar, pagar } from "./controller.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "encargado"));
router.get("/", listar);
router.post("/", crear);
router.post("/:id/devolver", devolver);
router.put("/:id/pagar-multa", pagar);

export default router;
