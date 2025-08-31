import { config, consumer } from "@xl-trading/common";
import type { Tick, LivePriceFeed } from "@xl-trading/common";
import type { ServerWebSocket } from "bun";

const PORT = config.ws.port;
const SPREAD_BASIS_POINTS = 200n; // 200 bps = 1%
const DECIMALS = 6;

// TODO: fix the websocket type later
const wsClients = new Map<string, ServerWebSocket<unknown>>();
const wsToId = new WeakMap<ServerWebSocket<unknown>, string>();

const latestPrices = new Map<string, LivePriceFeed>();

function applySpread(price: bigint): { ask: bigint; bid: bigint } {
  // ask = price * (1 + spread/2)
  // bid = price * (1 - spread/2)

  const halfSpread = SPREAD_BASIS_POINTS / 2n; // 100 bps = 1%
  const ask = (price * (10_000n + halfSpread)) / 10_000n;
  const bid = (price * (10_000n - halfSpread)) / 10_000n;

  return { ask, bid };
}

// kafka consumer for live price feed
consumer.connect();
await consumer.subscribe({ topic: "ticks" });

await consumer.run({
  eachMessage: async ({ message }) => {
    if (!message.value) return;

    const tick: Tick = JSON.parse(message.value.toString());

    if (!tick) return;

    const { ask, bid } = applySpread(BigInt(tick.price));

    console.log(`ask ${ask}, bid: ${bid}`);
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

    broadcastTradeData(livePriceFeed);
  },
});

function broadcastTradeData(livePriceFeed: LivePriceFeed) {
  const message = JSON.stringify(
    {
      type: "liveFeed",
      data: livePriceFeed,
    },
    (key, value) => (typeof value === "bigint" ? value.toString() : value)
  );

  wsClients.forEach((client, clientId) => {
    if (client.readyState === 1) {
      client.send(message);
    } else {
      wsClients.delete(clientId);
      wsToId.delete(client);
      console.log(`Removed dead connection: ${clientId}`);
    }
  });
}

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Hello from wss", { status: 200 });
  },
  websocket: {
    idleTimeout: 60,
    async message(ws, message) {
      console.log(`client message received: ${message}`);

      // TODO: handle the client response well
      // add the functionality to subsicribe to specific assets
      // add  caching as well
    }, // a message is received

    open(ws) {
      const clientId = crypto.randomUUID();

      wsClients.set(clientId, ws);
      wsToId.set(ws, clientId);
      console.log(`new client connected ${clientId}`);

      sendCachedData(ws);
    }, // a socket is opened

    close(ws, code, reason) {
      const clientId = wsToId.get(ws);

      if (clientId) {
        wsClients.delete(clientId);
        wsToId.delete(ws);
        console.log(`Client disconnected: ${clientId}. Reason: ${reason}`);
        console.log(`Total clients: ${wsClients.size}`);
      }
    }, // a socket is closed

    drain(ws) {}, // the socket is ready to receive more data
  },
});

function sendCachedData(ws: ServerWebSocket<unknown>) {
  if (latestPrices.size === 0) {
    console.log("No cached data to send");
    return;
  }

  // Send welcome message with all symbols
  const welcomeMessage = {
    type: "welcome",
    symbols: Array.from(latestPrices.keys()),
    timestamp: Date.now(),
  };

  if (ws.readyState === 1) {
    ws.send(JSON.stringify(welcomeMessage));
  }

  // Send latest price for each symbol
  latestPrices.forEach((priceFeed, symbol) => {
    if (ws.readyState === 1) {
      const message = JSON.stringify({
        type: "liveFeed",
        data: priceFeed,
      });
      ws.send(message);
      console.log(`Sent cached ${symbol} data to new client`);
    }
  });
}

console.log(`Listening on ${server.hostname}:${server.port}`);
