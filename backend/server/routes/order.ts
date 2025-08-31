import express from "express";
import {
  placeOpenOrder,
  placeCloseOrder,
  getOrders,
} from "../controllers/orders";
import { authMiddleware } from "../middleware/auth";
const orderRouter = express.Router();

orderRouter.post("/open", authMiddleware, placeOpenOrder);

orderRouter.post("/close", authMiddleware, placeCloseOrder);

orderRouter.get("/", authMiddleware, getOrders);

export default orderRouter;
