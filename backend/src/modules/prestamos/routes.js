import { Router } from "express";
import { notImplemented } from "./controller.js";

const router = Router();
router.get("/", notImplemented);
router.post("/", notImplemented);
router.post("/:id/devolver", notImplemented);
router.put("/:id/pagar-multa", notImplemented);

export default router;