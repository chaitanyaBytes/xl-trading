export type BookTicker = {
  s: string; // symbol
  b: string; // best bid price
  B: string; // bid qty
  a: string; // best ask price
  A: string; // ask qty
  u?: number;
};

export type Tick = {
  ts: number;
  symbol: string;
  bidPrice: number;
  bidQty: number;
  askPrice: number;
  askQty: number;
};
