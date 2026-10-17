import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  updateBook,
} from "./controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", listBooks);
router.get("/:id", getBook);
router.post("/", requireRole("admin", "encargado"), createBook);
router.put("/:id", requireRole("admin", "encargado"), updateBook);
router.delete("/:id", requireRole("admin", "encargado"), deleteBook);

export default router;
