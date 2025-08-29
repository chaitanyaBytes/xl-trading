import { pool } from "../db";

const VIEW_FOR: Record<string, string> = {
  "1m": "candles_1m",
  "5m": "candles_5m",
  "15m": "candles_15m",
  "1h": "candles_1h",
};

export const getLatestCandles = async (
  asset: string,
  interval: string,
  limit: number = 100
) => {
  if (!asset || !interval)
    throw new Error("Asset and Interval are required to see candles");
  if (!VIEW_FOR[interval]) throw new Error("Invalid Interval");
  if (limit > 1000) throw new Error("Limit cannot exceed 1000");

  const client = await pool.connect();

  try {
    const query = `
        SELECT symbol, bucket, open, high, low, close
        FROM ${VIEW_FOR[interval]}
        WHERE symbol = $1
        ORDER BY bucket DESC
        LIMIT $2
    `;

    const res = await client.query(query, [asset, limit]);

    return res.rows;
  } catch (error: any) {
    console.log("Error in getting the latest candles: ", error);
    throw new Error(`Failed to fetch cnadles: ${error.message}`);
  } finally {
    client.release();
  }
};

export const getLatestCandlesInRange = async (
  asset: string,
  interval: string,
  startTime: Date,
  endTime: Date
) => {
  if (!asset || !interval)
    throw new Error("Asset and Interval are required to see candles");
  if (!VIEW_FOR[interval]) throw new Error("Invalid Interval");
  if (startTime >= endTime)
    throw new Error("Start time cannot be greater than end time");

  const client = await pool.connect();

  try {
    const query = `
        SELECT symbol, bucket, open, high, low, close
        FROM ${VIEW_FOR[interval]}
        WHERE asset = $1 AND bucket >= $2 AND bucket <= $3
        ORDER BY bucket ASC
      `;

    const res = await client.query(query, [asset, startTime, endTime]);

    return res.rows;
  } catch (error: any) {
    console.log("Error in getting the latest candles: ", error);
    throw new Error(`Failed to fetch cnadles: ${error.message}`);
  } finally {
    client.release();
  }
};
