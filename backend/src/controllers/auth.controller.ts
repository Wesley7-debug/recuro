import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { User } from "../models/User";
import { MagicLink } from "../models/MagicLink";
import { EmailService } from "../utils/email";
import { generateToken } from "../utils/token";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";

export async function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
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
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  passport.authenticate("google", { failureRedirect: `${frontendUrl}/login` })(
    req,
    res,
    () => {
      res.redirect(`${frontendUrl}/dashboard`);
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

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/dashboard`);
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      throw new ApiError(401, "Not authenticated");
    }
    const user = req.user as any;
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
