import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type AuthRequest = Request & { userId?: string };

export function createToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
