import type { Request, Response } from "express";
import { getLatestPrice } from "../lib/livePriceConsumer";
import { sendJsonBigInt } from "../utils/jsonBigint";

export const openTrade = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: "userId parameter is required",
      });
      return;
    }

    const { asset, type, margin, leverage, stopLoss, takeProfit } = req.body;

    const livePriceFeed = getLatestPrice("BTCUSDT");

    if (!livePriceFeed) {
      res.status(400).json({
        success: false,
        error: "No price data available for BTCUSDT",
      });
      return;
    }

    console.log("live price feed from order: ", livePriceFeed.askPrice);

    sendJsonBigInt(res, {
      success: true,
      livePriceFeed,
      meta: { timestamp: new Date(), userId },
    });

    return;
  } catch (error: any) {
    console.log(`Error placing the order: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to place open order",
    });
  }
};

export const closeTrade = async (req: Request, res: Response) => {};

export const getOpenTrades = async (req: Request, res: Response) => {};
