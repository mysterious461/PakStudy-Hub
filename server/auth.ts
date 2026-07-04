import type { NextFunction, Request, Response } from "express";
import { isAdminRole } from "./businessRules";
import { adminAuth } from "./firebaseAdmin";
import { storage } from "./storage";

export type AuthUser = {
  uid: string;
  email?: string;
  name: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getBearerToken(req: Request): string | undefined {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: "Missing Firebase ID token" });

    const decoded = await adminAuth.verifyIdToken(token);
    const name = decoded.name || decoded.email?.split("@")[0] || "Student";
    const existing = await storage.getUser(decoded.uid);
    const user = existing ?? await storage.upsertUser({
      id: decoded.uid,
      email: decoded.email || `${decoded.uid}@firebase.local`,
      name,
      role: typeof decoded.role === "string" ? decoded.role : "Student",
    });

    if (user.isBanned) return res.status(403).json({ message: "User is banned" });

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: user.name || name,
      role: user.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Firebase ID token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  if (!isAdminRole(req.user.role)) {
    return res.status(403).json({ message: "Admin role required" });
  }
  return next();
}
