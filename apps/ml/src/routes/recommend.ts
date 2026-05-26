import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";
import { runRecommendation } from "../services/python-runner.js";
import { HttpError } from "../models/http-error.js";

const router = Router();

interface RecommendBody {
  movieId?: number;
  movieTitle?: string;
  limit?: number;
}

// POST /recommend  — body: { movieId?, movieTitle?, limit? }
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { movieId, movieTitle: titleFromBody, limit } = req.body as RecommendBody;
    let movieTitle = titleFromBody;

    if (!movieTitle && movieId != null) {
      const movie = await prisma.movie.findUnique({
        where: { movieId },
        select: { title: true },
      });
      movieTitle = movie?.title;
    }

    if (!movieTitle) {
      return next(new HttpError("Either movieId or movieTitle is required", 400));
    }

    const movies = await prisma.movie.findMany({
      select: { movieId: true, title: true },
    });

    const ids = await runRecommendation({
      movieTitle,
      movies: movies.map((m) => ({ id: m.movieId, title: m.title })),
      limit: limit ?? 20,
    });

    res.status(200).json({ movieIds: ids });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
});

// GET /recommend?email=...&profile_id=... — legacy-compatible: looks up the
// user's most recent movie watch and returns recommendations for it.
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, profile_id } = req.query as Record<string, string>;
    if (!email || !profile_id) {
      return res.status(200).json([]);
    }

    const recent = await prisma.movieWatch.findFirst({
      where: { email, profileId: profile_id },
      orderBy: { time: "desc" },
      include: { movie: { select: { title: true } } },
    });

    const movieTitle = recent?.movie.title ?? "batman";

    const movies = await prisma.movie.findMany({
      select: { movieId: true, title: true },
    });

    if (movies.length === 0) {
      return res.status(200).json([]);
    }

    const ids = await runRecommendation({
      movieTitle,
      movies: movies.map((m) => ({ id: m.movieId, title: m.title })),
      limit: 20,
    });

    res.status(200).json(ids);
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
});

export default router;
