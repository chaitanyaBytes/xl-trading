import express from "express";
import {
  placeOpenOrder,
  placeCloseOrder,
  getOrders,
} from "../controllers/orders";
const orderRouter = express.Router();

orderRouter.post("/open", placeOpenOrder);

orderRouter.post("/close", placeCloseOrder);

orderRouter.get("/", getOrders);

export default orderRouter;
