import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../models/http-error.js";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError("Could not find this route", 404));
}

export function errorHandler(
  err: Error & { code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) return;
  res.status(err.code ?? 500).json({ message: err.message ?? "An unknown error occurred" });
}
