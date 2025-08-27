import { PricePoller } from "./lib/binance-poll";

enum PAIRS {
  BTCUSDT = "btcusdt",
  SOLUSDT = "solusdt",
  ETHUSDT = "ethusdt",
}

const PAIRS_ARR = ["BTCUSDT", "SOLUSDT", "ETHUSDT"];

PricePoller(PAIRS_ARR);
