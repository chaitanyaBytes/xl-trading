import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getUserBalance } from "../lib/balance";
import { sendJsonBigInt } from "../utils/jsonBigint";

export const getBalance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: "userId parameter is required",
      });
    }

    const balance = getUserBalance(userId);
    sendJsonBigInt(res, {
      success: true,
      balance,
      meta: { timestamp: new Date(), userId },
    });
    return;
  } catch (error: any) {
    console.log("Error getting balance: ", error);
    res.status(500).json({
      success: false,
      error: "Failed to get balance",
    });
  }
};
