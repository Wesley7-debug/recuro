import { Router } from "express";
import {
  uploadMiddleware,
  uploadStatement,
  addDetectedSubscriptions,
} from "../controllers/statement.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", uploadMiddleware, uploadStatement);
router.post("/confirm", addDetectedSubscriptions);

export default router;
