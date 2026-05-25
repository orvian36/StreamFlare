import { Router } from "express";
import { check } from "express-validator";
import * as ctrl from "../controllers/users.controller.js";

const router = Router();

router.get("/", ctrl.getUsers);
router.post(
  "/signup",
  [check("NAME").isLength({ min: 3 }), check("EMAIL").normalizeEmail().isEmail()],
  ctrl.signup,
);
router.post("/login", ctrl.login);
router.get("/maxprofiles/:email", ctrl.getMaxProfiles);
router.get("/numprofiles/:email", ctrl.getNumProfiles);
router.patch("/updatephone", ctrl.updatePhone);
router.get("/getphone/:email", ctrl.getPhone);
router.patch("/updatepassword", ctrl.updatePassword);
router.get("/getmoviehistory/:email/:prof_id", ctrl.getMovieWatchHistory);
router.get("/getmoviehistory/:email", ctrl.getMovieWatchHistory2);
router.get("/getshowhistory/:email/:prof_id", ctrl.getShowWatchHistory);
router.get("/getshowhistory/:email", ctrl.getShowWatchHistory2);

export default router;
