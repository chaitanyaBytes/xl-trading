import express from "express";
import { getAssets, getCandles, getIntervals } from "../controllers/candles";

const candleRouter = express.Router();

candleRouter.get("", getCandles);

candleRouter.get("/assets", getAssets);

candleRouter.get("/intervals", getIntervals);

export default candleRouter;
