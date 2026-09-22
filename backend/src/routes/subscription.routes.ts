import { Router } from "express";
import { body } from "express-validator";
import {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "../controllers/subscription.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(requireAuth);

router.get("/", listSubscriptions);
router.get("/:id", getSubscription);

router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("provider").trim().notEmpty().withMessage("Provider is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
    body("billingCycle").isIn(["weekly", "monthly", "quarterly", "yearly"]).withMessage("Invalid billing cycle"),
    body("nextBillingDate").isISO8601().withMessage("Valid next billing date is required"),
  ],
  validate,
  createSubscription
);

router.patch(
  "/:id",
  [
    body("amount").optional().isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
    body("billingCycle").optional().isIn(["weekly", "monthly", "quarterly", "yearly"]).withMessage("Invalid billing cycle"),
    body("status").optional().isIn(["active", "cancelled", "paused"]).withMessage("Invalid status"),
  ],
  validate,
  updateSubscription
);

router.delete("/:id", deleteSubscription);

export default router;
