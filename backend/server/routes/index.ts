import express from "express";
import userRouter from "./user";
import candleRouter from "./candles";
import orderRouter from "./order";
import balanceRouter from "./balance";

const router = express.Router();
router.use("/user", userRouter);
router.use("/candles", candleRouter);
router.use("/orders", orderRouter);
router.use("/balance", balanceRouter);

export default router;
