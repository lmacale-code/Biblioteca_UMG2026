import { Router } from "express";
import { notImplemented } from "./controller.js";

const router = Router();
router.get("/", notImplemented);
router.put("/", notImplemented);

export default router;