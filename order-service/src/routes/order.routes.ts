import { Router } from "express";
import { getOrder } from "../controllers/order.controller";

const router = Router();

router.get("/:orderId", getOrder);

export default router;
