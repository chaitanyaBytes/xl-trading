import express from "express";
import { openTrade, closeTrade, getOpenTrades } from "../controllers/trade";
import { authMiddleware } from "../middleware/auth";
const tradeRouter = express.Router();

tradeRouter.post("/open", authMiddleware, openTrade);

tradeRouter.post("/close", authMiddleware, closeTrade);

tradeRouter.get("/", authMiddleware, getOpenTrades);

export default tradeRouter;
