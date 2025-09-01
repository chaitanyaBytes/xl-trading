import type { LivePriceFeed } from "@xl-trading/common";

interface UserBalance {
  userId: string;
  availableBalance: bigint;
  lockedMargin: bigint;
  totalBalance: bigint; // locked + available
  lastUpdated: number;
}

export interface Order {
  orderId: string;
  userId: string;
  symbol: string;
  type: "open" | "close";
  side: "buy" | "sell";
  orderType: "market" | "limit";
  size: bigint;
  leverage: number;
  limitPrice?: bigint;
  executedPrice?: bigint;
  status: "pending" | "filled" | "cancelled" | "rejected";
  timestamp: number;
  executedAt?: number;
}

export interface Position {
  positionId: string;
  userId: string;
  symbol: string;
  side: "buy" | "sell";
  size: bigint;
  openPrice: bigint;
  leverage: number;
  margin: bigint; // size * openPrice / leverage
  status: "open" | "closed";
  unrealizedPnl: bigint;
  realizedPnl: bigint;
  openedAt: number;
  closedAt?: number;
  closedPrice?: bigint;

  stopLoss?: bigint;
  takeProfit?: bigint;
  liquidationPrice: bigint;
}

class UserTradingStore {
  private userBalances = new Map<string, UserBalance>(); // userId -> UserBalance
  private openPositions = new Map<string, Position[]>(); // userId -> positions[]
  private allPositions = new Map<string, Position>(); // positionId -> position
  private userOrders = new Map<string, Order[]>(); // userId -> orders[]
  private orderById = new Map<string, Order>(); // orderId -> order

  openPosition(position: Position): void {
    const userBalance = this.userBalances.get(position.userId);
    if (!userBalance) return;

    userBalance.availableBalance -= position.margin;
    userBalance.lockedMargin += position.margin;
    userBalance.lastUpdated = Date.now();

    this.userBalances.set(position.userId, userBalance);

    const userPositions = this.openPositions.get(position.userId) || [];
    userPositions.push(position);
    this.openPositions.set(position.userId, userPositions);
    this.allPositions.set(position.positionId, position);
  }

  closePosition(positionId: string, closePrice: bigint): Position | null {
    const position = this.allPositions.get(positionId);
    if (!position || position.status === "closed") return null;

    // calculate realised pnl
    const priceDiff = closePrice - position.openPrice;
    const multiplier = position.side === "buy" ? 1n : -1n;
    const realizedPnl = priceDiff * position.size * multiplier;
    position.realizedPnl = realizedPnl;

    position.status = "closed";
    position.closedAt = Date.now();
    position.closedPrice = closePrice;

    const userBalance = this.userBalances.get(position.userId);
    if (userBalance) {
      userBalance.availableBalance += position.margin + realizedPnl;
      userBalance.lockedMargin -= position.margin;
      userBalance.lastUpdated = Date.now();
      this.userBalances.set(position.userId, userBalance);
    }

    const userPositions = this.openPositions.get(position.userId);
    const filteredPositions = userPositions?.filter(
      (p) => p.positionId !== positionId
    );
    this.openPositions.set(position.userId, filteredPositions ?? []);

    return position;
  }

  updatePosition(positionId: string, currentPrice: bigint): void {
    const position = this.allPositions.get(positionId);
    if (!position || position.status === "closed") return;

    const priceDiff = currentPrice - position.openPrice;
    const multiplier = position.side === "buy" ? 1n : -1n;
    const unrealizedPnl = priceDiff * position.size * multiplier;

    position.unrealizedPnl = unrealizedPnl;
  }

  getUserPosition(positionId: string): Position | null {
    return this.allPositions.get(positionId) || null;
  }

  getUserPositions(userId: string): Position[] {
    return this.openPositions.get(userId) || [];
  }

  addOrder(order: Order): void {
    const userOrders = this.userOrders.get(order.userId) || [];
    userOrders.push(order);
    this.userOrders.set(order.userId, userOrders);
    this.orderById.set(order.orderId, order);
  }

  getUserBalance(userId: string): UserBalance | null {
    return this.userBalances.get(userId) ?? null;
  }

  updateUserBalance(userId: string, balance: UserBalance): void {
    this.userBalances.set(userId, balance);
  }

  calculateUnrealizedPnL(position: Position, livePrice: bigint): bigint {
    const multiplier = position.side === "buy" ? 1n : -1n;
    return (livePrice - position.openPrice) * position.size * multiplier;
  }

  calculateUserBalance(userId: string): UserBalance | null {
    const baseBalance = this.userBalances.get(userId);
    if (!baseBalance) return null;

    const positions = this.getUserPositions(userId);

    let lockedMargin = 0n;
    let unrealizedPnl = 0n;

    for (const position of positions) {
      lockedMargin += position.margin;
      unrealizedPnl += position.unrealizedPnl;
    }

    return {
      ...baseBalance,
      lockedMargin,
      totalBalance: baseBalance.availableBalance + unrealizedPnl,
    };
  }
}

export const userTradingStore = new UserTradingStore();
