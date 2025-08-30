export type Trade = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
};

export type Tick = {
  ts: number;
  symbol: string;
  price: number;
};

export type LivePriceFeed = {
  ts: number;
  marketPrice: number;
  symbol: string;
  askPrice: number;
  bidPrice: number;
  spread: number;
};
