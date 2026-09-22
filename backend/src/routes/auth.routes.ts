import { Router } from "express";
import passport from "passport";
import {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  requestMagicLink,
  verifyMagicLink,
  me,
  logout,
} from "../controllers/auth.controller";

const router = Router();

// Google OAuth
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// GitHub OAuth
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

// Magic link
router.post("/magic-link", requestMagicLink);
router.get("/verify", verifyMagicLink);

// Session
router.get("/me", me);
router.post("/logout", logout);

export default router;
