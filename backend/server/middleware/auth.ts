import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { success } from "zod";
import { JWT_SECRET } from "../config";
import prisma from "@xl-trading/db";

export interface AuthRequest extends Request {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer") ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authorization token missing",
        error: "MISSING TOKEN",
      });
      return;
    }

    let decoded: { id: string };
    try {
      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
        throw new Error("Invalid token payload");
      }
    } catch (jwtError: any) {
      if (jwtError.name === "TokenExpiredError") {
        res.status(401).json({
          success: false,
          message: "Token has expired",
          error: "TOKEN_EXPIRED",
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
        error: "INVALID_TOKEN",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    req.userId = user.id;
    req.user = {
      ...user,
      name: user.name ?? "",
    };

    next();
  } catch (error: any) {
    console.error("Auth middleware error: ", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: process.env.NODE_ENV === "dev" ? error.message : "INTERNAL ERROR",
    });
  }
};
