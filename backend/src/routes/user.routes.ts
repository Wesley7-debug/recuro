import { Router } from "express";
import { body } from "express-validator";
import { updateProfile } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(requireAuth);

router.patch(
  "/profile",
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("preferred_currency").optional().isIn(["NGN", "USD", "EUR", "GBP"]).withMessage("Invalid currency"),
    body("email_notifications_enabled").optional().isBoolean().withMessage("Must be a boolean"),
  ],
  validate,
  updateProfile
);

export default router;
