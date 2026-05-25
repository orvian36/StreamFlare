import { Router } from "express";
import * as ctrl from "../controllers/subscription.controller.js";

const router = Router();

router.get("/", ctrl.getSubscriptions);
router.get("/subid/:email", ctrl.getSubId);
router.get("/bill/:sub_id", ctrl.getBill);
router.get("/isvalid/:sub_id", ctrl.isValidSubscription);
router.post("/add", ctrl.addSubscription);
router.get("/history/:email", ctrl.getHistory);
router.get("/getenddate/:email", ctrl.getEndDate);
// Legacy quirk: /update also calls addSubscription (not updateSubscription).
// Preserving that behavior — replaces the running plan with a new one.
router.post("/update", ctrl.addSubscription);
router.patch("/delete", ctrl.deleteSubscription);
router.get("/plans", ctrl.getplans);

export default router;
