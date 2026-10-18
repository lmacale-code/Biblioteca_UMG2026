import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import authRoutes from "../modules/auth/routes.js";
import sociosRoutes from "../modules/socios/routes.js";
import librosRoutes from "../modules/libros/routes.js";
import categoriasRoutes from "../modules/categorias/routes.js";
import prestamosRoutes from "../modules/prestamos/routes.js";
import configuracionRoutes from "../modules/configuracion/routes.js";
import dashboardRoutes from "../modules/dashboard/routes.js";
import historialRoutes from "../modules/historial/routes.js";
import reportesRoutes from "../modules/reportes/routes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/socios", sociosRoutes);
router.use("/libros", librosRoutes);
router.use("/categorias", categoriasRoutes);
router.use("/prestamos", prestamosRoutes);
router.use("/configuracion", configuracionRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/historial", historialRoutes);
router.use("/reportes", reportesRoutes);

export default router;
