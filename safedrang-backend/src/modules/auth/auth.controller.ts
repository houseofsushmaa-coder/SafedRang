import { Request, Response } from "express";
import Joi from "joi";
import { AuthService } from "./auth.service";
import { sendSuccess, sendError, asyncHandler } from "../../utils/response";

const authService = new AuthService();

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return sendError(res, error.details[0].message, 422);

    const result = await authService.register(value);
    return sendSuccess(res, result, "Registration successful", 201);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return sendError(res, error.details[0].message, 422);

    const result = await authService.login(value.email, value.password);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(
      res,
      { user: result.user, accessToken: result.accessToken },
      "Login successful",
    );
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) await authService.logout(refreshToken);
    res.clearCookie("refreshToken");
    return sendSuccess(res, null, "Logged out successfully");
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return sendError(res, "Refresh token required", 401);

    const result = await authService.refreshTokens(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(
      res,
      { accessToken: result.accessToken },
      "Token refreshed",
    );
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return sendError(res, "Email required", 422);
    await authService.forgotPassword(email);
    return sendSuccess(
      res,
      null,
      "If the email exists, a reset link has been sent",
    );
  });

  me = asyncHandler(async (req: any, res: Response) => {
    return sendSuccess(res, req.user);
  });
}
