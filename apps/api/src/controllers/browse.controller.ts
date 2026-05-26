import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import { prisma } from "@streamflare/db";
import { env } from "../services/env.js";
import { computeBulkSimilarity } from "../services/recommendation.service.js";

function asInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function yearOf(d: Date | null): number | null {
  return d ? d.getUTCFullYear() : null;
}

// ────────────────────────────────────────────────────────────────────────────
// getMovieByGenre
// ────────────────────────────────────────────────────────────────────────────
export async function getMovieByGenre(req: Request, res: Response, _next: NextFunction) {
  const genre = req.params.genre;
  try {
    if (genre === "all") {
      const links = await prisma.movieGenre.findMany({
        take: 1000,
        include: {
          movie: {
            select: {
              movieId: true,
              title: true,
              imageUrl: true,
              description: true,
              videoUrl: true,
              releaseDate: true,
              rating: true,
            },
          },
          genre: { select: { name: true } },
        },
      });
      const shuffled = [...links].sort(() => Math.random() - 0.5);
      res.status(200).json({
        movies: shuffled.map((l) => ({
          MOVIE_ID: l.movie.movieId,
          TITLE: l.movie.title,
          IMAGE_URL: l.movie.imageUrl,
          DESCRIPTION: l.movie.description,
          VIDEO_URL: l.movie.videoUrl,
          RELEASE_DATE: yearOf(l.movie.releaseDate),
          RATING: l.movie.rating,
          NAME: l.genre.name,
        })),
      });
    } else {
      const links = await prisma.movieGenre.findMany({
        where: { genre: { name: genre } },
        include: {
          movie: true,
          genre: { select: { name: true } },
        },
        orderBy: { movie: { rating: "desc" } },
      });
      res.status(200).json({
        movies: links.map((l) => ({
          MOVIE_ID: l.movie.movieId,
          TITLE: l.movie.title,
          IMAGE_URL: l.movie.imageUrl,
          DESCRIPTION: l.movie.description,
          VIDEO_URL: l.movie.videoUrl,
          RELEASE_DATE: yearOf(l.movie.releaseDate),
          RATING: l.movie.rating,
          NAME: l.genre.name,
        })),
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Cant fetch movie data from backend" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// getShowByGenre
// ────────────────────────────────────────────────────────────────────────────
export async function getShowByGenre(req: Request, res: Response, _next: NextFunction) {
  const genre = req.params.genre;
  try {
    const where = genre === "all" ? {} : { genre: { name: genre } };
    const links = await prisma.showGenre.findMany({
      where,
      take: 1000,
      include: {
        show: true,
        genre: { select: { name: true } },
      },
    });
    const list = genre === "all" ? [...links].sort(() => Math.random() - 0.5) : links;
    res.status(200).json({
      shows: list.map((l) => ({
        SHOW_ID: l.show.showId,
        TITLE: l.show.title,
        RATING: l.show.rating,
        IMAGE_URL: l.show.imageUrl,
        DESCRIPTION: l.show.description,
        RELEASE_DATE:
          l.show.startDate && l.show.endDate
            ? `${yearOf(l.show.startDate)} - ${yearOf(l.show.endDate)}`
            : yearOf(l.show.startDate) ?? null,
        NAME: l.genre.name,
      })),
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Cant fetch show data from backend" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// search — parameterized port of legacy dynamic query builder.
// `key` is a flat array of alternating [param, keyword, param, keyword, ...].
// `ss` is "movie" | "show" | "all" | "static".
// Returns an array of {title, data} sections.
// ────────────────────────────────────────────────────────────────────────────
interface SearchBody {
  ss: "movie" | "show" | "all" | "static";
  key: Array<string | number>;
}

async function searchMovies(key: Array<string | number>) {
  // Each pair (param, kw) yields a candidate set; the final movie set is the intersection.
  const idSets: Array<Set<number>> = [];

  for (let i = 0; i < key.length; i += 2) {
    const param = String(key[i] ?? "");
    const kw = key[i + 1];
    const kwStr = String(kw ?? "").toLowerCase();

    let ids: number[] = [];

    if (param === "celeb") {
      const rows = await prisma.movieCeleb.findMany({
        where: { celeb: { name: { contains: kwStr } } },
        select: { movieId: true },
      });
      ids = rows.map((r) => r.movieId);
    } else if (param === "genre") {
      const rows = await prisma.movieGenre.findMany({
        where: { genre: { name: { contains: kwStr } } },
        select: { movieId: true },
      });
      ids = rows.map((r) => r.movieId);
    } else if (param === "title") {
      const rows = await prisma.movie.findMany({
        where: {
          OR: [{ title: { contains: kwStr } }, { description: { contains: kwStr } }],
        },
        select: { movieId: true },
      });
      ids = rows.map((r) => r.movieId);
    } else if (param === "year") {
      const year = asInt(kw);
      if (year != null) {
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));
        const rows = await prisma.movie.findMany({
          where: { releaseDate: { gte: start, lt: end } },
          select: { movieId: true },
        });
        ids = rows.map((r) => r.movieId);
      }
    } else if (param === "lang") {
      const rows = await prisma.movie.findMany({
        where: { language: { contains: kwStr } },
        select: { movieId: true },
      });
      ids = rows.map((r) => r.movieId);
    } else if (param === "sim") {
      let sourceId = asInt(kw);
      if (sourceId == null) {
        const m = await prisma.movie.findFirst({
          where: { title: { contains: kwStr } },
          select: { movieId: true },
        });
        sourceId = m?.movieId ?? null;
      }
      if (sourceId != null) {
        const rows = await prisma.movieSimilarity.findMany({
          where: { movieId1: sourceId, score: { gt: 0.05, lt: 1 } },
          orderBy: { score: "desc" },
          take: 5,
          select: { movieId2: true },
        });
        ids = rows.map((r) => r.movieId2);
      }
    }
    idSets.push(new Set(ids));
  }

  if (idSets.length === 0) return [];
  let result = idSets[0]!;
  for (let i = 1; i < idSets.length; i++) {
    const next = new Set<number>();
    for (const x of result) if (idSets[i]!.has(x)) next.add(x);
    result = next;
  }
  if (result.size === 0) return [];

  const movies = await prisma.movie.findMany({
    where: { movieId: { in: Array.from(result) } },
    orderBy: { rating: "desc" },
  });
  return movies.map((m) => ({
    MOVIE_ID: m.movieId,
    TITLE: m.title,
    DESCRIPTION: m.description,
    RATING: m.rating,
    VIDEO_URL: m.videoUrl,
    IMAGE_URL: m.imageUrl,
    RELEASE_DATE: yearOf(m.releaseDate),
  }));
}

async function searchShows(key: Array<string | number>) {
  const idSets: Array<Set<number>> = [];

  for (let i = 0; i < key.length; i += 2) {
    const param = String(key[i] ?? "");
    const kw = key[i + 1];
    const kwStr = String(kw ?? "").toLowerCase();

    let ids: number[] = [];

    if (param === "celeb") {
      const rows = await prisma.showCeleb.findMany({
        where: { celeb: { name: { contains: kwStr } } },
        select: { showId: true },
      });
      ids = rows.map((r) => r.showId);
    } else if (param === "genre") {
      const rows = await prisma.showGenre.findMany({
        where: { genre: { name: { contains: kwStr } } },
        select: { showId: true },
      });
      ids = rows.map((r) => r.showId);
    } else if (param === "title") {
      const rows = await prisma.show.findMany({
        where: {
          OR: [{ title: { contains: kwStr } }, { description: { contains: kwStr } }],
        },
        select: { showId: true },
      });
      ids = rows.map((r) => r.showId);
    } else if (param === "year") {
      const year = asInt(kw);
      if (year != null) {
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));
        const rows = await prisma.show.findMany({
          where: { startDate: { gte: start, lt: end } },
          select: { showId: true },
        });
        ids = rows.map((r) => r.showId);
      }
    } else if (param === "lang") {
      const rows = await prisma.show.findMany({
        where: { language: { contains: kwStr } },
        select: { showId: true },
      });
      ids = rows.map((r) => r.showId);
    } else if (param === "sim") {
      let sourceId = asInt(kw);
      if (sourceId == null) {
        const s = await prisma.show.findFirst({
          where: { title: { contains: kwStr } },
          select: { showId: true },
        });
        sourceId = s?.showId ?? null;
      }
      if (sourceId != null) {
        const rows = await prisma.showSimilarity.findMany({
          where: { showId1: sourceId, score: { gt: 0.05, lt: 1 } },
          orderBy: { score: "desc" },
          take: 5,
          select: { showId2: true },
        });
        ids = rows.map((r) => r.showId2);
      }
    }
    idSets.push(new Set(ids));
  }

  if (idSets.length === 0) return [];
  let result = idSets[0]!;
  for (let i = 1; i < idSets.length; i++) {
    const next = new Set<number>();
    for (const x of result) if (idSets[i]!.has(x)) next.add(x);
    result = next;
  }
  if (result.size === 0) return [];

  const shows = await prisma.show.findMany({
    where: { showId: { in: Array.from(result) } },
    orderBy: { rating: "desc" },
  });
  return shows.map((s) => ({
    SHOW_ID: s.showId,
    TITLE: s.title,
    DESCRIPTION: s.description,
    RATING: s.rating,
    IMAGE_URL: s.imageUrl,
    RELEASE_DATE:
      s.startDate && s.endDate ? `${yearOf(s.startDate)} - ${yearOf(s.endDate)}` : yearOf(s.startDate),
  }));
}

async function searchStatic(kw: string) {
  const k = kw.toLowerCase();
  const movies = await prisma.movie.findMany({
    where: {
      OR: [
        { title: { contains: k } },
        { description: { contains: k } },
        { celebs: { some: { celeb: { name: { contains: k } } } } },
        { genres: { some: { genre: { name: { contains: k } } } } },
      ],
    },
  });
  const shows = await prisma.show.findMany({
    where: {
      OR: [
        { title: { contains: k } },
        { description: { contains: k } },
        { celebs: { some: { celeb: { name: { contains: k } } } } },
        { genres: { some: { genre: { name: { contains: k } } } } },
      ],
    },
  });
  return {
    movies: movies.map((m) => ({
      MOVIE_ID: m.movieId,
      TITLE: m.title,
      DESCRIPTION: m.description,
      RATING: m.rating,
      IMAGE_URL: m.imageUrl,
      VIDEO_URL: m.videoUrl,
      RELEASE_DATE: yearOf(m.releaseDate),
    })),
    shows: shows.map((s) => ({
      SHOW_ID: s.showId,
      TITLE: s.title,
      DESCRIPTION: s.description,
      RATING: s.rating,
      IMAGE_URL: s.imageUrl,
      RELEASE_DATE:
        s.startDate && s.endDate
          ? `${yearOf(s.startDate)} - ${yearOf(s.endDate)}`
          : yearOf(s.startDate),
    })),
  };
}

export async function search(req: Request, res: Response, _next: NextFunction) {
  const body = req.body as SearchBody;
  const ss = body.ss;
  const key = body.key ?? [];

  try {
    if (ss === "static") {
      // For "static", key is the keyword string directly.
      const kw = Array.isArray(key) ? String(key[0] ?? "") : String(key);
      const r = await searchStatic(kw);
      return res.status(200).json([
        { title: "Search Result from Movies", data: r.movies },
        { title: "Search Result from Shows", data: r.shows },
      ]);
    }

    const result: Array<{ title: string; data: unknown[] }> = [];
    if (ss === "movie" || ss === "all") {
      const movies = await searchMovies(key);
      result.push({ title: "Search Result from Movies", data: movies });
    }
    if (ss === "show" || ss === "all") {
      const shows = await searchShows(key);
      result.push({ title: "Search Result from Shows", data: shows });
    }
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Search failed" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// getEpisodes
// ────────────────────────────────────────────────────────────────────────────
export async function getEpisodes(req: Request, res: Response, _next: NextFunction) {
  const { show_id, email, profile_id } = req.query as Record<string, string>;
  const showId = asInt(show_id);
  if (showId == null) return res.status(400).json({ message: "show_id required" });

  try {
    const response: Array<{ title: string; data: unknown[] }> = [];

    if (email && profile_id) {
      const lastWatched = await prisma.episodeWatch.findMany({
        where: { showId, email, profileId: profile_id },
        orderBy: { time: "desc" },
        include: { episode: true },
      });
      if (lastWatched.length > 0) {
        response.push({
          title: "Continue Watching",
          data: lastWatched.map((w) => ({
            SHOW_ID: w.showId,
            SEASON_NO: w.seasonNo,
            EPISODE_NO: w.episodeNo,
            TITLE: w.episode.title,
            DESCRIPTION: w.episode.description,
            IMAGE_URL: w.episode.imageUrl,
            VIDEO_URL: w.episode.videoUrl,
            WATCHED_UPTO: w.watchedUpto,
            TIME: w.time,
          })),
        });
      }
    }

    const show = await prisma.show.findUnique({ where: { showId }, select: { seasons: true } });
    const seasons = show?.seasons ?? 0;

    const episodes = await prisma.episode.findMany({
      where: { showId },
      orderBy: [{ seasonNo: "asc" }, { episodeNo: "asc" }],
    });

    for (let s = 1; s <= seasons; s++) {
      response.push({
        title: `Season ${s}`,
        data: episodes
          .filter((e) => e.seasonNo === s)
          .map((e) => ({
            SHOW_ID: e.showId,
            SEASON_NO: e.seasonNo,
            EPISODE_NO: e.episodeNo,
            TITLE: e.title,
            DESCRIPTION: e.description,
            LENGTH: e.length,
            IMAGE_URL: e.imageUrl,
            VIDEO_URL: e.videoUrl,
          })),
      });
    }

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// getSuggestions — delegates to the ML server.
// ────────────────────────────────────────────────────────────────────────────
export async function getSuggestions(req: Request, res: Response, _next: NextFunction) {
  const { email, profile_id } = req.query as Record<string, string>;
  try {
    const r = await axios.get(`${env.ML_SERVICE_URL}/recommend`, {
      params: { email, profile_id },
      timeout: 15000,
    });
    res.status(200).json([{ title: "Recommended Movies for you", data: r.data }]);
  } catch (err) {
    console.log("ML suggestions error:", (err as Error).message);
    res.status(200).json([{ title: "Recommended Movies for you", data: [] }]);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// newAndPopular — 8 sections.
// ────────────────────────────────────────────────────────────────────────────
export async function newAndPopular(req: Request, res: Response, _next: NextFunction) {
  const { email } = req.query as Record<string, string>;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  try {
    const [newMovies, newShows, upcomingMovies, upcomingShows, user] = await Promise.all([
      prisma.movie.findMany({
        where: { releaseDate: { lte: now } },
        orderBy: { releaseDate: "desc" },
        take: 50,
      }),
      prisma.show.findMany({
        where: { startDate: { lte: now } },
        orderBy: { startDate: "desc" },
        take: 50,
      }),
      prisma.movie.findMany({
        where: { releaseDate: { gt: now } },
        orderBy: { releaseDate: "desc" },
        take: 50,
      }),
      prisma.show.findMany({
        where: { startDate: { gt: now } },
        orderBy: { startDate: "desc" },
        take: 50,
      }),
      email
        ? prisma.user.findUnique({ where: { email }, select: { country: true } })
        : Promise.resolve(null),
    ]);

    const userCountry = user?.country ?? "your region";

    // Collect emails of users in the same country (for region filtering).
    let regionEmails: string[] | undefined;
    if (user?.country) {
      const countryUsers = await prisma.user.findMany({
        where: { country: user.country },
        select: { email: true },
      });
      regionEmails = countryUsers.map((u) => u.email);
    }

    // Top-10 in region (movies)
    const regionMovieAgg = await prisma.movieWatch.groupBy({
      by: ["movieId"],
      where: {
        time: { gte: weekAgo },
        ...(regionEmails ? { email: { in: regionEmails } } : {}),
      },
      _count: { _all: true },
      orderBy: { _count: { movieId: "desc" } },
      take: 10,
    });
    const regionMovies = await prisma.movie.findMany({
      where: { movieId: { in: regionMovieAgg.map((r) => r.movieId) } },
    });
    const regionMovieMap = new Map(regionMovies.map((m) => [m.movieId, m]));

    // Top-10 in region (shows)
    const regionShowAgg = await prisma.episodeWatch.groupBy({
      by: ["showId"],
      where: {
        time: { gte: weekAgo },
        ...(regionEmails ? { email: { in: regionEmails } } : {}),
      },
      _count: { _all: true },
      orderBy: { _count: { showId: "desc" } },
      take: 10,
    });
    const regionShows = await prisma.show.findMany({
      where: { showId: { in: regionShowAgg.map((r) => r.showId) } },
    });

    // Global trending
    const globalMovieAgg = await prisma.movieWatch.groupBy({
      by: ["movieId"],
      where: { time: { gte: weekAgo } },
      _count: { _all: true },
      orderBy: { _count: { movieId: "desc" } },
      take: 10,
    });
    const globalMovies = await prisma.movie.findMany({
      where: { movieId: { in: globalMovieAgg.map((g) => g.movieId) } },
    });
    const globalShowAgg = await prisma.episodeWatch.groupBy({
      by: ["showId"],
      where: { time: { gte: weekAgo } },
      _count: { _all: true },
      orderBy: { _count: { showId: "desc" } },
      take: 10,
    });
    const globalShows = await prisma.show.findMany({
      where: { showId: { in: globalShowAgg.map((g) => g.showId) } },
    });

    const movieRow = (m: typeof newMovies[0]) => ({
      MOVIE_ID: m.movieId,
      TITLE: m.title,
      DESCRIPTION: m.description,
      VIDEO_URL: m.videoUrl,
      IMAGE_URL: m.imageUrl,
      RELEASE_DATE: yearOf(m.releaseDate),
      RATING: m.rating,
    });
    const showRow = (s: typeof newShows[0]) => ({
      SHOW_ID: s.showId,
      TITLE: s.title,
      DESCRIPTION: s.description,
      IMAGE_URL: s.imageUrl,
      VIDEO_URL: s.videoUrl,
      START_YEAR: yearOf(s.startDate),
      RATING: s.rating,
    });

    res.status(200).json([
      {
        title: `Top 10 Movies in ${userCountry}`,
        data: regionMovieAgg
          .map((r) => regionMovieMap.get(r.movieId))
          .filter((m): m is NonNullable<typeof m> => m != null)
          .map(movieRow),
      },
      {
        title: `Top 10 Shows in ${userCountry}`,
        data: regionShows.map(showRow),
      },
      { title: "Trending Movies ", data: globalMovies.map(movieRow) },
      { title: "Trending Shows ", data: globalShows.map(showRow) },
      { title: "New Movies", data: newMovies.map(movieRow) },
      { title: "New Shows", data: newShows.map(showRow) },
      { title: "Upcoming Movies", data: upcomingMovies.map(movieRow) },
      { title: "Upcoming Shows", data: upcomingShows.map(showRow) },
    ]);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: (err as Error).message });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// similarity — admin endpoint, triggers bulk similarity recomputation.
// ────────────────────────────────────────────────────────────────────────────
export async function similarity(req: Request, res: Response, _next: NextFunction) {
  const { type } = req.query as { type?: string };
  if (type !== "movie" && type !== "show") {
    return res.status(400).json({ message: "type must be 'movie' or 'show'" });
  }
  try {
    const count = await computeBulkSimilarity(type);
    res.status(200).json({ message: `Similarity Calculation successful for ${type}s`, written: count });
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Similarity error" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// getGenres — for a specific movie or show
// ────────────────────────────────────────────────────────────────────────────
export async function getGenres(req: Request, res: Response, _next: NextFunction) {
  const { movie_id, show_id } = req.query as Record<string, string>;
  try {
    if (movie_id) {
      const movieId = asInt(movie_id);
      if (movieId == null) return res.status(400).json({ message: "Invalid movie_id" });
      const movie = await prisma.movie.findUnique({
        where: { movieId },
        select: { totalViews: true, totalVotes: true },
      });
      const links = await prisma.movieGenre.findMany({
        where: { movieId },
        include: { genre: { select: { name: true } } },
      });
      res.status(200).json(
        links.map((l) => ({
          NAME: l.genre.name,
          TOTAL_VIEWS: movie?.totalViews ?? 0,
          TOTAL_VOTES: movie?.totalVotes ?? 0,
        })),
      );
    } else {
      const showId = asInt(show_id);
      if (showId == null) return res.status(400).json({ message: "Invalid show_id" });
      const show = await prisma.show.findUnique({
        where: { showId },
        select: { totalViews: true, totalVotes: true },
      });
      const links = await prisma.showGenre.findMany({
        where: { showId },
        include: { genre: { select: { name: true } } },
      });
      res.status(200).json(
        links.map((l) => ({
          NAME: l.genre.name,
          TOTAL_VIEWS: show?.totalViews ?? 0,
          TOTAL_VOTES: show?.totalVotes ?? 0,
        })),
      );
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Getting genre failed" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// getCelebs — top 5 celebs for a specific movie/show
// ────────────────────────────────────────────────────────────────────────────
export async function getCelebs(req: Request, res: Response, _next: NextFunction) {
  const { movie_id, show_id } = req.query as Record<string, string>;
  try {
    if (movie_id) {
      const movieId = asInt(movie_id);
      if (movieId == null) return res.status(400).json({ message: "Invalid movie_id" });
      const links = await prisma.movieCeleb.findMany({
        where: { movieId },
        take: 5,
        include: {
          movie: { select: { title: true } },
          celeb: { select: { name: true } },
        },
      });
      res.status(200).json(links.map((l) => ({ TITLE: l.movie.title, NAME: l.celeb.name })));
    } else {
      const showId = asInt(show_id);
      if (showId == null) return res.status(400).json({ message: "Invalid show_id" });
      const links = await prisma.showCeleb.findMany({
        where: { showId },
        take: 5,
        include: {
          show: { select: { title: true } },
          celeb: { select: { name: true } },
        },
      });
      res.status(200).json(links.map((l) => ({ TITLE: l.show.title, NAME: l.celeb.name })));
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Celeb error" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// getSimilar — top 5 similar movies/shows
// ────────────────────────────────────────────────────────────────────────────
export async function getSimilar(req: Request, res: Response, _next: NextFunction) {
  const { movie_id, show_id } = req.query as Record<string, string>;
  try {
    if (movie_id) {
      const movieId = asInt(movie_id);
      if (movieId == null) return res.status(400).json({ message: "Invalid movie_id" });
      const links = await prisma.movieSimilarity.findMany({
        where: { movieId1: movieId, score: { gt: 0.05, lt: 1 } },
        orderBy: { score: "desc" },
        take: 5,
        include: { movie2: true },
      });
      res.status(200).json(
        links.map((l) => ({
          MOVIE_ID: l.movie2.movieId,
          SCORE: l.score,
          TITLE: l.movie2.title,
          DESCRIPTION: l.movie2.description,
          IMAGE_URL: l.movie2.imageUrl,
          VIDEO_URL: l.movie2.videoUrl,
          RATING: l.movie2.rating,
          RELEASE_DATE: yearOf(l.movie2.releaseDate),
        })),
      );
    } else {
      const showId = asInt(show_id);
      if (showId == null) return res.status(400).json({ message: "Invalid show_id" });
      const links = await prisma.showSimilarity.findMany({
        where: { showId1: showId, score: { gt: 0.05, lt: 1 } },
        orderBy: { score: "desc" },
        take: 5,
        include: { show2: true },
      });
      res.status(200).json(
        links.map((l) => ({
          SHOW_ID: l.show2.showId,
          SCORE: l.score,
          TITLE: l.show2.title,
          DESCRIPTION: l.show2.description,
          IMAGE_URL: l.show2.imageUrl,
          RATING: l.show2.rating,
          RELEASE_DATE:
            l.show2.startDate && l.show2.endDate
              ? `${yearOf(l.show2.startDate)} - ${yearOf(l.show2.endDate)}`
              : yearOf(l.show2.startDate),
        })),
      );
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Couldnt find similar items" });
  }
}
