import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import passport from "passport";
import { env } from "./config/env";
import "./config/passport";
import authRoutes from "./routes/auth.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";
import statementRoutes from "./routes/statement.routes";
import billingReminderRoutes from "./routes/billingReminder.routes";
import savingsRoutes from "./routes/savings.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = env.FRONTEND_URL.split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) return callback(null, true);
      // Allow any vercel preview for this project to avoid CORS lockout
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
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
app.use("/api/savings", savingsRoutes);

app.use(errorHandler);

export default app;
