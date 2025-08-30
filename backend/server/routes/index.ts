import express from "express";
import userRouter from "./user";
import candleRouter from "./candles";
import orderRouter from "./order";

const router = express.Router();
router.use("/user", userRouter);
router.use("/candles", candleRouter);
router.use("/orders", orderRouter);

export default router;
