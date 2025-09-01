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
  realizedPnl: bigint;
  openedAt: number;
  closedAt?: number;
  closedPrice?: bigint;

  stopLoss?: bigint;
  takeProfit?: bigint;
  liquidationPrice: bigint;
}

export interface RiskConfig {
  maxLeverage: number;
  maintainenceMarginRate: number;
  liquidationMarginRate: number;
  minPositionSize: bigint;
  maxPositionSize: bigint;
}

class UserTradingStore {
  private userBalances = new Map<string, UserBalance>(); // userId -> UserBalance
  private openPositions = new Map<string, Position[]>(); // userId -> positions[]
  private allPositions = new Map<string, Position>(); // positionId -> position
  private userOrders = new Map<string, Order[]>(); // userId -> orders[]
  private orderById = new Map<string, Order>(); // orderId -> order

  private riskConfig: RiskConfig = {
    maxLeverage: 100,
    maintainenceMarginRate: 0.05,
    liquidationMarginRate: 0.1,
    minPositionSize: 1000000n,
    maxPositionSize: 1000000000000n,
  };

  private calculateLiquidationPrice(position: Position): bigint {
    const marginRatio = this.riskConfig.liquidationMarginRate;
    const leverageAdjustment = BigInt(Math.floor(marginRatio * 1000000)); // Convert to 6 decimals

    if (position.side === "buy") {
      // Long position liquidates when price drops
      return (
        position.openPrice -
        (position.openPrice * leverageAdjustment) / BigInt(1000000)
      );
    } else {
      // Short position liquidates when price rises
      return (
        position.openPrice +
        (position.openPrice * leverageAdjustment) / BigInt(1000000)
      );
    }
  }

  checkLiquidation(positionId: string, currentPrice: bigint): boolean {
    const position = this.allPositions.get(positionId);
    if (!position || position.status === "closed") return false;

    if (position.side === "buy" && currentPrice <= position.liquidationPrice) {
      this.liquidatePosition(positionId, currentPrice);
      return true;
    }

    if (position.side === "sell" && currentPrice >= position.liquidationPrice) {
      this.liquidatePosition(positionId, currentPrice);
      return true;
    }

    return false;
  }

  private liquidatePosition(
    positionId: string,
    liquidationPrice: bigint
  ): void {
    const position = this.allPositions.get(positionId);
    if (position) {
      console.log(`position ${positionId} liquidated at ${liquidationPrice}`);
      // TODO: send liquidation notification
    }
  }

  validateOrder(
    order: Order,
    userBalance: UserBalance
  ): { valid: boolean; error?: string } {
    if (order.leverage > this.riskConfig.maxLeverage) {
      return {
        valid: false,
        error: `Leverage exceeds maximum of ${this.riskConfig.maxLeverage}x`,
      };
    }

    if (order.size < this.riskConfig.minPositionSize) {
      return { valid: false, error: "Position size too small" };
    }

    if (order.size > this.riskConfig.maxPositionSize) {
      return { valid: false, error: "Position size too large" };
    }

    if (order.type === "open" && order.executedPrice) {
      const requiredMargin =
        (order.size * order.executedPrice) / BigInt(order.leverage) / 1000000n;
      if (userBalance.availableBalance < requiredMargin) {
        return { valid: false, error: "Insufficient margin" };
      }
    }

    return { valid: true };
  }

  openPosition(position: Position): void {
    const userBalance = this.userBalances.get(position.userId);
    if (!userBalance) return;

    position.liquidationPrice = this.calculateLiquidationPrice(position);

    if (userBalance.availableBalance < position.margin) {
      return;
    }

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

  getPosition(positionId: string): Position | null {
    return this.allPositions.get(positionId) || null;
  }

  getUserPositions(userId: string): Position[] {
    return this.openPositions.get(userId) || [];
  }

  //   getPositionsAtRisk(userId: string): Position[] {
  //     const positions = this.getUserPositions(userId);
  //     return positions.filter(p => {
  //         const marginRatio = Math.abs(Number(positions))
  //     })
  //   }

  addOrder(order: Order): void {
    const userOrders = this.userOrders.get(order.userId) || [];
    userOrders.push(order);
    this.userOrders.set(order.userId, userOrders);
    this.orderById.set(order.orderId, order);
  }

  getUserOrders(userId: string): Order[] {
    return this.userOrders.get(userId) || [];
  }

  getOrderById(orderId: string): Order | null {
    return this.orderById.get(orderId) || null;
  }

  getUserBalance(userId: string): UserBalance | null {
    return this.userBalances.get(userId) ?? null;
  }

  updateUserBalance(userId: string, balance: UserBalance): void {
    this.userBalances.set(userId, balance);
  }

  calculateUnrealizedPnL(position: Position, currentPrice: bigint): bigint {
    const multiplier = position.side === "buy" ? 1n : -1n;
    return (currentPrice - position.openPrice) * position.size * multiplier;
  }

  calculateUserBalance(
    userId: string,
    currentPrice: bigint
  ): UserBalance | null {
    const baseBalance = this.userBalances.get(userId);
    if (!baseBalance) return null;

    const positions = this.getUserPositions(userId);

    let lockedMargin = 0n;
    let unrealizedPnl = 0n;
    let multiplier = 1n;

    for (const position of positions) {
      lockedMargin += position.margin;
      multiplier = position.side === "buy" ? 1n : -1n;
      unrealizedPnl +=
        (currentPrice - position.openPrice) * position.size * multiplier;
    }

    return {
      ...baseBalance,
      lockedMargin,
      totalBalance: baseBalance.availableBalance + unrealizedPnl,
    };
  }
}

export const userTradingStore = new UserTradingStore();
