import type { Response } from "express";

export const DECIMALS = 6;
export const ASSETS = ["BTC", "ETH", "SOL"];

export function sendJsonBigInt(
  res: Response,
  payload: any,
  statusCode: number = 200
) {
  res.status(statusCode);
  res.setHeader("Content-Type", "application/json");
  res.send(
    JSON.stringify(payload, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export function replacer(_key: string, value: any) {
  return typeof value === "bigint" ? value.toString() : value;
}

export function scaleToBigint(
  number: number,
  decimals: number = DECIMALS
): bigint {
  return BigInt(Math.round(number * Math.pow(10, decimals)));
}

export function scaleFromBigint(
  scaled: bigint,
  decimals: number = DECIMALS
): number {
  return Number(scaled) / Math.pow(10, decimals);
}
