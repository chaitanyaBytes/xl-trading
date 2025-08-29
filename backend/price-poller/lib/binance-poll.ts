import { sendTicksToKafka } from "./kafka-send";
import type { Trade, Tick } from "@xl-trading/common";

export const PricePoller = (pairs: string[]) => {
  const streams = pairs.map((p) => `${p.toLocaleLowerCase()}@trade`).join("/");

  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  let ws: WebSocket | null = null;
  let keep: NodeJS.Timeout | null = null;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("Binance conncted: ", pairs.join(", "));
      keep = setInterval(() => {
        if (ws?.readyState === ws?.OPEN) ws?.ping();
      }, 30_000);
    };

    ws.onmessage = async (event) => {
      try {
        const parsedData = JSON.parse(event.data);

        const tickerData: Trade = parsedData.data ?? parsedData;

        if (!tickerData?.s) {
          console.log("symbol does not exist");
          return;
        }

        console.log(tickerData.s, tickerData.T, tickerData.p);

        const tickData: Tick = {
          ts: tickerData.T,
          symbol: tickerData.s,
          price: parseFloat(tickerData.p),
        };

        await sendTicksToKafka(tickData);
      } catch {}
    };

    ws.onclose = () => {
      console.log("Binance Disconnected. Retrying..");
      if (keep) clearInterval(keep);
      setTimeout(connect, 2000); // Try to reconnect after 2 seconds
    };

    ws.onerror = (event) => {
      console.log("ws error: ", event);
      ws?.close(400);
    };
  };

  connect();
};
