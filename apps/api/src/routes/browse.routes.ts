import { Router } from "express";
import * as ctrl from "../controllers/browse.controller.js";

const router = Router();

router.get("/movies/:genre", ctrl.getMovieByGenre);
router.get("/shows/:genre", ctrl.getShowByGenre);
router.post("/search", ctrl.search);
router.get("/show/episodes", ctrl.getEpisodes);
router.get("/suggestions", ctrl.getSuggestions);
router.get("/similarity", ctrl.similarity);
router.get("/new", ctrl.newAndPopular);
router.get("/genre", ctrl.getGenres);
router.get("/celeb", ctrl.getCelebs);
router.get("/similar", ctrl.getSimilar);

export default router;
