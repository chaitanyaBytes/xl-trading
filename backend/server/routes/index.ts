import express from "express";
import userRouter from "./user";
import candleRouter from "./candles";

const router = express.Router();
router.use("/user", userRouter);
router.use("/candles", candleRouter);

export default router;
