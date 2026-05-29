import { Router } from "express";
import * as ctrl from "../controllers/admin.controller.js";

const router = Router();
router.get("/overview", ctrl.overview);
export default router;
