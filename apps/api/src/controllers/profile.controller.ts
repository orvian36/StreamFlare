import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";
import { HttpError } from "../models/http-error.js";

function asStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function asInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.profile.findMany({ where: { email: req.params.email } });
    res.status(200).json({
      profile: rows.map((p) => ({
        PROFILE_ID: p.profileId,
        EMAIL: p.email,
        DOB: p.dob,
      })),
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Cannot get profile from database" });
  }
}

export async function addProfile(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID, DOB } = req.body as {
    EMAIL: string;
    PROFILE_ID: string;
    DOB: string;
  };
  try {
    await prisma.profile.create({
      data: { email: EMAIL, profileId: PROFILE_ID, dob: new Date(DOB) },
    });
    res.status(201).json({ message: "Successfully created profile" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to add profile to database" });
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  // Legacy SQL referenced a non-existent NAME column on PROFILE; the original
  // endpoint silently failed. We only update DOB here.
  const { EMAIL, PROFILE_ID, DOB } = req.body as {
    EMAIL: string;
    PROFILE_ID: string;
    DOB: string;
  };
  try {
    await prisma.profile.update({
      where: { email_profileId: { email: EMAIL, profileId: PROFILE_ID } },
      data: { dob: new Date(DOB) },
    });
    res.status(200).json({ message: "Successfully updated profile" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to update profile" });
  }
}

export async function deleteProfile(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID } = req.body as { EMAIL: string; PROFILE_ID: string };
  try {
    await prisma.profile.delete({
      where: { email_profileId: { email: EMAIL, profileId: PROFILE_ID } },
    });
    res.status(200).json({ message: "Successfully deleted profile" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to delete profile" });
  }
}

export async function hasWatchListed(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID, MOVIE_ID, SHOW_ID } = req.body as {
    EMAIL: string;
    PROFILE_ID: string;
    MOVIE_ID?: string | number;
    SHOW_ID?: string | number;
  };
  try {
    const movieId = asInt(MOVIE_ID);
    const showId = asInt(SHOW_ID);

    let found = false;
    if (movieId != null) {
      const m = await prisma.movieWatchlist.findUnique({
        where: { movieId_email_profileId: { movieId, email: EMAIL, profileId: PROFILE_ID } },
      });
      if (m) found = true;
    }
    if (!found && showId != null) {
      const s = await prisma.showWatchlist.findUnique({
        where: { showId_profileId_email: { showId, profileId: PROFILE_ID, email: EMAIL } },
      });
      if (s) found = true;
    }

    res.status(200).json({ message: found ? "YES" : "NO" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Couldnt get watchlist info" });
  }
}

export async function addToWatchList(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID, MOVIE_ID, SHOW_ID } = req.body as {
    EMAIL: string;
    PROFILE_ID: string;
    MOVIE_ID?: string | number;
    SHOW_ID?: string | number;
  };
  const movieId = asInt(MOVIE_ID);
  const showId = asInt(SHOW_ID);

  try {
    if (!movieId && showId != null) {
      await prisma.showWatchlist.upsert({
        where: { showId_profileId_email: { showId, profileId: PROFILE_ID, email: EMAIL } },
        create: { showId, profileId: PROFILE_ID, email: EMAIL },
        update: {},
      });
    } else if (movieId != null) {
      await prisma.movieWatchlist.upsert({
        where: { movieId_email_profileId: { movieId, email: EMAIL, profileId: PROFILE_ID } },
        create: { movieId, email: EMAIL, profileId: PROFILE_ID },
        update: {},
      });
    }
    res.status(200).json({ message: "added" });
  } catch (err) {
    console.log(err);
    res.status(400).json(err as object);
  }
}

export async function deleteWatchList(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID, MOVIE_ID, SHOW_ID } = req.body as {
    EMAIL: string;
    PROFILE_ID: string;
    MOVIE_ID?: string | number;
    SHOW_ID?: string | number;
  };
  const movieId = asInt(MOVIE_ID);
  const showId = asInt(SHOW_ID);

  try {
    if (movieId != null) {
      await prisma.movieWatchlist.delete({
        where: { movieId_email_profileId: { movieId, email: EMAIL, profileId: PROFILE_ID } },
      });
    } else if (showId != null) {
      await prisma.showWatchlist.delete({
        where: { showId_profileId_email: { showId, profileId: PROFILE_ID, email: EMAIL } },
      });
    }
    res.status(200).json({ message: "deleted" });
  } catch (err) {
    console.log(err);
    res.status(400).json(err as object);
  }
}

export async function getWatchList(req: Request, res: Response, next: NextFunction) {
  const { PROFILE_ID, EMAIL } = req.body as { PROFILE_ID: string; EMAIL: string };
  try {
    const movieRows = await prisma.movieWatchlist.findMany({
      where: { email: EMAIL, profileId: PROFILE_ID },
      include: {
        movie: {
          select: {
            movieId: true,
            title: true,
            description: true,
            rating: true,
            maturityRating: true,
            imageUrl: true,
          },
        },
      },
    });
    const showRows = await prisma.showWatchlist.findMany({
      where: { email: EMAIL, profileId: PROFILE_ID },
      include: {
        show: {
          select: {
            showId: true,
            title: true,
            description: true,
            rating: true,
            maturityRating: true,
            imageUrl: true,
          },
        },
      },
    });

    const movies = {
      title: "Movies",
      data: movieRows.map((r) => ({
        MOVIE_ID: r.movie.movieId,
        TITLE: r.movie.title,
        DESCRIPTION: r.movie.description,
        RATING: r.movie.rating,
        MATURITY_RATING: r.movie.maturityRating,
        IMAGE_URL: r.movie.imageUrl,
      })),
    };
    const shows = {
      title: "Shows",
      data: showRows.map((r) => ({
        SHOW_ID: r.show.showId,
        TITLE: r.show.title,
        DESCRIPTION: r.show.description,
        RATING: r.show.rating,
        MATURITY_RATING: r.show.maturityRating,
        IMAGE_URL: r.show.imageUrl,
      })),
    };

    res.status(200).json({ arr: [shows, movies] });
  } catch (err) {
    console.log(err);
    res.status(400).json(err as object);
  }
}

export async function addRating(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID, MOVIE_ID, SHOW_ID, RATING } = req.body as {
    EMAIL: string;
    PROFILE_ID: string;
    MOVIE_ID?: string | number;
    SHOW_ID?: string | number;
    RATING: number;
  };
  const movieId = asInt(MOVIE_ID);
  const showId = asInt(SHOW_ID);
  const rating = asInt(RATING);

  try {
    if (movieId != null) {
      await prisma.movieWatch.upsert({
        where: { movieId_email_profileId: { movieId, email: EMAIL, profileId: PROFILE_ID } },
        create: { movieId, email: EMAIL, profileId: PROFILE_ID, rating },
        update: { rating },
      });
    } else if (showId != null) {
      await prisma.showWatch.upsert({
        where: { profileId_showId_email: { profileId: PROFILE_ID, showId, email: EMAIL } },
        create: { profileId: PROFILE_ID, showId, email: EMAIL, rating },
        update: { rating },
      });
    }
    res.status(200).json({ message: "Inserted rating" });
  } catch (err) {
    console.log(err);
    next(new HttpError((err as Error).message, 500));
  }
}

export async function findRating(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID, MOVIE_ID, SHOW_ID } = req.body as {
    EMAIL: string;
    PROFILE_ID: string;
    MOVIE_ID?: string | number;
    SHOW_ID?: string | number;
  };
  const movieId = asInt(MOVIE_ID);
  const showId = asInt(SHOW_ID);

  try {
    if (movieId != null) {
      const r = await prisma.movieWatch.findUnique({
        where: { movieId_email_profileId: { movieId, email: EMAIL, profileId: PROFILE_ID } },
        select: { rating: true },
      });
      res.status(200).json({ rating: r?.rating ?? null });
    } else if (showId != null) {
      const r = await prisma.showWatch.findUnique({
        where: { profileId_showId_email: { profileId: PROFILE_ID, showId, email: EMAIL } },
        select: { rating: true },
      });
      res.status(200).json({ rating: r?.rating ?? null });
    } else {
      res.status(200).json({ rating: null });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ err });
  }
}

export async function getTime(req: Request, res: Response, next: NextFunction) {
  const { movie_id, profile_id, email, show_id, episode_no, season_no } = req.query as Record<
    string,
    string
  >;
  try {
    if (movie_id) {
      const movieId = asInt(movie_id);
      if (movieId == null) {
        return res.status(400).json({ message: "Invalid movie_id" });
      }
      const r = await prisma.movieWatch.findUnique({
        where: {
          movieId_email_profileId: { movieId, email: email ?? "", profileId: profile_id ?? "" },
        },
        select: { watchedUpto: true },
      });
      res.status(200).json({ WATCHED_UPTO: r?.watchedUpto ?? 0 });
    } else if (show_id && season_no && episode_no) {
      const showId = asInt(show_id);
      const seasonNo = asInt(season_no);
      const episodeNo = asInt(episode_no);
      if (showId == null || seasonNo == null || episodeNo == null) {
        return res.status(400).json({ message: "Invalid show/season/episode" });
      }
      const r = await prisma.episodeWatch.findUnique({
        where: {
          profileId_seasonNo_showId_episodeNo_email: {
            profileId: profile_id ?? "",
            seasonNo,
            showId,
            episodeNo,
            email: email ?? "",
          },
        },
        select: { watchedUpto: true },
      });
      res.status(200).json({ WATCHED_UPTO: r?.watchedUpto ?? 0 });
    } else {
      res.status(400).json({ message: "Missing identifiers" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function setTime(req: Request, res: Response, next: NextFunction) {
  const { movie_id, show_id, season_no, episode_no, profile_id, email, watched_upto } =
    req.body as Record<string, string | number>;
  const watchedUpto = Number(watched_upto) || 0;

  try {
    if (movie_id) {
      const movieId = asInt(movie_id);
      if (movieId == null) return res.status(400).json({ message: "Invalid movie_id" });
      await prisma.movieWatch.upsert({
        where: {
          movieId_email_profileId: { movieId, email: asStr(email), profileId: asStr(profile_id) },
        },
        create: {
          movieId,
          email: asStr(email),
          profileId: asStr(profile_id),
          watchedUpto,
        },
        update: { watchedUpto, time: new Date() },
      });
      res.status(200).json({ message: "Time saved for movie" });
    } else if (show_id && episode_no && season_no) {
      const showId = asInt(show_id);
      const seasonNo = asInt(season_no);
      const episodeNo = asInt(episode_no);
      if (showId == null || seasonNo == null || episodeNo == null) {
        return res.status(400).json({ message: "Invalid show/season/episode" });
      }
      await prisma.episodeWatch.upsert({
        where: {
          profileId_seasonNo_showId_episodeNo_email: {
            profileId: asStr(profile_id),
            seasonNo,
            showId,
            episodeNo,
            email: asStr(email),
          },
        },
        create: {
          profileId: asStr(profile_id),
          seasonNo,
          showId,
          episodeNo,
          email: asStr(email),
          watchedUpto,
        },
        update: { watchedUpto, time: new Date() },
      });
      res.status(200).json({ message: "Time saved for the episode" });
    } else {
      res.status(400).json({ message: "Missing identifiers" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function movieContinueWatching(req: Request, res: Response, next: NextFunction) {
  const { profile_id, email } = req.query as Record<string, string>;
  try {
    const rows = await prisma.movieWatch.findMany({
      where: {
        email,
        profileId: profile_id,
        watchedUpto: { gt: 0 },
      },
      orderBy: { time: "desc" },
      include: {
        movie: {
          select: {
            movieId: true,
            title: true,
            description: true,
            imageUrl: true,
            videoUrl: true,
            rating: true,
            releaseDate: true,
          },
        },
      },
    });
    res.status(200).json({
      title: "Continue Watching",
      data: rows.map((r) => ({
        MOVIE_ID: r.movie.movieId,
        TITLE: r.movie.title,
        DESCRIPTION: r.movie.description,
        IMAGE_URL: r.movie.imageUrl,
        VIDEO_URL: r.movie.videoUrl,
        RATING: r.movie.rating,
        RELEASE_DATE: r.movie.releaseDate.getUTCFullYear(),
        TIME: r.time,
      })),
    });
  } catch (err) {
    console.log(err);
    res.status(400).json(err as object);
  }
}

export async function showContinueWatching(req: Request, res: Response, next: NextFunction) {
  const { profile_id, email } = req.query as Record<string, string>;
  try {
    // Group by show, ordered by max(episode_watch.time) desc.
    // Use a raw approach via groupBy on showId, then look up shows.
    const watches = await prisma.episodeWatch.groupBy({
      by: ["showId"],
      where: { email, profileId: profile_id },
      _max: { time: true },
      orderBy: { _max: { time: "desc" } },
    });
    const showIds = watches.map((w) => w.showId);
    if (showIds.length === 0) {
      return res.status(200).json({ title: "Continue Watching", data: [] });
    }
    const shows = await prisma.show.findMany({
      where: { showId: { in: showIds } },
      select: {
        showId: true,
        title: true,
        imageUrl: true,
        description: true,
        rating: true,
        startDate: true,
      },
    });
    const showMap = new Map(shows.map((s) => [s.showId, s]));
    const ordered = watches
      .map((w) => showMap.get(w.showId))
      .filter((s): s is NonNullable<typeof s> => s != null);
    res.status(200).json({
      title: "Continue Watching",
      data: ordered.map((s) => ({
        SHOW_ID: s.showId,
        TITLE: s.title,
        IMAGE_URL: s.imageUrl,
        DESCRIPTION: s.description,
        RATING: Math.round(s.rating * 100) / 100,
        RELEASE_DATE: s.startDate ? s.startDate.getUTCFullYear() : null,
      })),
    });
  } catch (err) {
    console.log(err);
    res.status(400).json(err as object);
  }
}

export async function episodeContinueWatching(_req: Request, res: Response, _next: NextFunction) {
  // Legacy handler was empty; preserving no-op semantics with an empty list.
  res.status(200).json({ title: "Continue Watching", data: [] });
}
