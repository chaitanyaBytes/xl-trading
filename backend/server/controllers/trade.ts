import type { Request, Response } from "express";
import { getLatestPriceFeed } from "../lib/livePriceConsumer";
import {
  ASSETS,
  replacer,
  scaleToBigint,
  sendJsonBigInt,
} from "../utils/jsonBigint";
import type { Order } from "../lib/userTradingStore";
import { userTradingStore } from "../lib/userTradingStore";

export interface OpenOrderReq {
  asset: string;
  type: "buy" | "sell";
  margin: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
}

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

    const {
      asset,
      type: side,
      margin,
      leverage,
      stopLoss,
      takeProfit,
    }: OpenOrderReq = req.body;

    if (
      !ASSETS.includes(asset) ||
      !["buy", "sell"].includes(side) ||
      !margin ||
      margin <= 0 ||
      !leverage ||
      leverage < 1
    ) {
      console.log("Invalid Inputs: ", asset, side, leverage, margin);
      res.status(400).json({
        success: false,
        error: `Incorrect inputs`,
      });
    }

    const scaledMargin: bigint = scaleToBigint(margin, 2);
    const symbol = `${asset.toUpperCase()}USDT`;
    const latestPriceFeed = getLatestPriceFeed(symbol);

    if (!latestPriceFeed) {
      res.status(400).json({
        success: false,
        error: `Prices not available for the asset ${symbol}`,
      });
      return;
    }

    let currentPrice: bigint =
      side === "buy"
        ? BigInt(latestPriceFeed.askPrice)
        : BigInt(latestPriceFeed.bidPrice);

    if (!currentPrice || currentPrice <= 0n) {
      res.status(400).json({
        success: false,
        error: "",
      });
    }

    const order: Order = {
      orderId: crypto.randomUUID(),
      userId: userId,
      symbol: symbol,
      type: "open",
      side: side,
      orderType: "market",
      size: scaledMargin * BigInt(leverage),
      leverage: leverage,
      status: "pending",
      timestamp: Date.now(),
    };

    userTradingStore.addOrder(order);

    const executedOrderRes = userTradingStore.executeOrder(order, currentPrice);

    sendJsonBigInt(res, executedOrderRes, executedOrderRes.success ? 200 : 400);

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
