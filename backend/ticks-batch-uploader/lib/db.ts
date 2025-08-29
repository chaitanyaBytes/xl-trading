import { Pool } from "pg";
import { config } from "@xl-trading/common";

export const pool = new Pool({
  connectionString: "postgresql://postgres:password@localhost:5432/xltradingdb",
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("Connected to TimescaleDB");
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

pool.on("remove", (client) => {
  console.log("Client removed from pool");
});

export async function closeDatabaseConnection() {
  try {
    await pool.end();
    console.log("client has disconnected");
  } catch (error: any) {
    console.error("Error disconnecting the database: ", error);
  }
}

export async function testConnection() {
  let retries = 3;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      await client.query("SELECT NOW()");

      client.release();
      // console.log("Database connection test successful");
    } catch (error) {
      retries--;
      console.log(`Error in connecting with database. Retries left ${retries}`);

      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}

testConnection().catch((error) => {
  console.error("Failed to establish database connection:", error);
  process.exit(1);
});
