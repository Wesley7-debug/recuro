import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { connectDB } from "./config/database";
import "./config/passport";
import authRoutes from "./routes/auth.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";
import statementRoutes from "./routes/statement.routes";
import billingReminderRoutes from "./routes/billingReminder.routes";
import savingsRoutes from "./routes/savings.routes";
import { errorHandler } from "./middleware/errorHandler";
import { runBillingReminders } from "./services/billingReminder.service";

const app = express();
app.set("trust proxy", 1);

// Security
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Logging
app.use(morgan("dev"));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — sanitized FRONTEND_URL, supports comma-separated list and vercel previews
const allowedOrigins = env.FRONTEND_URL.split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) return callback(null, true);
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

// Sessions stored in MongoDB
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 30 * 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
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

// Error handling
app.use(errorHandler);

// Billing reminder cron — check every hour
const REMINDER_INTERVAL = 60 * 60 * 1000;
setInterval(() => {
  runBillingReminders().catch(() => {});
}, REMINDER_INTERVAL);

async function main() {
  await connectDB();
  app.listen(env.PORT);
}

main().catch(() => {
  process.exit(1);
});
