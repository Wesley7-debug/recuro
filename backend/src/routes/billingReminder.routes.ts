import { Router } from "express";
import { runBillingReminders } from "../services/billingReminder.service";
import { requireAuth } from "../middleware/auth";
import { sendSuccess } from "../utils/apiResponse";

const router = Router();

// Manual trigger for testing — in production, a cron job calls runBillingReminders directly
router.post("/run", requireAuth, async (_req, res, next) => {
  try {
    await runBillingReminders();
    sendSuccess(res, { message: "Reminders processed" });
  } catch (err) {
    next(err);
  }
});

export default router;
