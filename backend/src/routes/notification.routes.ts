import { Router } from "express";
import { listNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", listNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;
