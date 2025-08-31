import { pool } from "./db";
import type { Tick } from "@xl-trading/common";

export async function batchInsertTicks(ticks: Tick[]) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const placeholders = ticks
      .map(
        (_, idx) =>
          `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`
      )
      .join(", ");

    const flatValues = ticks.flatMap((tick) => [
      new Date(tick.ts),
      tick.symbol,
      tick.price,
      tick.decimals,
    ]);

    const res = await client.query(
      `INSERT INTO ticks (ts, symbol, price, decimals) VALUES ${placeholders}`,
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
