import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { prisma } from "@streamflare/db";
import { HttpError } from "../models/http-error.js";
import { hashPassword, verifyPassword, signToken } from "../services/auth.service.js";

export async function getUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({
      users: users.map((u) => ({
        NAME: u.name,
        EMAIL: u.email,
        DOB: u.dob,
        COUNTRY: u.country,
        CREDIT_CARD: u.creditCard,
        PHONE: u.phone,
        JOINED: u.joined,
        MAX_PROFILES: u.maxProfiles,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new HttpError("Invalid Input", 422));

  const { NAME, EMAIL, DOB, COUNTRY, CREDIT_CARD, PASSWORD, PHONE } = req.body as {
    NAME: string;
    EMAIL: string;
    DOB: string;
    COUNTRY: string;
    CREDIT_CARD: string;
    PASSWORD: string;
    PHONE?: string;
  };

  try {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (existing) {
      return next(new HttpError("User exists already, please login instead.", 423));
    }

    const hashed = await hashPassword(PASSWORD);
    await prisma.user.create({
      data: {
        name: NAME,
        email: EMAIL,
        dob: new Date(DOB),
        country: COUNTRY,
        creditCard: CREDIT_CARD,
        password: hashed,
        phone: PHONE ?? null,
      },
    });

    const token = signToken(EMAIL);
    res.status(201).json({ EMAIL, token });
  } catch (err) {
    next(new HttpError((err as Error).message, 424));
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PASSWORD } = req.body as { EMAIL: string; PASSWORD: string };
  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) return next(new HttpError("User does not exist. Please sign up instead", 422));
    const ok = await verifyPassword(PASSWORD, user.password);
    if (!ok) return next(new HttpError("Incorrect Password", 423));
    const token = signToken(EMAIL);
    res.status(201).json({ EMAIL, token });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getMaxProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.params.email },
      select: { maxProfiles: true },
    });
    if (!user) return next(new HttpError("User not found", 404));
    res.status(200).json({ mp: { MAX_PROFILES: user.maxProfiles } });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getNumProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await prisma.profile.count({ where: { email: req.params.email } });
    res.status(200).json({ C: { C: c } });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function updatePhone(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, Phone } = req.body as { EMAIL: string; Phone: string };
  try {
    await prisma.user.update({ where: { email: EMAIL }, data: { phone: Phone } });
    res.status(201).json({ message: "Successfully updated phone" });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.params.email },
      select: { phone: true },
    });
    if (!user) return next(new HttpError("User not found", 404));
    res.status(200).json({ phone: { PHONE: user.phone } });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, OLD_PASS, NEW_PASS, NEW_PASS_CON } = req.body as {
    EMAIL: string;
    OLD_PASS: string;
    NEW_PASS: string;
    NEW_PASS_CON: string;
  };
  if (NEW_PASS !== NEW_PASS_CON) return next(new HttpError("New passwords don't match", 422));
  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) return next(new HttpError("User not found", 404));
    const ok = await verifyPassword(OLD_PASS, user.password);
    if (!ok) return next(new HttpError("Incorrect Password", 423));
    await prisma.user.update({
      where: { email: EMAIL },
      data: { password: await hashPassword(NEW_PASS) },
    });
    res.status(201).json({ message: "password updated successfully" });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getMovieWatchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.movieWatch.findMany({
      where: { email: req.params.email, profileId: req.params.prof_id },
      orderBy: { time: "desc" },
      include: { movie: { select: { title: true, imageUrl: true } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        RATING: r.rating,
        WATCHED_UPTO: r.watchedUpto,
        TITLE: r.movie.title,
        TIME: r.time,
        IMAGE_URL: r.movie.imageUrl,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getMovieWatchHistory2(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.movieWatch.findMany({
      where: { email: req.params.email },
      orderBy: { time: "desc" },
      include: { movie: { select: { title: true, imageUrl: true } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        RATING: r.rating,
        WATCHED_UPTO: r.watchedUpto,
        TITLE: r.movie.title,
        TIME: r.time,
        IMAGE_URL: r.movie.imageUrl,
        PID: r.profileId,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getShowWatchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.episodeWatch.findMany({
      where: { email: req.params.email, profileId: req.params.prof_id },
      include: { episode: { include: { show: { select: { title: true, rating: true } } } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        TITLE: r.episode.show.title,
        RATING: r.episode.show.rating,
        SEASON_NO: r.seasonNo,
        EPISODE_NO: r.episodeNo,
        WATCHED_UPTO: r.watchedUpto,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getShowWatchHistory2(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.episodeWatch.findMany({
      where: { email: req.params.email },
      include: { episode: { include: { show: { select: { title: true, rating: true } } } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        TITLE: r.episode.show.title,
        RATING: r.episode.show.rating,
        SEASON_NO: r.seasonNo,
        EPISODE_NO: r.episodeNo,
        WATCHED_UPTO: r.watchedUpto,
        PID: r.profileId,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}
