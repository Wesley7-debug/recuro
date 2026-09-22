import { Router } from "express";
import { getSavings } from "../controllers/savings.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getSavings);

export default router;
