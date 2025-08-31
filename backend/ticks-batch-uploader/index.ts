import { batchInsertTicks } from "./lib/batchProcesser";
import { type Tick } from "@xl-trading/common";
import { consumer } from "@xl-trading/common";

const BATCH: Tick[] = [];
const BATCH_SIZE = 100;
const BATCH_TIMEOUT_MS = 5000;
let timer: NodeJS.Timeout | null = null;

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(async () => {
    try {
      if (BATCH.length) {
        const copy = BATCH.splice(0, BATCH.length);
        await batchInsertTicks(copy);
      }
    } finally {
      timer = null;
    }
  }, BATCH_TIMEOUT_MS);
}

await consumer.connect();
await consumer.subscribe({ topic: "ticks", fromBeginning: true });

async function main() {
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const tick: Tick = JSON.parse(message.value.toString(), (key, value) => {
        if (key === "price" && typeof value === "string") return BigInt(value);
        return value;
      });

      if (!tick) return;

      BATCH.push(tick);

      if (BATCH.length >= BATCH_SIZE) {
        // Clear any pending timer since we're flushing immediately
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        const copy = BATCH.splice(0, BATCH.length);
        try {
          const rowsInserted = await batchInsertTicks(copy);
          console.log(`Inserted ${rowsInserted} rows in db`);
        } catch (error) {
          console.error("Error in immediate batch insert:", error);
        }
        return;
      }

      scheduleFlush();
    },
  });
}

main();
