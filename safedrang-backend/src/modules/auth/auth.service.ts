import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database";
import { config } from "../../config";
import { createError } from "../../middleware/error.middleware";
import { UserRole } from "@prisma/client";

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw createError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: "CUSTOMER",
        },
      });

      await tx.customer.create({
        data: {
          userId: newUser.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });

      return newUser;
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );
    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createError("Invalid credentials", 401);

    if (user.status !== "ACTIVE")
      throw createError("Account is not active", 403);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw createError("Invalid credentials", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );
    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  async refreshTokens(token: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored)
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw createError("Invalid or expired refresh token", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.status !== "ACTIVE")
      throw createError("User not found or inactive", 403);

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );
    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if user exists
    // In production: generate a secure token, store it, send email
    // For now, return success regardless
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const accessToken = jwt.sign(
      { id: userId, email, role },
      config.jwt.accessSecret,
      {
        expiresIn: config.jwt.accessExpiresIn,
      } as jwt.SignOptions,
    );

    const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone: string | null;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };
  }
}
