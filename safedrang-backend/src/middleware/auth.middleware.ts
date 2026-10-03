import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../config/database";
import { UserRole } from "@prisma/client";
import { sendError } from "../utils/response";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return sendError(res, "Authentication required", 401);
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as {
      id: string;
      email: string;
      role: UserRole;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "Account is not active", 403);
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendError(res, "Token expired", 401);
    }
    return sendError(res, "Invalid token", 401);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, "Authentication required", 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, "Insufficient permissions", 403);
    }
    next();
  };
};

export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "ORDER_MANAGER",
  "PRODUCT_MANAGER",
  "CUSTOMER_SUPPORT",
  "VIEW_ONLY",
];
