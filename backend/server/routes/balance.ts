import express from "express";
import { getBalance } from "../controllers/balance";

const balanceRouter = express.Router();

balanceRouter.get("/", getBalance);

export default balanceRouter;
