import type { Request, Response } from "express";
import { getLatestCandlesInRange, getLatestCandles } from "../lib/candles";
import { pool } from "../db";
const VALID_ASSETS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const VALID_INTERVALS = ["1m", "5m", "15m", "1h"];

export const getCandles = async (req: Request, res: Response) => {
  try {
    const asset = (req.query.asset as string) || "BTCUSDT";
    const interval = (req.query.interval as string) || "15m";
    const limit = (req.query.limit as string) || "100";
    const startTime = (req.query.startTime as string) || undefined;
    const endTime = (req.query.endTime as string) || undefined;

    if (!asset || !VALID_ASSETS.includes(asset)) {
      return res.status(400).json({ success: false, error: "Invalid asset" });
    }
    if (!interval || !VALID_INTERVALS.includes(interval)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid interval" });
    }

    let rows;

    if (startTime && endTime) {
      rows = await getLatestCandlesInRange(
        asset,
        interval,
        new Date(startTime),
        new Date(endTime)
      );
    } else {
      rows = await getLatestCandles(asset, interval, Number(limit));
    }

    const candles = rows.map((c: any) => {
      const t = new Date(c.bucket).getTime() / 1000;
      return {
        time: Math.floor(t),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      };
    });

    res.status(200).json({
      success: true,
      data: candles.reverse(),
      meta: { asset, interval, count: candles.length },
    });
  } catch (error) {
    console.error("getCandles error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch candles" });
  }
};

export const getIntervals = async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: ["1m", "5m", "15m", "1h"],
  });
};

export const getAssets = async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT DISTINCT asset FROM ticks ORDER BY symbol`
      );
      res.json({ success: true, data: r.rows.map((x: any) => x.symbol) });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("assets:", e);
    res.status(500).json({ success: false, error: "Failed to fetch assets" });
  }
};
