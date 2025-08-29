import { Pool } from "pg";
import { config } from "@xl-trading/common";

export const pool = new Pool({
  connectionString: "postgresql://postgres:password@localhost:5432/xltradingdb",
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("  Connected to TimescaleDB from server");
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});
