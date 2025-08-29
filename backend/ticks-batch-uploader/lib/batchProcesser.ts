import { pool } from "./db";
import type { Tick } from "@xl-trading/common";

export async function batchInsertTicks(ticks: Tick[]) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const placeholders = ticks
      .map((_, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`)
      .join(", ");

    const flatValues = ticks.flatMap((tick) => [
      new Date(tick.ts),
      tick.symbol,
      tick.price,
    ]);

    const res = await client.query(
      `INSERT INTO ticks (ts, symbol, price) VALUES ${placeholders}`,
      flatValues
    );

    await client.query("COMMIT");

    return res.rowCount;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error inserting ticks:", error);
    throw error;
  } finally {
    client.release();
  }
}
