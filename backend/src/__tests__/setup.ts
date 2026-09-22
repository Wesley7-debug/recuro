import "./mocks";
import express from "express";
import session from "express-session";
import passport from "passport";
import authRoutes from "../routes/auth.routes";
import subscriptionRoutes from "../routes/subscription.routes";
import notificationRoutes from "../routes/notification.routes";
import userRoutes from "../routes/user.routes";
import statementRoutes from "../routes/statement.routes";
import billingReminderRoutes from "../routes/billingReminder.routes";
import { errorHandler } from "../middleware/errorHandler";
import { User } from "../models/User";
import { MagicLink } from "../models/MagicLink";

passport.serializeUser((user: any, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await (User as any).findById(id);
  done(null, user || { _id: id });
});

export function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/transactions/statements", statementRoutes);
  app.use("/api/billing-reminders", billingReminderRoutes);

  app.use(errorHandler);

  return app;
}

export async function createAuthenticatedAgent(app: express.Express) {
  const agent = (await import("supertest")).default.agent(app);

  const user = await (User as any).create({
    name: "testuser",
    email: "eugenefidelis573@gmail.com",
    provider: "local",
    email_notifications_enabled: false,
    preferred_currency: "NGN",
  });

  const magicLink = await (MagicLink as any).create({
    email: "eugenefidelis573@gmail.com",
    token: "auth-test-token-" + Date.now(),
    expiresAt: new Date(Date.now() + 900000),
    used: false,
  });

  await agent.get(`/api/auth/verify?token=${magicLink.token}`);

  const meRes = await agent.get("/api/auth/me");

  return { agent, userId: meRes.body?.data?.id || user._id };
}

export { EmailService } from "../utils/email";
export { runBillingReminders } from "../services/billingReminder.service";
