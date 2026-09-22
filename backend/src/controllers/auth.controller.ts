import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { env } from "../config/env";
import { User } from "../models/User";
import { MagicLink } from "../models/MagicLink";
import { EmailService } from "../utils/email";
import { generateToken } from "../utils/token";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { signAuthToken, verifyAuthToken } from "../utils/authToken";

export async function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })(req, res, next);
}

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const frontendUrl = env.FRONTEND_URL;
  passport.authenticate("google", { failureRedirect: `${frontendUrl}/login`, session: false })(
    req,
    res,
    (err: any) => {
      if (err) return next(err);
      const user = req.user as any;
      if (!user) return res.redirect(`${frontendUrl}/login`);

      const token = signAuthToken(user);
      res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
    }
  );
}

export async function requestMagicLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, emailConsent, preferredCurrency } = req.body;
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await MagicLink.deleteMany({ email, used: false });
    await MagicLink.create({ email, token, expiresAt });

    // Store consent preferences for when the user is created
    const metadata: Record<string, any> = {};
    if (emailConsent !== undefined) metadata.emailConsent = emailConsent;
    if (preferredCurrency) metadata.preferredCurrency = preferredCurrency;

    // Attach metadata to the magic link for retrieval during verification
    await MagicLink.findOneAndUpdate(
      { token },
      { $set: { metadata } },
    );

    await EmailService.sendVerificationEmail(email, token);

    sendSuccess(res, { message: "Check your email for a sign-in link" });
  } catch (error) {
    next(error);
  }
}

export async function verifyMagicLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      throw new ApiError(400, "Invalid token");
    }

    const magicLink = await MagicLink.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!magicLink) {
      throw new ApiError(400, "Invalid or expired link");
    }

    magicLink.used = true;
    await magicLink.save();

    let user = await User.findOne({ email: magicLink.email });
    const isNewUser = !user;

    if (!user) {
      const name = magicLink.email.split("@")[0];
      const metadata = (magicLink as any).metadata || {};
      user = await User.create({
        name,
        email: magicLink.email,
        provider: "local",
        email_notifications_enabled: metadata.emailConsent === true,
        preferred_currency: metadata.preferredCurrency || "NGN",
      });
    }

    if (isNewUser) {
      await EmailService.sendWelcomeEmail(user.email, user.name);
    }

    const authToken = signAuthToken(user);
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(authToken)}`);
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    let user = req.user as any;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (bearerToken) {
      const payload = verifyAuthToken(bearerToken);
      if (!payload.sub) throw new ApiError(401, "Not authenticated");
      user = await User.findById(payload.sub);
    } else if (!req.isAuthenticated()) {
      throw new ApiError(401, "Not authenticated");
    }

    if (!user) {
      throw new ApiError(401, "Not authenticated");
    }

    sendSuccess(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      preferred_currency: user.preferred_currency,
      email_notifications_enabled: user.email_notifications_enabled,
      budgetCaps: (user as any).budgetCaps || {},
      budget_caps: (user as any).budgetCaps || {},
      provider: user.provider,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return sendSuccess(res, { message: "Logged out" });
    }

    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err2) => {
        if (err2) return next(err2);
        res.clearCookie("connect.sid");
        sendSuccess(res, { message: "Logged out" });
      });
    });
  } catch (error) {
    next(error);
  }
}
