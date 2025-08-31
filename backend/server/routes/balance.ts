import express from "express";
import { getBalance } from "../controllers/balance";
import { authMiddleware } from "../middleware/auth";

const balanceRouter = express.Router();

balanceRouter.get("/", authMiddleware, getBalance);

export default balanceRouter;
