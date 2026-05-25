import { Router } from "express";
import * as ctrl from "../controllers/profile.controller.js";

const router = Router();

router.get("/:email", ctrl.getProfile);
router.post("/add", ctrl.addProfile);
router.patch("/update", ctrl.updateProfile);
router.delete("/delete", ctrl.deleteProfile);

router.post("/watchlist/find", ctrl.hasWatchListed);
router.post("/watchlist/add", ctrl.addToWatchList);
router.delete("/watchlist/delete", ctrl.deleteWatchList);
router.post("/watchlist/get/", ctrl.getWatchList);

router.post("/rating/add", ctrl.addRating);
router.post("/rating/find", ctrl.findRating);

router.get("/time/get", ctrl.getTime);
router.post("/time/set", ctrl.setTime);

router.get("/movie/continue", ctrl.movieContinueWatching);
router.get("/show/continue", ctrl.showContinueWatching);
router.get("/episode/continue", ctrl.episodeContinueWatching);

export default router;
