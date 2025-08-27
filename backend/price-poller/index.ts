import { PricePoller } from "./lib/binance-poll";
import {
  connectKafkaProducer,
  disconnectKafkaProducer,
} from "@xl-trading/common";

enum PAIRS {
  BTCUSDT = "btcusdt",
  SOLUSDT = "solusdt",
  ETHUSDT = "ethusdt",
}

const PAIRS_ARR = ["BTCUSDT", "SOLUSDT", "ETHUSDT"];

async function startPricePoller() {
  try {
    console.log("Connecting to Kafka...");
    await connectKafkaProducer();
    console.log("Kafka producer connected successfully!");

    console.log("Starting price poller...");
    PricePoller(PAIRS_ARR);
  } catch (error) {
    console.error("Failed to start price poller:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  await disconnectKafkaProducer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  await disconnectKafkaProducer();
  process.exit(0);
});

startPricePoller().catch(console.error);
