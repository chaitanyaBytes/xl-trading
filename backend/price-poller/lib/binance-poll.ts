export type BookTicker = {
  s: string; // symbol
  b: string; // best bid price
  B: string; // bid qty
  a: string; // best ask price
  A: string; // ask qty
  u?: number;
};

export const PricePoller = (pairs: string[]) => {
  const streams = pairs
    .map((p) => `${p.toLocaleLowerCase()}@bookTicker`)
    .join("/");

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

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);

        const tickerData: BookTicker = parsedData.data ?? parsedData;

        if (!tickerData?.s) {
          console.log("symbol does not exist");
          return;
        }

        console.log(
          tickerData.s,
          Date.now(),
          tickerData.b,
          tickerData.B,
          tickerData.a,
          tickerData.A
        );
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
