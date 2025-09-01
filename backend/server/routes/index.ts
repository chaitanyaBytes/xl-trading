import express from "express";
import userRouter from "./user";
import candleRouter from "./candles";
import tradeRouter from "./trade";
import balanceRouter from "./balance";

const router = express.Router();
router.use("/user", userRouter);
router.use("/candles", candleRouter);
router.use("/trade", tradeRouter);
router.use("/balance", balanceRouter);

export default router;
