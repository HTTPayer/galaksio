import { Request, Response, NextFunction } from "express";
import { A2AEnvelope } from "../types.js";

/**
 * parseA2A middleware ensures the body is an A2A envelope and attaches it to req.a2a
 */
export function parseA2A(req: Request & { a2a?: A2AEnvelope }, res: Response, next: NextFunction) {
  const env = req.body as A2AEnvelope | undefined;
  if (!env || !env.type || !env.payload) {
    return res.status(400).json({ error: "invalid-a2a-envelope" });
  }
  req.a2a = env;
  return next();
}
