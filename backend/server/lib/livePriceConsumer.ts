import { connectKafkaConsumer, serverConsumer } from "@xl-trading/common";
import type { Tick, LivePriceFeed } from "@xl-trading/common";

const SPREAD_BASIS_POINTS = 100n; // 100 bps = 1%
const DECIMALS = 6;

// In-memory price store
export const latestPrices = new Map<string, LivePriceFeed>();

export function applySpread(price: bigint): { ask: bigint; bid: bigint } {
  const halfSpread = SPREAD_BASIS_POINTS / 2n;
  const ask = (price * (10_000n + halfSpread)) / 10_000n;
  const bid = (price * (10_000n - halfSpread)) / 10_000n;

  return { ask, bid };
}

export function getLatestPriceFeed(symbol: string): LivePriceFeed | null {
  return latestPrices.get(symbol) || null;
}

export function getAllLatestPriceFeeds(): Map<string, LivePriceFeed> {
  return new Map(latestPrices);
}

// Initialize Kafka consumer
try {
  await connectKafkaConsumer();

  await serverConsumer.subscribe({ topic: "ticks" });
  console.log("Subscribed to 'ticks' topic");

  await serverConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const tick: Tick = JSON.parse(message.value.toString());
      if (!tick) return;

      const { ask, bid } = applySpread(BigInt(tick.price));

      const livePriceFeed: LivePriceFeed = {
        ts: tick.ts,
        symbol: tick.symbol,
        marketPrice: tick.price,
        askPrice: ask,
        bidPrice: bid,
        spreadBP: SPREAD_BASIS_POINTS,
        decimals: DECIMALS,
      };

      latestPrices.set(tick.symbol, livePriceFeed);
    },
  });
} catch (error) {
  console.error("Error initializing price consumer:", error);
  throw error;
}
