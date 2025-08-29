import express from "express";
import { getCandles } from "../controllers/candles";

const candleRouter = express.Router();

candleRouter.get("", getCandles);

export default candleRouter;
