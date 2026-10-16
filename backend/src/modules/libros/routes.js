import { Router } from "express";
import { notImplemented } from "./controller.js";

const router = Router();
router.get("/", notImplemented);
router.post("/", notImplemented);
router.get("/:id", notImplemented);
router.put("/:id", notImplemented);
router.delete("/:id", notImplemented);

export default router;