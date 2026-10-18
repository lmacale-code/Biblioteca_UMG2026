import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { createCategory, listCategories } from "./controller.js";

const router = Router();

router.get("/", requireAuth, listCategories);
router.post("/", requireAuth, requireRole("admin", "encargado"), createCategory);

export default router;
