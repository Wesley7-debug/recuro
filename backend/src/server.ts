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
import { errorHandler } from "./middleware/errorHandler";
import { runBillingReminders } from "./services/billingReminder.service";

const app = express();

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

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
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
      sameSite: "lax",
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

// Error handling
app.use(errorHandler);

// Billing reminder cron — check every hour
const REMINDER_INTERVAL = 60 * 60 * 1000;
setInterval(() => {
  runBillingReminders().catch((err) => {
    console.error("Billing reminder cron error:", err.message);
  });
}, REMINDER_INTERVAL);

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Recuro API running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
