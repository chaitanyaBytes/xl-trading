interface TokenBalance {
  qty: bigint;
  decimals: number;
}

interface UserBalance {
  userId: string;
  usdt: TokenBalance;
  eth: TokenBalance;
  btc: TokenBalance;
  sol: TokenBalance;
}

const toScaledInt = (value: number, decimals: number): bigint => {
  return BigInt(value * Math.pow(10, decimals));
};

const userBalances = new Map<string, UserBalance>();

export const initializeUserBalance = (userId: string) => {
  const defaultUserBalance: UserBalance = {
    userId: userId,
    usdt: { qty: BigInt(10000), decimals: 2 },
    btc: { qty: BigInt(0), decimals: 8 },
    eth: { qty: BigInt(0), decimals: 18 },
    sol: { qty: BigInt(0), decimals: 9 },
  };

  userBalances.set(userId, defaultUserBalance);
  console.log("Initialized balance of user ", userId);
  return defaultUserBalance;
};

export const getUserBalance = (userId: string) => {
  let balance = userBalances.get(userId);

  if (!balance) {
    balance = initializeUserBalance(userId);
  }

  return balance;
};
