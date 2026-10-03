import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const authController = new AuthController();

import { authenticate } from "../../middleware/auth.middleware";

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", authController.forgotPassword);
router.get("/me", authenticate, authController.me);

export default router;
