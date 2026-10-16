import { Router } from "express";
import { notImplemented } from "./controller.js";

const router = Router();
router.get("/mi", notImplemented);
router.get("/:socioId", notImplemented);

export default router;