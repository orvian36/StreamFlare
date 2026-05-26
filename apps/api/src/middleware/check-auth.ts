import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../models/http-error.js";
import { env } from "../services/env.js";

declare global {
  namespace Express {
    interface Request {
      userData?: { EMAIL: string };
    }
  }
}

export function checkAuth(req: Request, _res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") return next();
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Authentication failed!");
    const decoded = jwt.verify(token, env.JWT_SECRET) as { EMAIL: string };
    req.userData = { EMAIL: decoded.EMAIL };
    next();
  } catch {
    next(new HttpError("Authentication failed!", 401));
  }
}
