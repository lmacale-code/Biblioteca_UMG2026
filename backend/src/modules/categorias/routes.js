import { Router } from "express";
import { notImplemented } from "./controller.js";

const router = Router();
router.get("/", notImplemented);
router.post("/", notImplemented);

export default router;